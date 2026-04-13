import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { type, date } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (type) where.type = String(type);
    if (date) where.date = String(date);
    const events = await prisma.event.findMany({ where, orderBy: [{ date: "asc" }, { time: "asc" }] });
    res.json({ events });
  } catch (err) { res.status(500).json({ error: "Ошибка получения событий" }); }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!event) { res.status(404).json({ error: "Событие не найдено" }); return; }
    res.json({ event });
  } catch (err) { res.status(500).json({ error: "Ошибка получения события" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { title, date, time, type } = req.body;
    if (!title || !date || !time) { res.status(400).json({ error: "Название, дата и время обязательны" }); return; }
    const event = await prisma.event.create({ data: { title, date, time, type: type || "meeting", ownerId: req.user!.userId, workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ event });
  } catch (err) { res.status(500).json({ error: "Ошибка создания события" }); }
});

router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.event.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Событие не найдено" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Можно редактировать только свои события" }); return; }
    const { title, date, time, type } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (date !== undefined) data.date = date;
    if (time !== undefined) data.time = time;
    if (type !== undefined) data.type = type;
    const event = await prisma.event.update({ where: { id: req.params.id }, data });
    res.json({ event });
  } catch (err) { res.status(500).json({ error: "Ошибка обновления события" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.event.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Событие не найдено" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления события" }); }
});

export default router;
