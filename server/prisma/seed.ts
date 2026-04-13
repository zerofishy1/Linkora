import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Заполнение базы данных...\n");

  // ─── User ───
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.upsert({
    where: { email: "hamid@consult24.ru" },
    update: {},
    create: {
      email: "hamid@consult24.ru",
      password: hashedPassword,
      name: "Хамид Мусаев",
      initials: "HM",
      jobTitle: "Младший специалист",
      tag: "Живой рабочий контур в логике Linkora.",
      settings: { create: {} },
    },
  });
  console.log(`  Пользователь: ${user.name} (${user.email})`);

  // ─── Workspace ───
  const workspace = await prisma.workspace.create({
    data: {
      name: "Консалт Комьюнити 24",
      slug: "consult-community-24",
      memberships: {
        create: { userId: user.id, role: "admin" },
      },
    },
  });
  console.log(`  Рабочая область: ${workspace.name}`);
  const wsId = workspace.id;

  // ─── People ───
  const people = [
    { name: "Хамид Мусаев", role: "Младший специалист", state: "Онлайн", focus: "CRM + AI контур" },
    { name: "Идрис Ибрагимов", role: "Специалист", state: "Онлайн", focus: "Рабочие чаты и проекты" },
    { name: "Кирилл Морев", role: "Генеральный директор", state: "В сети", focus: "Лента, сотрудники, процессы" },
    { name: "Наталья Исаева", role: "Сотрудник", state: "В сети", focus: "Документы и согласования" },
    { name: "Роман Соколов", role: "Сотрудник", state: "Онлайн", focus: "Коллабы и follow-up" },
  ];
  for (const p of people) await prisma.person.create({ data: { ...p, workspaceId: wsId } });
  console.log(`  Сотрудники: ${people.length}`);

  // ─── Groups ───
  const groups = [
    { title: "Core delivery", summary: "Внутренний контур для рабочих процессов, шаблонов и задач.", description: "Основная рабочая группа команды. Здесь планируются задачи, обсуждаются процессы и ведётся операционная работа.", type: "project", privacy: "CLOSED" },
    { title: "Growth lab", summary: "Эксперименты по маркетингу, упаковке и продуктовым идеям.", description: "Открытая лаборатория для проверки гипотез по маркетингу и продуктовому росту.", type: "group", privacy: "OPEN" },
    { title: "AI systems", summary: "Связка агентов, MCP и приватной базы знаний.", description: "Закрытая группа для работы с ИИ-инфраструктурой: агенты, MCP-серверы, RAG-пайплайны.", type: "project", privacy: "CLOSED" },
    { title: "HR & Культура", summary: "Корпоративная культура, адаптация новичков, тимбилдинг.", description: "Открытая группа для всех сотрудников. Обсуждение корпоративных мероприятий и инициатив.", type: "group", privacy: "OPEN" },
  ];
  for (const g of groups) {
    const group = await prisma.group.create({
      data: { ...g, ownerId: user.id, workspaceId: wsId, members: { create: { userId: user.id, role: "owner" } } },
    });
    // Add a welcome post to each group
    await prisma.groupPost.create({
      data: { body: `Добро пожаловать в группу «${g.title}»! ${g.summary}`, authorId: user.id, groupId: group.id, workspaceId: wsId },
    });
  }
  console.log(`  Группы: ${groups.length}`);

  // ─── Feed ───
  const feedPosts = [
    { title: "Ежедневный stand-up: цели дня", body: "Запустить MVP задач · Проверить CRM-воронку · Синк с командой по Growth Lab.", tag: "ритуалы", author: "Хамид Мусаев" },
    { title: "Weekly review: обзор недели", body: "Закрыто 5 задач, 2 встречи с клиентами, подготовлено 3 документа.", tag: "операции", author: "Хамид Мусаев" },
    { title: "Growth-гипотеза #4", body: "Попробовать формат коротких видео для Telegram-канала.", tag: "маркетинг", author: "Хамид Мусаев" },
  ];
  for (const f of feedPosts) await prisma.feedPost.create({ data: { ...f, ownerId: user.id, workspaceId: wsId } });
  console.log(`  Лента: ${feedPosts.length}`);

  // ─── Tasks ───
  const tasks = [
    { title: "Внедрении ии в тг канал", description: "Подключение канала и выпуск в рабочий контур.", status: "active", priority: "today", deadline: "10 апреля, 19:00", assignee: "Кирилл Морев", project: "Core delivery", tags: "operations", bucket: "today" },
    { title: "Перенос рег.ру личного, на консалт", description: "Оформить трансфер домена и обновить DNS записи.", status: "active", priority: "medium", deadline: "11 месяца", assignee: "Хамид Мусаев", project: "Core delivery", tags: "admin", bucket: "week" },
  ];
  for (const t of tasks) {
    const chat = await prisma.chatThread.create({
      data: { title: t.title, tab: "task", counterpart: t.assignee, snippet: t.description, focus: "Чат задачи", ownerId: user.id, workspaceId: wsId, messages: { create: { body: `Задача «${t.title}» создана. Исполнитель: ${t.assignee}.`, isMine: false, authorName: "Orbit AI" } } },
    });
    await prisma.task.create({
      data: { ...t, ownerId: user.id, creatorId: user.id, workspaceId: wsId, chatThreadId: chat.id },
    });
  }
  console.log(`  Задачи: ${tasks.length}`);

  // ─── Chats ───
  const chats = [
    { title: "Личное ядро", tab: "chat", counterpart: "Orbit AI", snippet: "Сделал проектный слой для workspace.", focus: "Решения дня", messages: [{ body: "Я вытащил навигацию из live-портала.", isMine: false, authorName: "Orbit AI" }, { body: "Нужно, чтобы клон был полезным для ежедневного использования.", isMine: true, authorName: "Хамид" }] },
    { title: "Growth Lab", tab: "collab", counterpart: "Идрис Ибрагимов", snippet: "Собрали подборку гипотез.", focus: "Маркетинг", messages: [{ body: "Собрали подборку гипотез для канала.", isMine: false, authorName: "Идрис" }] },
    { title: "#announcements", tab: "channel", counterpart: "Канал", snippet: "Новое обновление workspace.", focus: "Объявления", messages: [{ body: "Новое обновление workspace выпущено.", isMine: false, authorName: "Система" }] },
    { title: "Orbit AI", tab: "copilot", counterpart: "Orbit AI", snippet: "Готов помочь.", focus: "AI-ассистент", messages: [{ body: "Привет! Я Orbit AI — ваш рабочий ассистент.", isMine: false, authorName: "Orbit AI" }] },
  ];
  for (const c of chats) {
    await prisma.chatThread.create({
      data: { title: c.title, tab: c.tab, counterpart: c.counterpart, snippet: c.snippet, focus: c.focus, ownerId: user.id, workspaceId: wsId, messages: { create: c.messages.map((m) => ({ body: m.body, isMine: m.isMine, authorName: m.authorName })) } },
    });
  }
  console.log(`  Чаты: ${chats.length}`);

  // ─── Events ───
  const events = [
    { title: "Stand-up команда", date: "2026-04-10", time: "10:00", type: "meeting" },
    { title: "Review Growth Lab", date: "2026-04-10", time: "14:00", type: "meeting" },
    { title: "Дедлайн: тг канал", date: "2026-04-10", time: "19:00", type: "deadline" },
    { title: "Синк с Кириллом", date: "2026-04-11", time: "11:00", type: "meeting" },
    { title: "Обновить DNS", date: "2026-04-12", time: "10:00", type: "note" },
  ];
  for (const e of events) await prisma.event.create({ data: { ...e, ownerId: user.id, workspaceId: wsId } });
  console.log(`  События: ${events.length}`);

  // ─── Mail ───
  const mails = [
    { fromAddr: "support@linkora.ru", subject: "Добро пожаловать в Linkora", preview: "Ваш портал настроен и готов.", body: "Ваш портал Консалт Комьюнити 24 настроен.", receivedAt: "10 апреля, 09:00" },
    { fromAddr: "ops-review@consult24.ru", subject: "Операционный обзор — апрель", preview: "Обзор основных метрик.", body: "Основные метрики апреля: 23 часа фокуса.", receivedAt: "9 апреля, 15:00" },
    { fromAddr: "noreply@regru.ru", subject: "Трансфер домена", preview: "Подтвердите трансфер.", body: "Для завершения трансфера подтвердите операцию.", receivedAt: "8 апреля, 12:00" },
  ];
  for (const m of mails) await prisma.mailThread.create({ data: { ...m, ownerId: user.id, workspaceId: wsId } });
  console.log(`  Почта: ${mails.length}`);

  // ─── Documents ───
  const docs = [
    { kind: "document", title: "Операционная карта workspace", summary: "Структура и процессы", meta: "Обновлён 10 апреля" },
    { kind: "document", title: "Регламент работы с задачами", summary: "Правила создания задач", meta: "Обновлён 8 апреля" },
    { kind: "board", title: "Канбан: Core Delivery", summary: "Основная доска задач", meta: "5 колонок" },
    { kind: "board", title: "Воронка Growth Lab", summary: "Гипотезы и эксперименты", meta: "3 колонки" },
    { kind: "file", title: "Презентация команды", summary: "Pitch deck", meta: "PDF · 2.4 MB" },
    { kind: "file", title: "Логотип Консалт 24", summary: "Брендбук", meta: "SVG + PNG" },
  ];
  for (const d of docs) await prisma.document.create({ data: { ...d, ownerId: user.id, workspaceId: wsId } });
  console.log(`  Документы: ${docs.length}`);

  console.log("\n  База данных заполнена!");
  console.log(`  Вход: hamid@consult24.ru / admin123\n`);
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
