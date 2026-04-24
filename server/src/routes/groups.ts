import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

// ─── Helper: safely extract route param as string (Express 5 returns string | string[]) ───

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

// ─── Helper: get user's membership in a group ───

async function getMyGroupRole(userId: string, groupId: string): Promise<string | null> {
  const m = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return m?.role || null;
}

// ─── GET / — List groups ───

router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, filter, privacy, type } = req.query;
    const wsId = req.user!.workspaceId!;
    const userId = req.user!.userId;
    const where: any = { workspaceId: wsId };

    // Search
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { summary: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    // Filter
    const f = String(filter || "active");
    if (f === "active") where.isArchived = false;
    else if (f === "archived") where.isArchived = true;
    else if (f === "my") {
      where.isArchived = false;
      where.members = { some: { userId } };
    }
    // "all" — no extra filter

    // Privacy
    if (privacy) where.privacy = String(privacy).toUpperCase();

    // Type
    if (type) where.type = String(type).toLowerCase();

    const groups = await prisma.group.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { lastActivityAt: "desc" },
    });

    // Attach myRole for each group
    const membershipMap = new Map<string, string>();
    if (groups.length > 0) {
      const memberships = await prisma.groupMember.findMany({
        where: { userId, groupId: { in: groups.map((g) => g.id) } },
      });
      memberships.forEach((m) => membershipMap.set(m.groupId, m.role));
    }

    const items = groups.map((g) => ({
      id: g.id,
      title: g.title,
      summary: g.summary,
      description: g.description,
      type: g.type,
      privacy: g.privacy,
      avatarUrl: g.avatarUrl,
      isArchived: g.isArchived,
      owner: g.owner,
      memberCount: g._count.members,
      postCount: g._count.posts,
      myRole: membershipMap.get(g.id) || null,
      lastActivityAt: g.lastActivityAt,
      createdAt: g.createdAt,
    }));

    res.json({ groups: items });
  } catch (err) {
    console.error("Groups list error:", err);
    res.status(500).json({ error: "Ошибка получения групп" });
  }
});

// ─── GET /:id — Group detail ───

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const wsId = req.user!.workspaceId!;
    const group = await prisma.group.findFirst({
      where: { id: param(req, "id"), workspaceId: wsId },
      include: {
        owner: { select: { id: true, name: true, initials: true, jobTitle: true } },
        members: {
          include: { user: { select: { id: true, name: true, initials: true, jobTitle: true, avatarUrl: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { members: true, posts: true, tasks: true, events: true, files: true } },
      },
    });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);

    // For CLOSED groups, non-members see limited info
    if (group.privacy === "CLOSED" && !myRole) {
      res.json({
        group: {
          id: group.id,
          title: group.title,
          summary: group.summary,
          type: group.type,
          privacy: group.privacy,
          avatarUrl: group.avatarUrl,
          isArchived: group.isArchived,
          owner: group.owner,
          memberCount: group._count.members,
          myRole: null,
          canJoin: false,
        },
      });
      return;
    }

    // Count overdue tasks (deadline in the past, still active)
    const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const overdueCount = await prisma.task.count({
      where: {
        groupId: group.id,
        workspaceId: wsId,
        status: "active",
        deadline: { not: "", lt: now },
      },
    });

    res.json({
      group: {
        ...group,
        memberCount: group._count.members,
        postCount: group._count.posts,
        taskCount: group._count.tasks,
        taskOverdueCount: overdueCount,
        eventCount: group._count.events,
        fileCount: group._count.files,
        defaultLanding: group.defaultLanding,
        enabledTools: group.enabledTools,
        menuOrder: group.menuOrder,
        dateStart: group.dateStart,
        dateEnd: group.dateEnd,
        efficiency: group.efficiency,
        myRole,
        canJoin: !myRole && group.privacy === "OPEN",
      },
    });
  } catch (err) {
    console.error("Group detail error:", err);
    res.status(500).json({ error: "Ошибка получения группы" });
  }
});

