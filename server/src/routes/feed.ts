import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tag, search } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (tag) where.tag = String(tag);
    if (search) { where.OR = [{ title: { contains: String(search) } }, { body: { contains: String(search) } }]; }
    const posts = await prisma.feedPost.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ posts });
  } catch (err) { res.status(500).json({ error: "Ошибка получения ленты" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { title, body, tag } = req.body;
    if (!title || !body) { res.status(400).json({ error: "Заголовок и текст обязательны" }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
    const post = await prisma.feedPost.create({ data: { title, body, tag: tag || "", author: user?.name || "", ownerId: req.user!.userId, workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ post });
  } catch (err) { res.status(500).json({ error: "Ошибка создания записи" }); }
});

router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.feedPost.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Запись не найдена" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    const { title, body, tag } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (body !== undefined) data.body = body;
    if (tag !== undefined) data.tag = tag;
    const post = await prisma.feedPost.update({ where: { id: req.params.id }, data });
    res.json({ post });
  } catch (err) { res.status(500).json({ error: "Ошибка обновления записи" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.feedPost.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Запись не найдена" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    await prisma.feedPost.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления записи" }); }
});

export default router;
