import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";
import { config } from "../config";

const router = Router();
router.use(authRequired);

// ─── helpers ───

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    + "-" + crypto.randomBytes(3).toString("hex");
}

function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("base64url");
}

// ─── GET /api/workspaces — list my workspaces ───

router.get("/", async (req: Request, res: Response) => {
  try {
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: req.user!.userId },
      include: {
        workspace: {
          include: { _count: { select: { memberships: true } } },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      avatarUrl: m.workspace.avatarUrl,
      role: m.role,
      members: m.workspace._count.memberships,
      joinedAt: m.joinedAt,
    }));

    res.json({ workspaces });
  } catch (err) {
    console.error("Workspaces list error:", err);
    res.status(500).json({ error: "Ошибка получения рабочих областей" });
  }
});

// ─── POST /api/workspaces — create new workspace ───

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Название рабочей области обязательно" });
      return;
    }

    const slug = generateSlug(name.trim());

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        memberships: {
          create: {
            userId: req.user!.userId,
            role: "admin",
          },
        },
      },
      include: { _count: { select: { memberships: true } } },
    });

    // Issue token with workspace context
    const token = signToken({
      userId: req.user!.userId,
      email: req.user!.email,
      workspaceId: workspace.id,
      workspaceRole: "admin",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: "admin",
        members: workspace._count.memberships,
      },
      token,
    });
  } catch (err) {
    console.error("Workspace create error:", err);
    res.status(500).json({ error: "Ошибка создания рабочей области" });
  }
});

// ─── POST /api/workspaces/select/:id — switch to a workspace (issues new JWT) ───

router.post("/select/:id", async (req: Request, res: Response) => {
  try {
    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.userId,
          workspaceId: req.params.id,
        },
      },
      include: { workspace: true },
    });

    if (!membership) {
      res.status(403).json({ error: "Нет доступа к этой рабочей области" });
      return;
    }

    const token = signToken({
      userId: req.user!.userId,
      email: req.user!.email,
      workspaceId: membership.workspaceId,
      workspaceRole: membership.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
      },
      token,
    });
  } catch (err) {
    console.error("Workspace select error:", err);
    res.status(500).json({ error: "Ошибка выбора рабочей области" });
  }
});

// ─── POST /api/workspaces/join — join workspace by invite token ───

router.post("/join", async (req: Request, res: Response) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken?.trim()) {
      res.status(400).json({ error: "Токен приглашения обязателен" });
      return;
    }

    const invite = await prisma.workspaceInviteToken.findUnique({
      where: { token: inviteToken.trim() },
      include: { workspace: true },
    });

    // Validate token
    if (!invite) {
      res.status(404).json({ error: "Токен приглашения не найден" });
      return;
    }
    if (!invite.isActive) {
      res.status(410).json({ error: "Токен приглашения деактивирован" });
      return;
    }
    if (invite.expiresAt < new Date()) {
      res.status(410).json({ error: "Токен приглашения просрочен" });
      return;
    }
    if (invite.usageLimit > 0 && invite.usageCount >= invite.usageLimit) {
      res.status(410).json({ error: "Токен приглашения исчерпан" });
      return;
    }

    // Check if already a member
    const existing = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.userId,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existing) {
      res.status(409).json({ error: "Вы уже участник этой рабочей области" });
      return;
    }

    // Join workspace + increment usage counter
    const [membership] = await prisma.$transaction([
      prisma.workspaceMembership.create({
        data: {
          userId: req.user!.userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
        include: { workspace: true },
      }),
      prisma.workspaceInviteToken.update({
        where: { id: invite.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    // Issue token with workspace context
    const token = signToken({
      userId: req.user!.userId,
      email: req.user!.email,
      workspaceId: membership.workspaceId,
      workspaceRole: membership.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
      },
      token,
    });
  } catch (err) {
    console.error("Workspace join error:", err);
    res.status(500).json({ error: "Ошибка присоединения к рабочей области" });
  }
});

// ═══════════════════════════════════════════════
// Below: admin-only endpoints for the CURRENT workspace
// ═══════════════════════════════════════════════

// ─── GET /api/workspaces/current — info about current workspace ───

router.get("/current", workspaceRequired, async (req: Request, res: Response) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user!.workspaceId! },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, initials: true, email: true, jobTitle: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { memberships: true } },
      },
    });

    if (!workspace) {
      res.status(404).json({ error: "Рабочая область не найдена" });
      return;
    }

    res.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        avatarUrl: workspace.avatarUrl,
        members: workspace.memberships.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          initials: m.user.initials,
          email: m.user.email,
          jobTitle: m.user.jobTitle,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        memberCount: workspace._count.memberships,
      },
    });
  } catch (err) {
    console.error("Workspace current error:", err);
    res.status(500).json({ error: "Ошибка получения рабочей области" });
  }
});

