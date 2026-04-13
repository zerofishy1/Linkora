import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { config } from "./config";
import { notFound, errorHandler } from "./middleware/error";

import authRoutes from "./routes/auth";
import workspaceRoutes from "./routes/workspaces";
import taskRoutes from "./routes/tasks";
import chatRoutes from "./routes/chats";
import eventRoutes from "./routes/events";
import feedRoutes from "./routes/feed";
import mailRoutes from "./routes/mail";
import documentRoutes from "./routes/documents";
import groupRoutes from "./routes/groups";
import peopleRoutes from "./routes/people";
import fileRoutes from "./routes/files";

export function createApp() {
  const app = express();

  // Allow localhost/127.0.0.1 on any port during development
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow any localhost, 127.0.0.1, or local network origin in development
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("https://localhost") ||
        origin.startsWith("https://127.0.0.1") ||
        origin.startsWith("http://192.168.") ||
        origin === config.frontendUrl
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check (no auth)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: config.nodeEnv });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/feed", feedRoutes);
  app.use("/api/mail", mailRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/people", peopleRoutes);
  app.use("/api/files", fileRoutes);

  // Serve frontend (production)
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) res.status(404).json({ error: "Frontend not built. Run: npm run build" });
    });
  });

  app.all("/api/{*path}", notFound);
  app.use(errorHandler);

  return app;
}
