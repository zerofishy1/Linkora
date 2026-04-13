import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { unread, search } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (unread === "true") where.unread = true;
    if (search) { where.OR = [{ subject: { contains: String(search) } }, { fromAddr: { contains: String(search) } }]; }
    const mail = await prisma.mailThread.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ mail });
  } catch (err) { res.status(500).json({ error: "Ошибка получения почты" }); }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const mail = await prisma.mailThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!mail) { res.status(404).json({ error: "Письмо не найдено" }); return; }
    if (mail.unread) await prisma.mailThread.update({ where: { id: mail.id }, data: { unread: false } });
    res.json({ mail: { ...mail, unread: false } });
  } catch (err) { res.status(500).json({ error: "Ошибка получения письма" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { fromAddr, subject, preview, body, receivedAt } = req.body;
    if (!subject) { res.status(400).json({ error: "Тема письма обязательна" }); return; }
    const mail = await prisma.mailThread.create({ data: { fromAddr: fromAddr || "", subject, preview: preview || "", body: body || "", receivedAt: receivedAt || new Date().toISOString(), ownerId: req.user!.userId, workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ mail });
  } catch (err) { res.status(500).json({ error: "Ошибка создания письма" }); }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.mailThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Письмо не найдено" }); return; }
    const { unread } = req.body;
    const mail = await prisma.mailThread.update({ where: { id: req.params.id }, data: { unread: unread ?? existing.unread } });
    res.json({ mail });
  } catch (err) { res.status(500).json({ error: "Ошибка обновления письма" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.mailThread.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Письмо не найдено" }); return; }
    await prisma.mailThread.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления письма" }); }
});

export default router;
