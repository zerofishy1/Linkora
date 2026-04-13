import "dotenv/config";
import { createApp } from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log("[DB] Подключение к базе данных установлено");
  } catch (err) {
    console.error("[DB] Ошибка подключения к базе данных:", err);
    process.exit(1);
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║  Linkora Backend Server                      ║
║  Порт:      ${String(config.port).padEnd(35)}║
║  Режим:     ${config.nodeEnv.padEnd(35)}║
║  API:       http://localhost:${config.port}/api${" ".repeat(13)}║
║  Здоровье:  http://localhost:${config.port}/api/health${" ".repeat(6)}║
╚═══════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[Server] Завершение работы...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