// ─── POST / — Create group ───

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { title, summary, description, type, privacy } = req.body;
    if (!title) { res.status(400).json({ error: "Название группы обязательно" }); return; }

    const group = await prisma.group.create({
      data: {
        title,
        summary: summary || "",
        description: description || "",
        type: type || "group",
        privacy: privacy || "OPEN",
        ownerId: req.user!.userId,
        workspaceId: req.user!.workspaceId!,
        members: { create: { userId: req.user!.userId, role: "owner" } },
      },
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        _count: { select: { members: true } },
      },
    });

    res.status(201).json({
      group: { ...group, memberCount: group._count.members, myRole: "owner" },
    });
  } catch (err) {
    console.error("Group create error:", err);
    res.status(500).json({ error: "Ошибка создания группы" });
  }
});

// ─── PATCH /:id — Update group ───

router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Only owner/moderator or workspace admin can edit
    const myRole = await getMyGroupRole(req.user!.userId, existing.id);
    if (req.user!.workspaceRole !== "admin" && myRole !== "owner" && myRole !== "moderator") {
      res.status(403).json({ error: "Нет прав на редактирование" }); return;
    }

    const { title, summary, description, type, privacy, isArchived } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (summary !== undefined) data.summary = summary;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (privacy !== undefined) data.privacy = privacy;
    if (isArchived !== undefined) data.isArchived = isArchived;

    const group = await prisma.group.update({
      where: { id: param(req, "id") },
      data,
      include: { _count: { select: { members: true } } },
    });

    res.json({ group: { ...group, memberCount: group._count.members } });
  } catch (err) {
    console.error("Group update error:", err);
    res.status(500).json({ error: "Ошибка обновления группы" });
  }
});

// ─── DELETE /:id — Delete group ───

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Only owner or workspace admin can delete
    const myRole = await getMyGroupRole(req.user!.userId, existing.id);
    if (req.user!.workspaceRole !== "admin" && myRole !== "owner") {
      res.status(403).json({ error: "Только владелец может удалить группу" }); return;
    }

    await prisma.group.delete({ where: { id: param(req, "id") } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Group delete error:", err);
    res.status(500).json({ error: "Ошибка удаления группы" });
  }
});

// ─── POST /:id/join — Join group ───

router.post("/:id/join", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: req.user!.userId } },
    });
    if (existing) { res.status(409).json({ error: "Вы уже участник этой группы" }); return; }

    if (group.privacy === "CLOSED") {
      res.status(403).json({ error: "Группа закрытая. Вступление только по приглашению." }); return;
    }

    const member = await prisma.groupMember.create({
      data: { groupId: group.id, userId: req.user!.userId, role: "member" },
      include: { user: { select: { id: true, name: true, initials: true } } },
    });

    // Update last activity
    await prisma.group.update({ where: { id: group.id }, data: { lastActivityAt: new Date() } });

    res.status(201).json({ member, status: "ACTIVE" });
  } catch (err) {
    console.error("Group join error:", err);
    res.status(500).json({ error: "Ошибка вступления в группу" });
  }
});

// ─── POST /:id/leave — Leave group ───

router.post("/:id/leave", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    if (group.ownerId === req.user!.userId) {
      res.status(400).json({ error: "Владелец не может покинуть группу. Передайте права другому участнику." }); return;
    }

    await prisma.groupMember.deleteMany({ where: { groupId: group.id, userId: req.user!.userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Group leave error:", err);
    res.status(500).json({ error: "Ошибка выхода из группы" });
  }
});

// ─── Members management ───

router.post("/:id/members", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (myRole !== "owner" && myRole !== "moderator" && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на добавление участников" }); return;
    }

    const { userId, role } = req.body;
    const member = await prisma.groupMember.create({
      data: { groupId: group.id, userId, role: role || "member" },
      include: { user: { select: { id: true, name: true, initials: true } } },
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error("Group add member error:", err);
    res.status(500).json({ error: "Ошибка добавления участника" });
  }
});

router.patch("/:id/members/:userId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (myRole !== "owner" && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Только владелец может менять роли" }); return;
    }

    const { role } = req.body;
    if (!["owner", "moderator", "member"].includes(role)) {
      res.status(400).json({ error: "Недопустимая роль" }); return;
    }

    const member = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: group.id, userId: param(req, "userId") } },
      data: { role },
      include: { user: { select: { id: true, name: true, initials: true } } },
    });
    res.json({ member });
  } catch (err) {
    console.error("Group change role error:", err);
    res.status(500).json({ error: "Ошибка изменения роли" });
  }
});

