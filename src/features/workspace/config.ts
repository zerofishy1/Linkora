// @ts-nocheck

export const WORKSPACE_STORAGE_KEY = "orbit-workspace-state-v1";

export const ROUTE_META = {
  messenger: {
    title: "Мессенджер",
    description:
      "Чаты, каналы, уведомления и быстрые договоренности в едином окне.",
    group: "teamwork",
    chatTab: "chat",
    searchPlaceholder: "Найти сотрудника или чат",
    actionLabel: "Новый диалог",
  },
  feed: {
    title: "Лента",
    description:
      "Единая лента решений, апдейтов и внутренних сигналов.",
    group: "teamwork",
    searchPlaceholder: "Поиск по постам и решениям",
    actionLabel: "Новый пост",
  },
  collabs: {
    title: "Коллабы",
    description:
      "Пространства для коротких спринтов, внешних проектов и совместной работы.",
    group: "teamwork",
    chatTab: "collab",
    searchPlaceholder: "Найти коллаб или команду",
    actionLabel: "Создать коллаб",
  },
  calendar: {
    title: "Календарь",
    description:
      "Встречи, фокус-блоки, дедлайны и личный рабочий ритм.",
    group: "teamwork",
    searchPlaceholder: "Поиск по событиям",
    actionLabel: "Добавить событие",
  },
  documents: {
    title: "Документы",
    description:
      "Документы, шаблоны и база знаний для ежедневной работы.",
    group: "teamwork",
    docsView: "documents",
    searchPlaceholder: "Фильтр + поиск",
    actionLabel: "Создать документ",
  },
  boards: {
    title: "Доски",
    description:
      "Визуальные доски для брейнштормов, структуры и быстрых циклов.",
    group: "teamwork",
    docsView: "boards",
    searchPlaceholder: "Поиск по доскам",
    actionLabel: "Создать доску",
  },
  drive: {
    title: "Диск",
    description:
      "Рабочее файловое пространство с быстрым доступом к актуальным материалам.",
    group: "teamwork",
    docsView: "files",
    searchPlaceholder: "Поиск по файлам и папкам",
    actionLabel: "Загрузить файл",
  },
  mail: {
    title: "Почта",
    description:
      "Входящие письма, идеи и системные уведомления без визуального шума.",
    group: "teamwork",
    searchPlaceholder: "Поиск по inbox",
    actionLabel: "Подключить ящик",
  },
  groups: {
    title: "Группы",
    description:
      "Командные пространства, долгие инициативы и общие рабочие контуры.",
    group: "teamwork",
    searchPlaceholder: "Поиск по группам",
    actionLabel: "Создать группу",
  },
  tasks: {
    title: "Задачи и Проекты",
    description:
      "Операционный контур задач, сроков, владельцев и рабочих списков.",
    searchPlaceholder: "Поиск задач и проектов",
    actionLabel: "Создать",
  },
  company: {
    title: "Сотрудники",
    description:
      "Сотрудники, роли, статусы и быстрый доступ к нужным контактам.",
    searchPlaceholder: "Поиск по сотрудникам",
    actionLabel: "Добавить сотрудника",
  },
};

export const MENU = [
  {
    id: "teamwork",
    title: "Совместная работа",
    items: [
      { route: "messenger", label: "Мессенджер", badge: "MS" },
      { route: "feed", label: "Лента", badge: "FD" },
      { route: "collabs", label: "Коллабы", badge: "CL" },
      { route: "calendar", label: "Календарь", badge: "CA" },
      { route: "documents", label: "Документы", badge: "DC" },
      { route: "boards", label: "Доски", badge: "BD" },
      { route: "drive", label: "Диск", badge: "DK" },
      { route: "mail", label: "Почта", badge: "ML" },
      { route: "groups", label: "Группы", badge: "GP" },
    ],
  },
  {
    id: "core",
    title: "Рабочий контур",
    items: [
      { route: "tasks", label: "Задачи и Проекты", badge: "TK" },
      { route: "company", label: "Сотрудники", badge: "TM" },
    ],
  },
];

export const CHAT_TABS = [
  { id: "chat", label: "Чаты", route: "messenger", badge: "CH" },
  { id: "task", label: "Чаты задач", route: "messenger", badge: "TS" },
  { id: "copilot", label: "Orbit AI", route: "messenger", badge: "AI" },
  { id: "collab", label: "Коллабы", route: "collabs", badge: "CL" },
  { id: "channel", label: "Каналы", route: "messenger", badge: "KN" },
  { id: "notification", label: "Уведомления", route: "messenger", badge: "NT" },
  { id: "call", label: "Телефония", route: "messenger", badge: "CLL" },
  { id: "settings", label: "Настройки", route: "messenger", badge: "ST" },
];

export const DOC_VIEWS = [
  { id: "documents", label: "Документы", route: "documents", badge: "DC" },
  { id: "boards", label: "Доски", route: "boards", badge: "BD" },
  { id: "files", label: "Диск", route: "drive", badge: "DK" },
];

export const QUICK_RAIL = [
  { route: "messenger", label: "Чаты", badge: "Ч" },
  { route: "tasks", label: "Задачи", badge: "З" },
  { route: "calendar", label: "Календарь", badge: "К" },
  { route: "documents", label: "Документы", badge: "Д" },
  { route: "company", label: "Команда", badge: "Т" },
];

export function getMenuSection(route) {
  const group = ROUTE_META[route]?.group || "core";
  return MENU.find((section) => section.id === group) || MENU[1];
}

export function getSearchPlaceholder(route) {
  return ROUTE_META[route]?.searchPlaceholder || "Фильтр + поиск";
}

export function getPrimaryAction(route) {
  const actionLabel = ROUTE_META[route]?.actionLabel || "Создать";

  switch (route) {
    case "feed":
      return { action: "focus-field", selector: "#feedTitle", label: actionLabel };
    case "calendar":
      return { action: "focus-field", selector: "#eventTitle", label: actionLabel };
    case "tasks":
      return { action: "focus-field", selector: "#taskTitle", label: actionLabel };
    case "messenger":
      return { action: "route-create", target: "chat", label: actionLabel };
    case "collabs":
      return { action: "route-create", target: "collab", label: actionLabel };
    case "documents":
      return { action: "route-create", target: "document", label: actionLabel };
    case "boards":
      return { action: "route-create", target: "board", label: actionLabel };
    case "drive":
      return { action: "route-create", target: "file", label: actionLabel };
    case "mail":
      return { action: "route-create", target: "mail", label: actionLabel };
    case "groups":
      return { action: "route-create", target: "group", label: actionLabel };
    case "company":
      return { action: "route-create", target: "person", label: actionLabel };
    default:
      return { action: "quick-capture", label: actionLabel };
  }
}
