import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { authRequired, workspaceRequired, requireRole } from "../middleware/auth";
import { config } from "../config";

const router = Router();
router.use(authRequired, workspaceRequired);

if (!fs.existsSync(config.upload.dir)) fs.mkdirSync(config.upload.dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage, limits: { fileSize: config.upload.maxSize },
  fileFilter: (_req, file, cb) => {
    const blocked = [".exe", ".bat", ".cmd", ".sh", ".ps1"];
    if (blocked.includes(path.extname(file.originalname).toLowerCase())) { cb(new Error("Тип файла не разрешен")); return; }
    cb(null, true);
  },
});

router.post("/upload", requireRole("admin", "member"), upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "Файл не загружен" }); return; }
    const record = await prisma.uploadedFile.create({ data: { originalName: req.file.originalname, storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, path: req.file.path, uploaderId: req.user!.userId, workspaceId: req.user!.workspaceId! } });
    res.status(201).json({ file: { id: record.id, name: record.originalName, size: record.size, mimeType: record.mimeType, url: `/api/files/${record.id}` } });
  } catch (err) { res.status(500).json({ error: "Ошибка загрузки файла" }); }
});

router.post("/upload-multiple", requireRole("admin", "member"), upload.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: "Файлы не загружены" }); return; }
    const records = await Promise.all(files.map((f) => prisma.uploadedFile.create({ data: { originalName: f.originalname, storedName: f.filename, mimeType: f.mimetype, size: f.size, path: f.path, uploaderId: req.user!.userId, workspaceId: req.user!.workspaceId! } })));
    res.status(201).json({ files: records.map((r) => ({ id: r.id, name: r.originalName, size: r.size, url: `/api/files/${r.id}` })) });
  } catch (err) { res.status(500).json({ error: "Ошибка загрузки файлов" }); }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const file = await prisma.uploadedFile.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!file || !fs.existsSync(file.path)) { res.status(404).json({ error: "Файл не найден" }); return; }
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.sendFile(path.resolve(file.path));
  } catch (err) { res.status(500).json({ error: "Ошибка скачивания файла" }); }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const files = await prisma.uploadedFile.findMany({ where: { workspaceId: req.user!.workspaceId! }, orderBy: { createdAt: "desc" } });
    res.json({ files: files.map((f) => ({ id: f.id, name: f.originalName, size: f.size, mimeType: f.mimeType, url: `/api/files/${f.id}`, createdAt: f.createdAt })) });
  } catch (err) { res.status(500).json({ error: "Ошибка получения файлов" }); }
});

router.delete("/:id", requireRole("admin", "member"), async (req: Request, res: Response) => {
  try {
    const file = await prisma.uploadedFile.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId! } });
    if (!file) { res.status(404).json({ error: "Файл не найден" }); return; }
    if (req.user!.workspaceRole === "member" && file.uploaderId !== req.user!.userId) { res.status(403).json({ error: "Нет прав" }); return; }
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    await prisma.uploadedFile.delete({ where: { id: file.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления файла" }); }
});

export default router;
