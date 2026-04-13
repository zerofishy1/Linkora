import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tab, search } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (tab) where.tab = String(tab);
    if (search) { where.OR = [{ title: { contains: String(search) } }, { counterpart: { contains: String(search) } }, { snippet: { contains: String(search) } }]; }
    const chats = await prisma.chatThread.findMany({ where, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, task: { select: { id: true, title: true, status: true } } }, orderBy: { updatedAt: "desc" } });
    res.json({ chats });
  } catch (err) { console.error("Chats list error:", err); res.status(500).json({ error: "Ошибка получения чатов" }); }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chatThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! }, include: { messages: { orderBy: { createdAt: "asc" } }, task: true } });
    if (!chat) { res.status(404).json({ error: "Чат не найден" }); return; }
    if (chat.unread > 0) await prisma.chatThread.update({ where: { id: chat.id }, data: { unread: 0 } });
    res.json({ chat });
  } catch (err) { console.error("Chat get error:", err); res.status(500).json({ error: "Ошибка получения чата" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { title, tab, counterpart, focus } = req.body;
    if (!title) { res.status(400).json({ error: "Название чата обязательно" }); return; }
    const chat = await prisma.chatThread.create({ data: { title, tab: tab || "chat", counterpart: counterpart || "", focus: focus || "", ownerId: req.user!.userId, workspaceId: req.user!.workspaceId! }, include: { messages: true } });
    res.status(201).json({ chat });
  } catch (err) { console.error("Chat create error:", err); res.status(500).json({ error: "Ошибка создания чата" }); }
});

router.post("/:id/messages", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) { res.status(400).json({ error: "Сообщение не может быть пустым" }); return; }
    const chat = await prisma.chatThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!chat) { res.status(404).json({ error: "Чат не найден" }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
    const message = await prisma.chatMessage.create({ data: { body: body.trim(), isMine: true, authorName: user?.name || "Вы", threadId: chat.id, authorId: req.user!.userId } });
    await prisma.chatThread.update({ where: { id: chat.id }, data: { snippet: body.trim().slice(0, 100), updatedAt: new Date() } });
    res.status(201).json({ message });
  } catch (err) { console.error("Message send error:", err); res.status(500).json({ error: "Ошибка отправки сообщения" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.chatThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Чат не найден" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Можно удалять только свои чаты" }); return; }
    await prisma.chatThread.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { console.error("Chat delete error:", err); res.status(500).json({ error: "Ошибка удаления чата" }); }
});

export default router;
