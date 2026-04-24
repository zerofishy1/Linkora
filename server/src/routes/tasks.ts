import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

// ─── Visibility helpers ─────────────────────────────────────────
// Задача видна пользователю, если:
//  - он admin воркспейса (видит всё)
//  - он создатель (creatorId)
//  - он назначен исполнителем напрямую (assigneeUserId)
//  - он член группы-исполнителя (assigneeGroupId → members)
//  - задача в проекте (groupId) и он член этого проекта
//  - он соисполнитель (coAssignees)
//  - он наблюдатель (watchers)

function visibilityFilter(userId: string, workspaceRole: string) {
  if (workspaceRole === "admin") return {};
  return {
    OR: [
      { creatorId: userId },
      { ownerId: userId },
      { assigneeUserId: userId },
      { assigneeGroup: { members: { some: { userId } } } },
      { group: { members: { some: { userId } } } },
      { coAssignees: { some: { userId } } },
      { watchers: { some: { userId } } },
    ],
  };
}

const taskInclude = {
  files: true,
  chatThread: { select: { id: true, title: true } },
  assigneeUser: { select: { id: true, name: true, initials: true, avatarUrl: true } },
  assigneeGroup: { select: { id: true, title: true, avatarUrl: true, type: true } },
  creator: { select: { id: true, name: true, initials: true } },
  group: { select: { id: true, title: true } },
  parentTask: { select: { id: true, title: true } },
  subtasks: { select: { id: true, title: true, status: true, priority: true } },
  coAssignees: {
    include: { user: { select: { id: true, name: true, initials: true, avatarUrl: true } } },
  },
  watchers: {
    include: { user: { select: { id: true, name: true, initials: true, avatarUrl: true } } },
  },
  linksFrom: {
    include: { to: { select: { id: true, title: true, status: true } } },
  },
  linksTo: {
    include: { from: { select: { id: true, title: true, status: true } } },
  },
} as const;

// Helpers: валидация формы checklist и reminders
function validateChecklist(value: any): { ok: true; data: any[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: "Чек-лист должен быть массивом" };
  for (const item of value) {
    if (typeof item !== "object" || item === null) return { ok: false, error: "Пункт чек-листа должен быть объектом" };
    if (typeof item.id !== "string" || typeof item.text !== "string" || typeof item.done !== "boolean") {
      return { ok: false, error: "Пункт чек-листа должен иметь поля id, text, done" };
    }
  }
  return { ok: true, data: value };
}

function validateReminders(value: any): { ok: true; data: any[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: "Напоминания должны быть массивом" };
  for (const item of value) {
    if (typeof item !== "object" || item === null) return { ok: false, error: "Напоминание должно быть объектом" };
    if (typeof item.id !== "string" || typeof item.at !== "string") {
      return { ok: false, error: "Напоминание должно иметь поля id и at" };
    }
    if (item.message !== undefined && typeof item.message !== "string") {
      return { ok: false, error: "Message в напоминании должен быть строкой" };
    }
    // Проверка что at — валидная ISO-строка даты
    if (isNaN(Date.parse(item.at))) return { ok: false, error: "Напоминание: неверный формат даты" };
  }
  return { ok: true, data: value };
}