// ─── POST /api/workspaces/invite — generate invite token (admin only) ───

router.post("/invite", workspaceRequired, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { role, expiresInDays, usageLimit } = req.body;
    const assignRole = ["admin", "member", "viewer"].includes(role) ? role : "member";
    const days = Math.min(Math.max(parseInt(expiresInDays) || 7, 1), 365);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const invite = await prisma.workspaceInviteToken.create({
      data: {
        token: generateInviteCode(),
        role: assignRole,
        expiresAt,
        usageLimit: parseInt(usageLimit) || 0,
        workspaceId: req.user!.workspaceId!,
        createdById: req.user!.userId,
      },
    });

    res.status(201).json({
      invite: {
        token: invite.token,
        role: invite.role,
        expiresAt: invite.expiresAt,
        usageLimit: invite.usageLimit,
      },
    });
  } catch (err) {
    console.error("Invite create error:", err);
    res.status(500).json({ error: "Ошибка создания приглашения" });
  }
});

// ─── GET /api/workspaces/invites — list invite tokens (admin only) ───

router.get("/invites", workspaceRequired, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const invites = await prisma.workspaceInviteToken.findMany({
      where: { workspaceId: req.user!.workspaceId! },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      invites: invites.map((i) => ({
        id: i.id,
        token: i.token,
        role: i.role,
        expiresAt: i.expiresAt,
        usageLimit: i.usageLimit,
        usageCount: i.usageCount,
        isActive: i.isActive,
        createdBy: i.createdBy.name,
        createdAt: i.createdAt,
        isExpired: i.expiresAt < new Date(),
      })),
    });
  } catch (err) {
    console.error("Invites list error:", err);
    res.status(500).json({ error: "Ошибка получения приглашений" });
  }
});

// ─── DELETE /api/workspaces/invites/:id — revoke invite token (admin only) ───

router.delete("/invites/:id", workspaceRequired, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const invite = await prisma.workspaceInviteToken.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId! },
    });
    if (!invite) {
      res.status(404).json({ error: "Приглашение не найдено" });
      return;
    }

    await prisma.workspaceInviteToken.update({
      where: { id: invite.id },
      data: { isActive: false },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Invite revoke error:", err);
    res.status(500).json({ error: "Ошибка отзыва приглашения" });
  }
});

// ─── PATCH /api/workspaces/members/:userId — change member role (admin only) ───

router.patch("/members/:userId", workspaceRequired, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!["admin", "member", "viewer"].includes(role)) {
      res.status(400).json({ error: "Роль должна быть: admin, member или viewer" });
      return;
    }

    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.params.userId,
          workspaceId: req.user!.workspaceId!,
        },
      },
    });

    if (!membership) {
      res.status(404).json({ error: "Участник не найден" });
      return;
    }

    const updated = await prisma.workspaceMembership.update({
      where: { id: membership.id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ member: { ...updated.user, role: updated.role } });
  } catch (err) {
    console.error("Member role update error:", err);
    res.status(500).json({ error: "Ошибка изменения роли" });
  }
});

// ─── DELETE /api/workspaces/members/:userId — remove member (admin only) ───

router.delete("/members/:userId", workspaceRequired, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    // Can't remove yourself
    if (req.params.userId === req.user!.userId) {
      res.status(400).json({ error: "Нельзя удалить себя из рабочей области" });
      return;
    }

    await prisma.workspaceMembership.deleteMany({
      where: {
        userId: req.params.userId,
        workspaceId: req.user!.workspaceId!,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Member remove error:", err);
    res.status(500).json({ error: "Ошибка удаления участника" });
  }
});

export default router;