router.delete("/:id/members/:userId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (myRole !== "owner" && myRole !== "moderator" && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на удаление участников" }); return;
    }

    // Can't remove the owner
    if (param(req, "userId") === group.ownerId) {
      res.status(400).json({ error: "Нельзя удалить владельца группы" }); return;
    }

    await prisma.groupMember.deleteMany({ where: { groupId: group.id, userId: param(req, "userId") } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Group remove member error:", err);
    res.status(500).json({ error: "Ошибка удаления участника" });
  }
});

// ─── Group Feed (Posts) ───

router.get("/:id/posts", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Non-members can't see posts of CLOSED groups
    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (group.privacy === "CLOSED" && !myRole) {
      res.status(403).json({ error: "Нет доступа к ленте закрытой группы" }); return;
    }

    const where: any = { groupId: group.id };
    if (req.query.postType && req.query.postType !== "all") {
      where.postType = String(req.query.postType);
    }

    const posts = await prisma.groupPost.findMany({
      where,
      include: { author: { select: { id: true, name: true, initials: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ posts });
  } catch (err) {
    console.error("Group posts error:", err);
    res.status(500).json({ error: "Ошибка получения ленты группы" });
  }
});

router.post("/:id/posts", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Must be a member to post
    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Только участники могут публиковать в ленту" }); return;
    }

    const { title, body, postType, metadata } = req.body;
    if (!body?.trim()) { res.status(400).json({ error: "Текст сообщения обязателен" }); return; }

    const post = await prisma.groupPost.create({
      data: {
        title: title || "",
        body: body.trim(),
        postType: postType || "message",
        metadata: metadata || "",
        authorId: req.user!.userId,
        groupId: group.id,
        workspaceId: req.user!.workspaceId!,
      },
      include: { author: { select: { id: true, name: true, initials: true, avatarUrl: true } } },
    });

    // Update last activity
    await prisma.group.update({ where: { id: group.id }, data: { lastActivityAt: new Date() } });

    res.status(201).json({ post });
  } catch (err) {
    console.error("Group create post error:", err);
    res.status(500).json({ error: "Ошибка публикации в ленту" });
  }
});

// ─── Group Tasks ───

router.get("/:id/tasks", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (group.privacy === "CLOSED" && !myRole) {
      res.status(403).json({ error: "Нет доступа к задачам закрытой группы" }); return;
    }

    const where: any = { groupId: group.id, workspaceId: req.user!.workspaceId! };

    // Status filter
    const status = String(req.query.status || "all");
    if (status === "active") where.status = "active";
    else if (status === "done") where.status = "done";

    // Kanban stage filter
    if (req.query.kanbanStage) {
      where.kanbanStage = String(req.query.kanbanStage);
    }

    // Assignee filter
    if (req.query.assignee) {
      where.assignee = String(req.query.assignee);
    }

    // Search
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [
        { title: { contains: s } },
        { description: { contains: s } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, initials: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ tasks });
  } catch (err) {
    console.error("Group tasks list error:", err);
    res.status(500).json({ error: "Ошибка получения задач группы" });
  }
});