// Helper: валидация массива userIds (все должны быть в воркспейсе)
async function validateUserIds(userIds: string[], workspaceId: string): Promise<string[]> {
  if (!userIds || userIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, memberships: { some: { workspaceId } } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// Helper: sync co-assignees / watchers / links через deleteMany + createMany
async function syncTaskRelations(tx: any, taskId: string, {
  coAssigneeUserIds, watcherUserIds, linkedTaskIds,
}: { coAssigneeUserIds?: string[]; watcherUserIds?: string[]; linkedTaskIds?: string[] }) {
  if (coAssigneeUserIds !== undefined) {
    await tx.taskCoAssignee.deleteMany({ where: { taskId } });
    if (coAssigneeUserIds.length > 0) {
      await tx.taskCoAssignee.createMany({
        data: coAssigneeUserIds.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      });
    }
  }
  if (watcherUserIds !== undefined) {
    await tx.taskWatcher.deleteMany({ where: { taskId } });
    if (watcherUserIds.length > 0) {
      await tx.taskWatcher.createMany({
        data: watcherUserIds.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      });
    }
  }
  if (linkedTaskIds !== undefined) {
    await tx.taskLink.deleteMany({ where: { fromId: taskId } });
    if (linkedTaskIds.length > 0) {
      await tx.taskLink.createMany({
        data: linkedTaskIds.map((toId) => ({ fromId: taskId, toId, kind: "related" })),
        skipDuplicates: true,
      });
    }
  }
}

// GET /api/tasks
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, assignee, search, role, scope } = req.query;
    const userId = req.user!.userId;
    const workspaceRole = req.user!.workspaceRole || "member";
    const wsId = req.user!.workspaceId!;

    const vis = visibilityFilter(userId, workspaceRole);
    const where: any = { workspaceId: wsId, ...vis };

    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);
    if (assignee) where.assignee = { contains: String(assignee) };

    if (search) {
      const term = String(search);
      const searchOr = [
        { title: { contains: term } },
        { description: { contains: term } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    if (role === "created") where.creatorId = userId;
    else if (role === "assigned") where.assigneeUserId = userId;

    if (scope === "in-progress") where.status = "active";
    else if (scope === "overdue") where.priority = "overdue";
    else if (scope === "done") where.status = "done";

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
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
    const userId = req.user!.userId;
    const workspaceRole = req.user!.workspaceRole || "member";
    const wsId = req.user!.workspaceId!;

    const vis = visibilityFilter(userId, workspaceRole);
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: wsId, ...vis },
      include: {
        ...taskInclude,
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

// POST /api/tasks
router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const wsId = req.user!.workspaceId!;
    const {
      title, description, status, priority, deadline, dueDate, startDate,
      assigneeUserId, assigneeGroupId, groupId,
      assignee, project, projectType, tags, bucket, createChat, files,
      // Новые поля
      checklist, reminders, timeTrackedMin,
      parentTaskId,
      coAssigneeUserIds, watcherUserIds, linkedTaskIds,
    } = req.body;

    if (!title) { res.status(400).json({ error: "Название задачи обязательно" }); return; }
    if (assigneeUserId && assigneeGroupId) {
      res.status(400).json({ error: "Исполнитель — либо человек, либо группа" }); return;
    }
    if (dueDate && startDate && new Date(startDate) > new Date(dueDate)) {
      res.status(400).json({ error: "Дата начала не может быть позже дедлайна" }); return;
    }

    // Валидация JSON полей
    if (checklist !== undefined) {
      const v = validateChecklist(checklist);
      if (!v.ok) { res.status(400).json({ error: v.error }); return; }
    }
    if (reminders !== undefined) {
      const v = validateReminders(reminders);
      if (!v.ok) { res.status(400).json({ error: v.error }); return; }
    }

    // Assignee resolution
    let assigneeName = assignee || "";
    let validAssigneeUserId: string | null = null;
    let validAssigneeGroupId: string | null = null;
    let validGroupId: string | null = null;
    let validParentTaskId: string | null = null;

    if (assigneeUserId) {
      const u = await prisma.user.findFirst({
        where: { id: assigneeUserId, memberships: { some: { workspaceId: wsId } } },
        select: { id: true, name: true },
      });
      if (!u) { res.status(400).json({ error: "Исполнитель не найден в воркспейсе" }); return; }
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
    if (groupId) {
      const isAdmin = req.user!.workspaceRole === "admin";
      const g = await prisma.group.findFirst({
        where: {
          id: groupId, workspaceId: wsId,
          ...(isAdmin ? {} : { members: { some: { userId } } }),
        },
        select: { id: true },
      });
      if (!g) { res.status(403).json({ error: "Нельзя создавать задачи в чужом проекте" }); return; }
      validGroupId = g.id;
    }

    if (parentTaskId) {
      const parent = await prisma.task.findFirst({
        where: { id: parentTaskId, workspaceId: wsId },
        select: { id: true },
      });
      if (!parent) { res.status(400).json({ error: "Родительская задача не найдена" }); return; }
      validParentTaskId = parent.id;
    }

    // Validate user-ID arrays
    const validCoAssignees = await validateUserIds(coAssigneeUserIds || [], wsId);
    const validWatchers = await validateUserIds(watcherUserIds || [], wsId);

    // Validate linked tasks (must be in same workspace)
    let validLinkedIds: string[] = [];
    if (linkedTaskIds && linkedTaskIds.length > 0) {
      const linked = await prisma.task.findMany({
        where: { id: { in: linkedTaskIds }, workspaceId: wsId },
        select: { id: true },
      });
      validLinkedIds = linked.map((t) => t.id);
    }

    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const ownerName = creator?.name || "";
    if (!assigneeName) assigneeName = ownerName;

    // Normalise JSON fields
    const checklistJson = checklist !== undefined ? JSON.stringify(checklist) : "[]";
    const remindersJson = reminders !== undefined ? JSON.stringify(reminders) : "[]";

    const result = await prisma.$transaction(async (tx) => {
      let chatThreadId: string | undefined;
      if (createChat !== false) {
        const chat = await tx.chatThread.create({
          data: {
            title, tab: "task",
            counterpart: assigneeName,
            snippet: description || "Задача создана",
            focus: "Чат задачи",
            ownerId: userId,
            workspaceId: wsId,
            messages: {
              create: {
                body: `Задача «${title}» создана. Исполнитель: ${assigneeName}. Срок: ${deadline || "без даты"}.`,
                isMine: false, authorName: "Orbit AI",
              },
            },
          },
        });
        chatThreadId = chat.id;
      }
      const task = await tx.task.create({
        data: {
          title, description: description || "",
          status: status || "active", priority: priority || "today",
          deadline: deadline || "", dueDate: dueDate || null, startDate: startDate || null,
          assignee: assigneeName, project: project || "",
          projectType: projectType || "", tags: tags || "", bucket: bucket || "today",
          ownerId: userId, creatorId: userId, workspaceId: wsId, chatThreadId,
          assigneeUserId: validAssigneeUserId,
          assigneeGroupId: validAssigneeGroupId,
          groupId: validGroupId,
          parentTaskId: validParentTaskId,
          checklist: checklistJson,
          reminders: remindersJson,
          timeTrackedMin: Number(timeTrackedMin) || 0,
        },
      });
      if (files && Array.isArray(files) && files.length > 0) {
        await tx.taskFile.createMany({
          data: files.map((f: any) => ({
            taskId: task.id, filename: f.filename || f, path: f.path || "",
            size: f.size || 0, source: f.source || "upload",
          })),
        });
      }
      await syncTaskRelations(tx, task.id, {
        coAssigneeUserIds: validCoAssignees,
        watcherUserIds: validWatchers,
        linkedTaskIds: validLinkedIds,
      });
      return tx.task.findUnique({ where: { id: task.id }, include: taskInclude });
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
    const userId = req.user!.userId;
    const workspaceRole = req.user!.workspaceRole || "member";
    const wsId = req.user!.workspaceId!;

    const vis = visibilityFilter(userId, workspaceRole);
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: wsId, ...vis },
    });
    if (!existing) { res.status(404).json({ error: "Задача не найдена" }); return; }

    const canEdit = workspaceRole === "admin"
      || existing.ownerId === userId
      || existing.creatorId === userId
      || existing.assigneeUserId === userId;
    if (!canEdit) {
      res.status(403).json({ error: "Недостаточно прав для редактирования" }); return;
    }

    const {
      title, description, status, priority, deadline, dueDate, startDate,
      assigneeUserId, assigneeGroupId, groupId,
      assignee, project, projectType, tags, bucket,
      checklist, reminders, timeTrackedMin, timeTrackingFrom,
      parentTaskId,
      coAssigneeUserIds, watcherUserIds, linkedTaskIds,
    } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (deadline !== undefined) data.deadline = deadline;
    if (dueDate !== undefined) data.dueDate = dueDate || null;
    if (startDate !== undefined) data.startDate = startDate || null;
    if (project !== undefined) data.project = project;
    if (projectType !== undefined) data.projectType = projectType;
    if (tags !== undefined) data.tags = tags;
    if (bucket !== undefined) data.bucket = bucket;
    if (checklist !== undefined) {
      const v = validateChecklist(checklist);
      if (!v.ok) { res.status(400).json({ error: v.error }); return; }
      data.checklist = JSON.stringify(v.data);
    }
    if (reminders !== undefined) {
      const v = validateReminders(reminders);
      if (!v.ok) { res.status(400).json({ error: v.error }); return; }
      data.reminders = JSON.stringify(v.data);
    }
    if (timeTrackedMin !== undefined) data.timeTrackedMin = Number(timeTrackedMin) || 0;
    if (timeTrackingFrom !== undefined) data.timeTrackingFrom = timeTrackingFrom || null;

    if (assigneeUserId !== undefined) {
      if (assigneeUserId) {
        const u = await prisma.user.findFirst({
          where: { id: assigneeUserId, memberships: { some: { workspaceId: wsId } } },
          select: { id: true, name: true },
        });
        if (!u) { res.status(400).json({ error: "Исполнитель не найден" }); return; }
        data.assigneeUserId = u.id;
        data.assigneeGroupId = null;
        data.assignee = u.name;
      } else {
        data.assigneeUserId = null;
      }
    }
    if (assigneeGroupId !== undefined) {
      if (assigneeGroupId) {
        const g = await prisma.group.findFirst({
          where: { id: assigneeGroupId, workspaceId: wsId },
          select: { id: true, title: true },
        });
        if (!g) { res.status(400).json({ error: "Группа-исполнитель не найдена" }); return; }
        data.assigneeGroupId = g.id;
        data.assigneeUserId = null;
        data.assignee = g.title;
      } else {
        data.assigneeGroupId = null;
      }
    }
    if (assignee !== undefined && data.assignee === undefined) data.assignee = assignee;

    if (groupId !== undefined) {
      if (groupId) {
        const isAdmin = workspaceRole === "admin";
        const g = await prisma.group.findFirst({
          where: {
            id: groupId, workspaceId: wsId,
            ...(isAdmin ? {} : { members: { some: { userId } } }),
          },
          select: { id: true },
        });
        if (!g) { res.status(403).json({ error: "Нельзя привязать задачу к чужому проекту" }); return; }
        data.groupId = g.id;
      } else {
        data.groupId = null;
      }
    }

    if (parentTaskId !== undefined) {
      if (parentTaskId) {
        if (parentTaskId === req.params.id) {
          res.status(400).json({ error: "Задача не может быть родительской сама себе" }); return;
        }
        const parent = await prisma.task.findFirst({
          where: { id: parentTaskId, workspaceId: wsId }, select: { id: true },
        });
        if (!parent) { res.status(400).json({ error: "Родительская задача не найдена" }); return; }
        data.parentTaskId = parent.id;
      } else {
        data.parentTaskId = null;
      }
    }

    const finalDue = data.dueDate !== undefined ? data.dueDate : existing.dueDate;
    const finalStart = data.startDate !== undefined ? data.startDate : existing.startDate;
    if (finalDue && finalStart && new Date(finalStart) > new Date(finalDue)) {
      res.status(400).json({ error: "Дата начала не может быть позже дедлайна" }); return;
    }

    // Validate arrays
    const validCoAssignees = coAssigneeUserIds !== undefined
      ? await validateUserIds(coAssigneeUserIds, wsId) : undefined;
    const validWatchers = watcherUserIds !== undefined
      ? await validateUserIds(watcherUserIds, wsId) : undefined;
    let validLinkedIds: string[] | undefined;
    if (linkedTaskIds !== undefined) {
      if (linkedTaskIds.length > 0) {
        const linked = await prisma.task.findMany({
          where: { id: { in: linkedTaskIds }, workspaceId: wsId }, select: { id: true },
        });
        validLinkedIds = linked.map((t) => t.id);
      } else {
        validLinkedIds = [];
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: req.params.id }, data });
      await syncTaskRelations(tx, req.params.id, {
        coAssigneeUserIds: validCoAssignees,
        watcherUserIds: validWatchers,
        linkedTaskIds: validLinkedIds,
      });
      return tx.task.findUnique({ where: { id: req.params.id }, include: taskInclude });
    });
    res.json({ task });
  } catch (err) {
    console.error("Task update error:", err);
    res.status(500).json({ error: "Ошибка обновления задачи" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const workspaceRole = req.user!.workspaceRole || "member";
    const wsId = req.user!.workspaceId!;

    const vis = visibilityFilter(userId, workspaceRole);
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: wsId, ...vis },
    });
    if (!existing) { res.status(404).json({ error: "Задача не найдена" }); return; }

    const canDelete = workspaceRole === "admin"
      || existing.ownerId === userId
      || existing.creatorId === userId;
    if (!canDelete) {
      res.status(403).json({ error: "Недостаточно прав для удаления" }); return;
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Task delete error:", err);
    res.status(500).json({ error: "Ошибка удаления задачи" });
  }
});

