import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";

const router = Router();
router.use(authRequired, workspaceRequired);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = { workspaceId: req.user!.workspaceId! };
    if (search) { where.OR = [{ name: { contains: String(search) } }, { role: { contains: String(search) } }]; }
    const people = await prisma.person.findMany({ where, orderBy: { name: "asc" } });
    res.json({ people });
  } catch (err) { res.status(500).json({ error: "Ошибка получения сотрудников" }); }
});

router.post("/", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const { name, role, state, focus } = req.body;
    if (!name) { res.status(400).json({ error: "Имя сотрудника обязательно" }); return; }
    const person = await prisma.person.create({ data: { name, role: role || "", state: state || "Офлайн", focus: focus || "", workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ person });
  } catch (err) { res.status(500).json({ error: "Ошибка добавления сотрудника" }); }
});

router.patch("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.person.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Сотрудник не найден" }); return; }
    const { name, role, state, focus } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (state !== undefined) data.state = state;
    if (focus !== undefined) data.focus = focus;
    const person = await prisma.person.update({ where: { id: req.params.id }, data });
    res.json({ person });
  } catch (err) { res.status(500).json({ error: "Ошибка обновления сотрудника" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.person.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!existing) { res.status(404).json({ error: "Сотрудник не найден" }); return; }
    await prisma.person.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления сотрудника" }); }
});

export default router;