router.post("/:id/tasks", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Только участники могут создавать задачи" }); return;
    }

    const { title, description, priority, deadline, dueDate, startDate, assignee, assigneeUserId, assigneeGroupId, kanbanStage } = req.body;
    if (!title?.trim()) { res.status(400).json({ error: "Название задачи обязательно" }); return; }
    if (assigneeUserId && assigneeGroupId) {
      res.status(400).json({ error: "Исполнитель — либо человек, либо группа" }); return;
    }

    // Validate dates
    if (dueDate && startDate && new Date(startDate) > new Date(dueDate)) {
      res.status(400).json({ error: "Дата начала не может быть позже дедлайна" }); return;
    }

    const userId = req.user!.userId;
    const wsId = req.user!.workspaceId!;

    // Resolve assignee
    let assigneeName = assignee || "";
    let validAssigneeUserId: string | null = null;
    let validAssigneeGroupId: string | null = null;
    if (assigneeUserId) {
      const u = await prisma.user.findFirst({
        where: { id: assigneeUserId, memberships: { some: { workspaceId: wsId } } },
        select: { id: true, name: true },
      });
      if (!u) { res.status(400).json({ error: "Исполнитель не найден" }); return; }
      validAssigneeUserId = u.id;
      assigneeName = u.name;
    }
    if (assigneeGroupId) {
      const g = await prisma.group.findFirst({
        where: { id: assigneeGroupId, workspaceId: wsId },
        select: { id: true, title: true },
      });
      if (!g) { res.status(400).json({ error: "Группа-исполнитель не найдена" }); return; }
      validAssigneeGroupId = g.id;
      if (!assigneeName) assigneeName = g.title;
    }

    // Create chat thread for the task
    const chatThread = await prisma.chatThread.create({
      data: {
        title: `Задача: ${title.trim()}`,
        tab: "task",
        ownerId: userId,
        workspaceId: wsId,
      },
    });

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || "",
        priority: priority || "medium",
        deadline: deadline || "",
        dueDate: dueDate || null,
        startDate: startDate || null,
        assignee: assigneeName,
        assigneeUserId: validAssigneeUserId,
        assigneeGroupId: validAssigneeGroupId,
        kanbanStage: kanbanStage || "new",
        ownerId: userId,
        creatorId: userId,
        groupId: group.id,
        workspaceId: wsId,
        chatThreadId: chatThread.id,
      },
      include: {
        owner: { select: { id: true, name: true, initials: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, initials: true } },
        assigneeUser: { select: { id: true, name: true, initials: true } },
        assigneeGroup: { select: { id: true, title: true } },
      },
    });

    // Update last activity
    await prisma.group.update({ where: { id: group.id }, data: { lastActivityAt: new Date() } });

    res.status(201).json({ task });
  } catch (err) {
    console.error("Group create task error:", err);
    res.status(500).json({ error: "Ошибка создания задачи" });
  }
});

router.patch("/:id/tasks/:taskId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const task = await prisma.task.findFirst({
      where: { id: param(req, "taskId"), groupId: group.id, workspaceId: req.user!.workspaceId! },
    });
    if (!task) { res.status(404).json({ error: "Задача не найдена" }); return; }

    // Permission: task owner/assignee or group owner/moderator
    const userId = req.user!.userId;
    const myRole = await getMyGroupRole(userId, group.id);
    const isTaskParticipant = task.ownerId === userId || task.assignee === userId;
    const isGroupAdmin = myRole === "owner" || myRole === "moderator";

    if (!isTaskParticipant && !isGroupAdmin && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на редактирование задачи" }); return;
    }

    const { title, description, status, priority, deadline, dueDate, startDate, kanbanStage, assignee } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (deadline !== undefined) data.deadline = deadline;
    if (dueDate !== undefined) data.dueDate = dueDate || null;
    if (startDate !== undefined) data.startDate = startDate || null;
    if (kanbanStage !== undefined) data.kanbanStage = kanbanStage;
    if (assignee !== undefined) data.assignee = assignee;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data,
      include: {
        owner: { select: { id: true, name: true, initials: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, initials: true } },
      },
    });

    res.json({ task: updated });
  } catch (err) {
    console.error("Group update task error:", err);
    res.status(500).json({ error: "Ошибка обновления задачи" });
  }
});

// ─── Group Events (Calendar) ───