// POST /api/tasks/:id/time-start — запустить таймер учёта времени (атомарно)
router.post("/:id/time-start", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const vis = visibilityFilter(req.user!.userId, req.user!.workspaceRole || "member");
    // Сначала проверка видимости
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId!, ...vis },
      select: { id: true },
    });
    if (!task) { res.status(404).json({ error: "Задача не найдена" }); return; }

    // Атомарный старт: updateMany с условием timeTrackingFrom: null.
    // Если другой клиент уже запустил — count вернёт 0 → 409.
    const result = await prisma.task.updateMany({
      where: { id: task.id, timeTrackingFrom: null },
      data: { timeTrackingFrom: new Date().toISOString() },
    });
    if (result.count === 0) {
      res.status(409).json({ error: "Таймер уже запущен другим клиентом" }); return;
    }
    const updated = await prisma.task.findUnique({
      where: { id: task.id }, include: taskInclude,
    });
    res.json({ task: updated });
  } catch (err) {
    console.error("Time start error:", err);
    res.status(500).json({ error: "Ошибка запуска таймера" });
  }
});

// POST /api/tasks/:id/time-stop — остановить и сохранить в timeTrackedMin (атомарно)
router.post("/:id/time-stop", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const vis = visibilityFilter(req.user!.userId, req.user!.workspaceRole || "member");
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId!, ...vis },
    });
    if (!task) { res.status(404).json({ error: "Задача не найдена" }); return; }
    if (!task.timeTrackingFrom) { res.status(400).json({ error: "Таймер не запущен" }); return; }

    const startedAt = task.timeTrackingFrom; // зафиксируем, чтобы избежать data race с редакцией между чтением и обновлением
    const elapsedMs = Date.now() - new Date(startedAt).getTime();
    const addMin = Math.max(1, Math.round(elapsedMs / 60000));

    // Атомарно: сбросить только если timeTrackingFrom всё ещё тот же.
    const result = await prisma.task.updateMany({
      where: { id: task.id, timeTrackingFrom: startedAt },
      data: {
        timeTrackingFrom: null,
        timeTrackedMin: task.timeTrackedMin + addMin,
      },
    });
    if (result.count === 0) {
      res.status(409).json({ error: "Таймер был перезапущен другим клиентом" }); return;
    }
    const updated = await prisma.task.findUnique({
      where: { id: task.id }, include: taskInclude,
    });
    res.json({ task: updated, addedMinutes: addMin });
  } catch (err) {
    console.error("Time stop error:", err);
    res.status(500).json({ error: "Ошибка остановки таймера" });
  }
});

