import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Маршрут не найден" });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Error]", err.message);

  if (config.isDev) {
    console.error(err.stack);
  }

  const status = (err as any).status || 500;
  res.status(status).json({
    error: err.message || "Внутренняя ошибка сервера",
    ...(config.isDev && { stack: err.stack }),
  });
}
