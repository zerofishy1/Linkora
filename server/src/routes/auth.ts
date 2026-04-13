import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { authRequired } from "../middleware/auth";
import { config } from "../config";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, пароль и имя обязательны" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Пароль должен содержать минимум 6 символов" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Пользователь с таким email уже существует" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const initials = name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        settings: { create: {} },
      },
      select: {
        id: true,
        email: true,
        name: true,
        initials: true,
        jobTitle: true,
        tag: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Base token — no workspace yet
    const token = signToken({ userId: user.id, email: user.email });

    res.cookie("token", token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email и пароль обязательны" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Неверный email или пароль" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Неверный email или пароль" });
      return;
    }

    // Check how many workspaces
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: user.id },
      include: { workspace: true },
    });

    let token: string;
    let activeWorkspace: any = null;

    if (memberships.length === 1) {
      // Auto-select the only workspace
      const m = memberships[0];
      token = signToken({
        userId: user.id,
        email: user.email,
        workspaceId: m.workspaceId,
        workspaceRole: m.role,
      });
      activeWorkspace = {
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
      };
    } else {
      // No workspace or multiple → base token, frontend will handle selection
      token = signToken({ userId: user.id, email: user.email });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token, workspace: activeWorkspace });
  } catch (err: any) {
    console.error("Login error:", err?.message, err?.stack);
    res.status(500).json({ error: "Ошибка входа", detail: err?.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

// GET /api/auth/me — returns user + current workspace from JWT
router.get("/me", authRequired, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        initials: true,
        jobTitle: true,
        tag: true,
        avatarUrl: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    // If workspace is in JWT, return it
    let workspace: any = null;
    if (req.user!.workspaceId) {
      const membership = await prisma.workspaceMembership.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user!.userId,
            workspaceId: req.user!.workspaceId,
          },
        },
        include: { workspace: true },
      });
      if (membership) {
        workspace = {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug,
          role: membership.role,
        };
      }
    }

    res.json({ user, workspace });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Ошибка получения профиля" });
  }
});

// PATCH /api/auth/profile
router.patch("/profile", authRequired, async (req: Request, res: Response) => {
  try {
    const { name, jobTitle, tag } = req.body;
    const data: any = {};

    if (name !== undefined) {
      data.name = name;
      data.initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (jobTitle !== undefined) data.jobTitle = jobTitle;
    if (tag !== undefined) data.tag = tag;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        initials: true,
        jobTitle: true,
        tag: true,
        avatarUrl: true,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

export default router;
