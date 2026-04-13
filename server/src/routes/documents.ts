import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { kind, search } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (kind) where.kind = String(kind);
    if (search) { where.OR = [{ title: { contains: String(search) } }, { summary: { contains: String(search) } }]; }
    const documents = await prisma.document.findMany({ where, orderBy: { updatedAt: "desc" } });
    res.json({ documents });
  } catch (err) { res.status(500).json({ error: "Ошибка получения документов" }); }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!doc) { res.status(404).json({ error: "Документ не найден" }); return; }
    res.json({ document: doc });
  } catch (err) { res.status(500).json({ error: "Ошибка получения документа" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { title, kind, summary, meta } = req.body;
    if (!title) { res.status(400).json({ error: "Название документа обязательно" }); return; }
    const doc = await prisma.document.create({ data: { title, kind: kind || "document", summary: summary || "", meta: meta || "", ownerId: req.user!.userId, workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ document: doc });
  } catch (err) { res.status(500).json({ error: "Ошибка создания документа" }); }
});

router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Документ не найден" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    const { title, kind, summary, meta } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (kind !== undefined) data.kind = kind;
    if (summary !== undefined) data.summary = summary;
    if (meta !== undefined) data.meta = meta;
    const doc = await prisma.document.update({ where: { id: req.params.id }, data });
    res.json({ document: doc });
  } catch (err) { res.status(500).json({ error: "Ошибка обновления документа" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Документ не найден" }); return; }
    if (req.user!.workspaceRole === "member" && existing.ownerId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления документа" }); }
});

export default router;
