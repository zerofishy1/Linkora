import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

// GET /api/tasks
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, assignee, search, role, scope } = req.query;
    const userId = req.user!.userId;
    const wsId = req.user!.workspaceId!;

    const where: any = { workspaceId: wsId };

    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);
    if (assignee) where.assignee = { contains: String(assignee) };

    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    if (role === "created") where.creatorId = userId;
    else if (role === "assigned") {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (user) where.assignee = user.name;
    }

    if (scope === "in-progress") where.status = "active";
    else if (scope === "overdue") where.priority = "overdue";
    else if (scope === "done") where.status = "done";

    const tasks = await prisma.task.findMany({
      where,
      include: { files: true, chatThread: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ tasks });
  } catch (err) {
    console.error("Tasks list error:", err);
    res.status(500).json({ error: "Ошибка получения задач" });
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId! },
      include: {
        files: true,
        chatThread: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      },
    });
    if (!task) { res.status(404).json({ error: "Задача не найдена" }); return; }
    res.json({ task });
  } catch (err) {
    console.error("Task get error:", err);
    res.status(500).json({ error: "Ошибка получения задачи" });
  }
});

// POST /api/tasks (member+ can create)
router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const wsId = req.user!.workspaceId!;
    const { title, description, status, priority, deadline, assignee, project, projectType, tags, bucket, createChat, files } = req.body;

    if (!title) { res.status(400).json({ error: "Название задачи обязательно" }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const ownerName = user?.name || "";

    const result = await prisma.$transaction(async (tx) => {
      let chatThreadId: string | undefined;
      if (createChat !== false) {
        const chat = await tx.chatThread.create({
          data: {
            title, tab: "task",
            counterpart: assignee || ownerName,
            snippet: description || "Задача создана",
            focus: "Чат задачи",
            ownerId: userId,
            workspaceId: wsId,
            messages: {
              create: { body: `Задача «${title}» создана. Исполнитель: ${assignee || ownerName}. Срок: ${deadline || "без даты"}.`, isMine: false, authorName: "Orbit AI" },
            },
          },
        });
        chatThreadId = chat.id;
      }
      const task = await tx.task.create({
        data: {
          title, description: description || "", status: status || "active", priority: priority || "today",
          deadline: deadline || "", assignee: assignee || ownerName, project: project || "",
          projectType: projectType || "", tags: tags || "", bucket: bucket || "today",
          ownerId: userId, creatorId: userId, workspaceId: wsId, chatThreadId,
        },
      });
      if (files && Array.isArray(files) && files.length > 0) {
        await tx.taskFile.createMany({
          data: files.map((f: any) => ({ taskId: task.id, filename: f.filename || f, path: f.path || "", size: f.size || 0, source: f.source || "upload" })),
        });
      }
      return tx.task.findUnique({ where: { id: task.id }, include: { files: true, chatThread: { include: { messages: true } } } });
    });

    res.status(201).json({ task: result });
  } catch (err) {
    console.error("Task create error:", err);
    res.status(500).json({ error: "Ошибка создания задачи" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId! },
    });
    if (!existing) { res.status(404).json({ error: "Задача не найдена" }); return; }

    // Members can only edit their own tasks; admins can edit any
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Можно редактировать только свои задачи" }); return;
    }

    const { title, description, status, priority, deadline, assignee, project, projectType, tags, bucket } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (deadline !== undefined) data.deadline = deadline;
    if (assignee !== undefined) data.assignee = assignee;
    if (project !== undefined) data.project = project;
    if (projectType !== undefined) data.projectType = projectType;
    if (tags !== undefined) data.tags = tags;
    if (bucket !== undefined) data.bucket = bucket;

    const task = await prisma.task.update({ where: { id: req.params.id }, data, include: { files: true, chatThread: true } });
    res.json({ task });
  } catch (err) {
    console.error("Task update error:", err);
    res.status(500).json({ error: "Ошибка обновления задачи" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId! },
    });
    if (!existing) { res.status(404).json({ error: "Задача не найдена" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Можно удалять только свои задачи" }); return;
    }
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Task delete error:", err);
    res.status(500).json({ error: "Ошибка удаления задачи" });
  }
});

export default router;