router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (group.privacy === "CLOSED" && !myRole) {
      res.status(403).json({ error: "Нет доступа к событиям закрытой группы" }); return;
    }

    const where: any = { groupId: group.id, workspaceId: req.user!.workspaceId! };

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      where.date = {};
      if (req.query.dateFrom) where.date.gte = String(req.query.dateFrom);
      if (req.query.dateTo) where.date.lte = String(req.query.dateTo);
    }

    const events = await prisma.groupEvent.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    res.json({ events });
  } catch (err) {
    console.error("Group events list error:", err);
    res.status(500).json({ error: "Ошибка получения событий группы" });
  }
});

router.post("/:id/events", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Только участники могут создавать события" }); return;
    }

    const { title, description, date, time, endTime, type } = req.body;
    if (!title?.trim()) { res.status(400).json({ error: "Название события обязательно" }); return; }
    if (!date) { res.status(400).json({ error: "Дата события обязательна" }); return; }

    const event = await prisma.groupEvent.create({
      data: {
        title: title.trim(),
        description: description || "",
        date,
        time: time || "",
        endTime: endTime || "",
        type: type || "event",
        groupId: group.id,
        creatorId: req.user!.userId,
        workspaceId: req.user!.workspaceId!,
      },
    });

    // Update last activity
    await prisma.group.update({ where: { id: group.id }, data: { lastActivityAt: new Date() } });

    res.status(201).json({ event });
  } catch (err) {
    console.error("Group create event error:", err);
    res.status(500).json({ error: "Ошибка создания события" });
  }
});

router.delete("/:id/events/:eventId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const event = await prisma.groupEvent.findFirst({
      where: { id: param(req, "eventId"), groupId: group.id, workspaceId: req.user!.workspaceId! },
    });
    if (!event) { res.status(404).json({ error: "Событие не найдено" }); return; }

    // Permission: event creator or group owner/moderator
    const userId = req.user!.userId;
    const myRole = await getMyGroupRole(userId, group.id);
    const isCreator = event.creatorId === userId;
    const isGroupAdmin = myRole === "owner" || myRole === "moderator";

    if (!isCreator && !isGroupAdmin && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на удаление события" }); return;
    }

    await prisma.groupEvent.delete({ where: { id: event.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Group delete event error:", err);
    res.status(500).json({ error: "Ошибка удаления события" });
  }
});

// ─── Group Files (Disk) ───

router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Только участники могут просматривать файлы" }); return;
    }

    const where: any = { groupId: group.id, workspaceId: req.user!.workspaceId! };

    // Folder navigation
    if (req.query.parentId) {
      where.parentId = String(req.query.parentId);
    } else {
      where.parentId = null; // root level
    }

    // Trashed filter
    if (req.query.trashed === "true") {
      where.isTrashed = true;
      delete where.parentId; // show all trashed files regardless of folder
    } else {
      where.isTrashed = false;
    }

    const files = await prisma.groupFile.findMany({
      where,
      orderBy: [{ isFolder: "desc" }, { filename: "asc" }],
    });

    res.json({ files });
  } catch (err) {
    console.error("Group files list error:", err);
    res.status(500).json({ error: "Ошибка получения файлов группы" });
  }
});

router.post("/:id/files/folder", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Только участники могут создавать папки" }); return;
    }

    const { filename, parentId } = req.body;
    if (!filename?.trim()) { res.status(400).json({ error: "Имя папки обязательно" }); return; }

    // Validate parentId if provided
    if (parentId) {
      const parent = await prisma.groupFile.findFirst({
        where: { id: parentId, groupId: group.id, isFolder: true },
      });
      if (!parent) { res.status(404).json({ error: "Родительская папка не найдена" }); return; }
    }

    const folder = await prisma.groupFile.create({
      data: {
        filename: filename.trim(),
        isFolder: true,
        parentId: parentId || null,
        groupId: group.id,
        uploaderId: req.user!.userId,
        workspaceId: req.user!.workspaceId!,
      },
    });

    res.status(201).json({ file: folder });
  } catch (err) {
    console.error("Group create folder error:", err);
    res.status(500).json({ error: "Ошибка создания папки" });
  }
});