// GET /api/tasks/calendar/month?month=YYYY-MM
router.get("/calendar/month", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const workspaceRole = req.user!.workspaceRole || "member";
    const wsId = req.user!.workspaceId!;

    const month = String(req.query.month || "");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: "Параметр month обязателен в формате YYYY-MM" }); return;
    }

    // Корректно посчитать границы месяца (февраль, 30/31)
    const [yearStr, monthStr] = month.split("-");
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    // Последний день месяца: день 0 следующего месяца
    const lastDayDate = new Date(yearNum, monthNum, 0);
    const lastDay = String(lastDayDate.getDate()).padStart(2, "0");
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-${lastDay}T23:59:59`;

    const vis = visibilityFilter(userId, workspaceRole);
    const dateFilter = [
      { dueDate: { gte: monthStart, lte: monthEnd } },
      { startDate: { gte: monthStart, lte: monthEnd } },
      { AND: [{ startDate: { lte: monthStart } }, { dueDate: { gte: `${month}-${lastDay}` } }] },
    ];

    // Явная логика: для admin visibilityFilter возвращает {} → применяем только dateFilter.
    // Для не-admin комбинируем через AND.
    const where: any = { workspaceId: wsId };
    const visOr = (vis as { OR?: any[] }).OR;
    if (visOr && visOr.length > 0) {
      where.AND = [{ OR: visOr }, { OR: dateFilter }];
    } else {
      where.OR = dateFilter;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, initials: true } },
        assigneeUser: { select: { id: true, name: true, initials: true } },
        assigneeGroup: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    res.json({ tasks });
  } catch (err) {
    console.error("Calendar tasks error:", err);
    res.status(500).json({ error: "Ошибка получения задач календаря" });
  }
});

export default router;
