import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/jwt";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Requires a valid JWT. Populates req.user with { userId, email, workspaceId?, workspaceRole? }.
 */
export function authRequired(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: "Необходима авторизация" });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Недействительный токен" });
  }
}

/**
 * Requires req.user.workspaceId to be present in the JWT.
 * Must be used AFTER authRequired.
 */
export function workspaceRequired(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.workspaceId) {
    res.status(403).json({ error: "Рабочая область не выбрана" });
    return;
  }
  next();
}

/**
 * Factory: requires the user to have one of the given roles inside the current workspace.
 * Must be used AFTER authRequired + workspaceRequired.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.workspaceRole || !roles.includes(req.user.workspaceRole)) {
      res.status(403).json({ error: "Недостаточно прав" });
      return;
    }
    next();
  };
}