router.patch("/:id/files/:fileId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const file = await prisma.groupFile.findFirst({
      where: { id: param(req, "fileId"), groupId: group.id, workspaceId: req.user!.workspaceId! },
    });
    if (!file) { res.status(404).json({ error: "Файл не найден" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (!myRole) {
      res.status(403).json({ error: "Нет доступа к файлам группы" }); return;
    }

    const { filename, parentId, isTrashed } = req.body;
    const data: any = {};
    if (filename !== undefined) data.filename = filename;
    if (parentId !== undefined) {
      // Validate target folder
      if (parentId !== null) {
        const parent = await prisma.groupFile.findFirst({
          where: { id: parentId, groupId: group.id, isFolder: true },
        });
        if (!parent) { res.status(404).json({ error: "Целевая папка не найдена" }); return; }
      }
      data.parentId = parentId;
    }
    if (isTrashed !== undefined) data.isTrashed = isTrashed;

    const updated = await prisma.groupFile.update({
      where: { id: file.id },
      data,
    });

    res.json({ file: updated });
  } catch (err) {
    console.error("Group update file error:", err);
    res.status(500).json({ error: "Ошибка обновления файла" });
  }
});

router.delete("/:id/files/:fileId", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const file = await prisma.groupFile.findFirst({
      where: { id: param(req, "fileId"), groupId: group.id, workspaceId: req.user!.workspaceId! },
    });
    if (!file) { res.status(404).json({ error: "Файл не найден" }); return; }

    // Only the uploader, group owner/moderator, or workspace admin can permanently delete
    const userId = req.user!.userId;
    const myRole = await getMyGroupRole(userId, group.id);
    const isUploader = file.uploaderId === userId;
    const isGroupAdmin = myRole === "owner" || myRole === "moderator";

    if (!isUploader && !isGroupAdmin && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на удаление файла" }); return;
    }

    await prisma.groupFile.delete({ where: { id: file.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Group delete file error:", err);
    res.status(500).json({ error: "Ошибка удаления файла" });
  }
});

// ─── Group Settings ───

router.patch("/:id/settings", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    const myRole = await getMyGroupRole(req.user!.userId, group.id);
    if (myRole !== "owner" && myRole !== "moderator" && req.user!.workspaceRole !== "admin") {
      res.status(403).json({ error: "Нет прав на изменение настроек" }); return;
    }

    const { defaultLanding, enabledTools, menuOrder, dateStart, dateEnd } = req.body;
    const data: any = {};
    if (defaultLanding !== undefined) data.defaultLanding = defaultLanding;
    if (enabledTools !== undefined) data.enabledTools = enabledTools;
    if (menuOrder !== undefined) data.menuOrder = menuOrder;
    if (dateStart !== undefined) data.dateStart = dateStart;
    if (dateEnd !== undefined) data.dateEnd = dateEnd;

    const updated = await prisma.group.update({
      where: { id: group.id },
      data,
    });

    res.json({ group: updated });
  } catch (err) {
    console.error("Group update settings error:", err);
    res.status(500).json({ error: "Ошибка обновления настроек группы" });
  }
});

// ─── Follow / Unfollow (stub) ───

router.post("/:id/follow", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Stub: return success for now
    res.json({ ok: true, following: true });
  } catch (err) {
    console.error("Group follow error:", err);
    res.status(500).json({ error: "Ошибка подписки на группу" });
  }
});

router.post("/:id/unfollow", async (req: Request, res: Response) => {
  try {
    const group = await prisma.group.findFirst({ where: { id: param(req, "id"), workspaceId: req.user!.workspaceId! } });
    if (!group) { res.status(404).json({ error: "Группа не найдена" }); return; }

    // Stub: return success for now
    res.json({ ok: true, following: false });
  } catch (err) {
    console.error("Group unfollow error:", err);
    res.status(500).json({ error: "Ошибка отписки от группы" });
  }
});

export default router;
