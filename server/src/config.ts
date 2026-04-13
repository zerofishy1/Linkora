import path from "path";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  upload: {
    dir: path.resolve(process.env.UPLOAD_DIR || "./uploads"),
    maxSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4173",
  isDev: (process.env.NODE_ENV || "development") === "development",
};
