import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Очистка базы данных...\n");

  // ─── Clean slate — все сущности ───
  await prisma.taskCoAssignee.deleteMany({});
  await prisma.taskWatcher.deleteMany({});
  await prisma.taskLink.deleteMany({});
  await prisma.taskFile.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatThread.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.feedPost.deleteMany({});
  await prisma.mailThread.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.groupPost.deleteMany({});
  await prisma.groupEvent.deleteMany({});
  await prisma.groupFile.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.uploadedFile.deleteMany({});
  await prisma.workspaceInviteToken.deleteMany({});
  await prisma.workspaceMembership.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("  БД очищена.\n");

  // ─── 4 пользователя (1 admin + 3 member) ───
  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@linkora.local",
      password,
      name: "Админ Линкоры",
      initials: "АЛ",
      jobTitle: "Администратор",
      tag: "",
      settings: { create: {} },
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: "user2@linkora.local",
      password,
      name: "Пользователь Второй",
      initials: "П2",
      jobTitle: "Сотрудник",
      tag: "",
      settings: { create: {} },
    },
  });
  const user3 = await prisma.user.create({
    data: {
      email: "user3@linkora.local",
      password,
      name: "Пользователь Третий",
      initials: "П3",
      jobTitle: "Сотрудник",
      tag: "",
      settings: { create: {} },
    },
  });
  const user4 = await prisma.user.create({
    data: {
      email: "user4@linkora.local",
      password,
      name: "Пользователь Четвёртый",
      initials: "П4",
      jobTitle: "Сотрудник",
      tag: "",
      settings: { create: {} },
    },
  });

  console.log(`  Admin:  ${admin.email}`);
  console.log(`  Member: ${user2.email}`);
  console.log(`  Member: ${user3.email}`);
  console.log(`  Member: ${user4.email}`);

  // ─── Одна рабочая область, все 4 — её члены ───
  const workspace = await prisma.workspace.create({
    data: {
      name: "Рабочая область",
      slug: "workspace",
      memberships: {
        create: [
          { userId: admin.id, role: "admin" },
          { userId: user2.id, role: "member" },
          { userId: user3.id, role: "member" },
          { userId: user4.id, role: "member" },
        ],
      },
    },
  });

  console.log(`\n  Рабочая область: ${workspace.name} (slug: ${workspace.slug})`);
  console.log(`  Всего участников: 4`);

  console.log("\n  Готово. БД чистая, демо-данных нет.");
  console.log(`  Вход: admin@linkora.local / admin123 (admin)`);
  console.log(`  Или: user2@linkora.local / user3@linkora.local / user4@linkora.local (все admin123)\n`);
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
