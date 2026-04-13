// @ts-nocheck

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { api } from "../services/api";

const STORAGE_KEY_PREFIX = "orbit-ws-";

const ROUTE_META = {
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

const MENU = [
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

const CHAT_TABS = [
  { id: "chat", label: "Чаты", route: "messenger", badge: "CH" },
  { id: "task", label: "Чаты задач", route: "messenger", badge: "TS" },
  { id: "copilot", label: "Orbit AI", route: "messenger", badge: "AI" },
  { id: "collab", label: "Коллабы", route: "collabs", badge: "CL" },
  { id: "channel", label: "Каналы", route: "messenger", badge: "KN" },
  { id: "notification", label: "Уведомления", route: "messenger", badge: "NT" },
  { id: "call", label: "Телефония", route: "messenger", badge: "CLL" },
  { id: "settings", label: "Настройки", route: "messenger", badge: "ST" },
];

const DOC_VIEWS = [
  { id: "documents", label: "Документы", route: "documents", badge: "DC" },
  { id: "boards", label: "Доски", route: "boards", badge: "BD" },
  { id: "files", label: "Диск", route: "drive", badge: "DK" },
];

const QUICK_RAIL = [
  { route: "messenger", label: "Чаты", badge: "Ч" },
  { route: "tasks", label: "Задачи", badge: "З" },
  { route: "calendar", label: "Календарь", badge: "К" },
  { route: "documents", label: "Документы", badge: "Д" },
  { route: "company", label: "Команда", badge: "Т" },
];

function getMenuSection(route) {
  const group = ROUTE_META[route]?.group || "core";
  return MENU.find((section) => section.id === group) || MENU[1];
}

function getSearchPlaceholder(route) {
  return ROUTE_META[route]?.searchPlaceholder || "Фильтр + поиск";
}

function getPrimaryAction(route) {
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

function getHeaderPills(route) {
  switch (route) {
    case "messenger":
    case "collabs":
      return [
        { label: "Непрочитанные", value: getMenuCount("messenger") + getMenuCount("collabs") },
        { label: "Активный AI", value: "OrbitGPT" },
      ];
    case "tasks":
      return [
        { label: "В работе", value: state.tasks.filter((task) => task.status === "active").length },
        { label: "Просрочено", value: state.tasks.filter((task) => task.deadline.includes("апр")).length },
      ];
    case "documents":
    case "boards":
    case "drive":
      return [
        { label: "Материалы", value: state.docs[activeDocsView(route)].length },
        { label: "Пространство", value: "Личное" },
      ];
    case "mail":
      return [
        { label: "Новые", value: state.mail.filter((item) => item.unread).length },
        { label: "Ящики", value: 1 },
      ];
    default:
      return [
        { label: "Фокус", value: `${state.metrics.focusHours}ч` },
        { label: "Входящие", value: state.mail.filter((item) => item.unread).length + getMenuCount("messenger") },
      ];
  }
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSeedState() {
  return {
    ui: {
      groups: {
        teamwork: true,
        core: true,
      },
      mailSelection: "mail-ops-review",
      activeChat: "chat-core",
      activeChatTab: "chat",
      activeTaskView: "list",
      taskRole: "all",
      taskScope: "in-progress",
      calendarView: "month",
      docsLayout: "list",
      query: "",
      selectedTaskId: null,
      showQuickTaskDialog: false,
      showFullTaskForm: false,
      fileDropdownContext: null,
      projectDropdownContext: null,
      quickTaskProject: null,
      fullTaskProject: null,
      quickTaskFiles: [],
      fullTaskFiles: [],
      groupsFilter: "active",
      activeGroupId: null,
      activeGroup: null,
      activeGroupTab: "feed",
      showCreateGroupDialog: false,
      activeGroupSection: "tasks",
      groupTaskView: "list",
      groupTaskRole: "all",
      groupTaskStatus: "in-progress",
      groupTaskSearch: "",
      groupTasks: [],
      groupEvents: [],
      groupFiles: [],
      groupCalendarView: "month",
      groupCalendarYear: new Date().getFullYear(),
      groupCalendarMonth: new Date().getMonth(),
      groupDiskFolder: null,
      showGroupProjectCard: false,
      groupProjectCardTab: "about",
      showGroupTaskCreate: false,
      activeGroupTaskId: null,
      activeGroupTask: null,
      groupFollowing: false,
      showGroupMoreMenu: false,
      groupFeedPostType: "message",
    },
    profile: {
      initials: "",
      name: "",
      role: "",
      workspace: "",
      tag: "",
    },
    metrics: {
      focusHours: 0,
      openTasks: 0,
      scheduledEvents: 0,
      responseRate: 0,
      inbox: 0,
    },
    feed: [],
    tasks: [],
    events: [],
    mail: [],
    docs: {
      documents: [],
      boards: [],
      files: [],
    },
    groups: [],
    people: [],
    chats: [],
  };
}

let activeStorageKey = STORAGE_KEY_PREFIX + "default";

function loadState(wsId) {
  const key = wsId ? STORAGE_KEY_PREFIX + wsId : activeStorageKey;
  activeStorageKey = key;
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return createSeedState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...createSeedState(),
      ...parsed,
      ui: {
        ...createSeedState().ui,
        ...(parsed.ui || {}),
      },
      profile: {
        ...createSeedState().profile,
        ...(parsed.profile || {}),
      },
      metrics: {
        ...createSeedState().metrics,
        ...(parsed.metrics || {}),
      },
      docs: {
        ...createSeedState().docs,
        ...(parsed.docs || {}),
      },
    };
  } catch (error) {
    console.error("Failed to load saved state", error);
    return createSeedState();
  }
}

let state = loadState();
let currentRouteKey = "messenger";
let navigateImpl = null;
let setReactState = null;

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveState(snapshot = state) {
  localStorage.setItem(activeStorageKey, JSON.stringify(snapshot));
}

// ─── Fetch workspace data from API ───

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${d.getDate()} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return String(dateStr); }
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const months = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
    return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]}`;
  } catch { return String(dateStr); }
}

async function fetchWorkspaceData() {
  try {
    const [tasksRes, chatsRes, eventsRes, feedRes, mailRes, docsRes, groupsRes, peopleRes] = await Promise.allSettled([
      api.tasks.list(),
      api.chats.list(),
      api.events.list(),
      api.feed.list(),
      api.mail.list(),
      api.documents.list(),
      api.groups.list(),
      api.people.list(),
    ]);

    const data = {};

    // Tasks
    if (tasksRes.status === "fulfilled") {
      data.tasks = tasksRes.value.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        status: t.status || "active",
        priority: t.priority || "medium",
        deadline: t.deadline || "",
        activity: formatDate(t.updatedAt),
        assignee: t.assignee || "",
        creator: t.assignee || "",
        project: t.project || "",
        projectType: "group",
        tags: t.tags || "",
        bucket: t.bucket || "week",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 6,
        doneDay: 10,
        comments: 0,
      }));
    }

    // Chats
    if (chatsRes.status === "fulfilled") {
      data.chats = chatsRes.value.chats.map((c) => ({
        id: c.id,
        title: c.title,
        tab: c.tab || "chat",
        counterpart: c.counterpart || "",
        snippet: c.snippet || "",
        unread: c.unread || 0,
        updatedAt: formatDate(c.updatedAt),
        focus: c.focus || "",
        checklist: [],
        messages: (c.messages || []).map((m) => ({
          author: m.authorName || "Система",
          mine: m.isMine || false,
          text: m.body || "",
          time: formatDate(m.createdAt),
        })),
      }));
    }

    // Events
    if (eventsRes.status === "fulfilled") {
      data.events = eventsRes.value.events.map((e) => ({
        id: e.id,
        title: e.title,
        date: formatShortDate(e.date),
        time: e.time || "",
        type: e.type || "note",
      }));
    }

    // Feed
    if (feedRes.status === "fulfilled") {
      data.feed = feedRes.value.posts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        author: p.author || "",
        createdAt: formatDate(p.createdAt),
        tag: p.tag || "",
      }));
    }

    // Mail
    if (mailRes.status === "fulfilled") {
      data.mail = mailRes.value.mail.map((m) => ({
        id: m.id,
        from: m.fromAddr || "",
        subject: m.subject || "",
        preview: m.preview || "",
        body: m.body || "",
        receivedAt: m.receivedAt || formatDate(m.createdAt),
        unread: m.unread ?? true,
      }));
    }

    // Documents (split by kind)
    if (docsRes.status === "fulfilled") {
      const allDocs = docsRes.value.documents;
      data.docs = {
        documents: allDocs.filter((d) => d.kind === "document").map((d) => ({ id: d.id, title: d.title, summary: d.summary || "", meta: d.meta || "" })),
        boards: allDocs.filter((d) => d.kind === "board").map((d) => ({ id: d.id, title: d.title, summary: d.summary || "", meta: d.meta || "" })),
        files: allDocs.filter((d) => d.kind === "file").map((d) => ({ id: d.id, title: d.title, summary: d.summary || "", meta: d.meta || "" })),
      };
    }

    // Groups
    if (groupsRes.status === "fulfilled") {
      data.groups = groupsRes.value.groups.map((g) => ({
        id: g.id,
        title: g.title,
        summary: g.summary || "",
        description: g.description || "",
        type: g.type || "group",
        privacy: g.privacy || "OPEN",
        isArchived: g.isArchived || false,
        memberCount: g.memberCount || g._count?.members || 0,
        myRole: g.myRole || null,
        lastActivityAt: g.lastActivityAt,
        createdAt: g.createdAt,
        owner: g.owner || null,
      }));
    }

    // People
    if (peopleRes.status === "fulfilled") {
      data.people = peopleRes.value.people.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role || "",
        state: p.state || "Оффлайн",
        focus: p.focus || "",
      }));
    }

    // Update metrics from data
    data.metrics = {
      focusHours: 0,
      openTasks: (data.tasks || []).filter((t) => t.status === "active").length,
      scheduledEvents: (data.events || []).length,
      responseRate: 0,
      inbox: (data.mail || []).filter((m) => m.unread).length,
    };

    return data;
  } catch (err) {
    console.error("Failed to fetch workspace data:", err);
    return null;
  }
}

function commit(mutator) {
  if (!setReactState) {
    const draft = cloneState(state);
    mutator(draft);
    state = draft;
    saveState(draft);
    return;
  }

  setReactState((previous) => {
    const draft = cloneState(previous);
    mutator(draft);
    state = draft;
    saveState(draft);
    return draft;
  });
}

function getRoute() {
  if (currentRouteKey && ROUTE_META[currentRouteKey]) {
    return currentRouteKey;
  }

  return "messenger";
}

function navigate(route) {
  if (navigateImpl) {
    navigateImpl(`/${route}`);
  }
}

function getMenuCount(route) {
  switch (route) {
    case "messenger":
      return state.chats
        .filter((chat) => chat.tab === "chat")
        .reduce((sum, chat) => sum + chat.unread, 0);
    case "feed":
      return state.feed.length;
    case "collabs":
      return state.chats
        .filter((chat) => chat.tab === "collab")
        .reduce((sum, chat) => sum + chat.unread, 0);
    case "calendar":
      return state.events.length;
    case "mail":
      return state.mail.filter((mail) => mail.unread).length;
    case "tasks":
      return state.tasks.filter((task) => task.status !== "done").length;
    default:
      return 0;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function activeChatTab(route) {
  if (route === "messenger") {
    return state.ui.activeChatTab || "chat";
  }

  return ROUTE_META[route].chatTab || "chat";
}

function activeDocsView(route) {
  return ROUTE_META[route].docsView || "documents";
}

function filteredTasks() {
  const search = state.ui.query.trim().toLowerCase();
  const role = state.ui.taskRole || "all";
  const scope = state.ui.taskScope || "in-progress";

  return state.tasks.filter((task) => {
    const haystack = `${task.title} ${task.description} ${task.tags || ""} ${task.assignee || ""} ${task.creator || ""}`.toLowerCase();
    const matchesSearch = search ? haystack.includes(search) : true;
    const matchesRole =
      role === "all" ||
      (role === "created" && (task.creator || task.owner) === state.profile.name) ||
      (role === "assigned" && (task.assignee || task.owner) === state.profile.name);
    const matchesScope =
      scope === "all" ||
      (scope === "in-progress" && task.status !== "done") ||
      (scope === "overdue" && task.priority === "overdue") ||
      (scope === "done" && task.status === "done");

    return matchesSearch && matchesRole && matchesScope;
  });
}

function filteredDocs(view) {
  const search = state.ui.query.trim().toLowerCase();
  const list = state.docs[view] || [];

  if (!search) {
    return list;
  }

  return list.filter((item) => {
    const haystack = `${item.title} ${item.summary} ${item.meta}`.toLowerCase();
    return haystack.includes(search);
  });
}

function getChatsForRoute(route) {
  const tab = activeChatTab(route);
  const search = state.ui.query.trim().toLowerCase();

  return state.chats.filter((chat) => {
    const matchesTab = chat.tab === tab;
    const haystack = `${chat.title} ${chat.snippet} ${chat.counterpart}`.toLowerCase();
    const matchesSearch = search ? haystack.includes(search) : true;

    return matchesTab && matchesSearch;
  });
}

function getCurrentChat(route) {
  const chats = getChatsForRoute(route);
  const selected = chats.find((chat) => chat.id === state.ui.activeChat);
  return selected || chats[0] || null;
}

function renderIconBadge(text) {
  return `<span class="icon-badge">${escapeHtml(text)}</span>`;
}

function renderSidebar(route) {
  return `
    <aside class="sidebar fade-in">
      <div class="sidebar-brand-bitrix">
        <button class="sidebar-mobile-toggle" data-action="toggle-sidebar" aria-label="Открыть меню">☰</button>
        <div class="sidebar-brand-copy">
          <strong>Linkora<sup>9</sup></strong>
        </div>
      </div>

      <nav class="sidebar-nav bitrix-nav" aria-label="Основная навигация">
        ${MENU.map((section) => {
          const isOpen = state.ui.groups[section.id] !== false;
          const sectionItems = section.items
            .map((item) => {
              const active = route === item.route;
              const count = getMenuCount(item.route);
              return `
                <button
                  class="nav-item bitrix-nav-item ${active ? "is-active" : ""}"
                  data-action="navigate"
                  data-route="${item.route}"
                >
                  <span class="nav-item-label">
                    ${renderIconBadge(item.badge)}
                    <span>${escapeHtml(item.label)}</span>
                  </span>
                  ${count ? `<span class="nav-item-count">${count}</span>` : ""}
                </button>
              `;
            })
            .join("");

          return `
            <section class="nav-section bitrix-nav-section ${section.id === "apps" ? "is-apps" : ""} ${isOpen ? "" : "is-collapsed"}">
              <button class="nav-group-toggle bitrix-group-toggle" data-action="toggle-group" data-group="${section.id}">
                <span class="nav-group-label">
                  ${escapeHtml(section.title)}
                </span>
                <span class="group-arrow">⌄</span>
              </button>
              <div class="nav-group ${isOpen ? "" : "is-collapsed"}">
                <div class="nav-group-items">${sectionItems}</div>
              </div>
            </section>
          `;
        }).join("")}
      </nav>

      <div class="sidebar-bottom-links">
        <button class="nav-item bitrix-nav-item" data-action="open-memory">
          <span class="nav-item-label">${renderIconBadge("⋯")}<span>Показать все</span></span>
        </button>
        <button class="nav-item bitrix-nav-item" data-action="open-path" data-path="/PROJECT_MEMORY.md">
          <span class="nav-item-label">${renderIconBadge("⚙")}<span>Настройки</span></span>
        </button>
        <button class="nav-item bitrix-nav-item sidebar-logout-btn" data-action="logout">
          <span class="nav-item-label">${renderIconBadge("⏻")}<span>Выйти</span></span>
        </button>
        <div class="sidebar-user-chip" title="${escapeHtml(state.profile.name)}">${escapeHtml(state.profile.initials)}</div>
      </div>
    </aside>
  `;
}

function getTopbarTabs(route) {
  switch (route) {
    case "messenger":
    case "collabs":
      return CHAT_TABS.map((tab) => {
        const count = state.chats
          .filter((chat) => chat.tab === tab.id)
          .reduce((sum, chat) => sum + chat.unread, 0);
        return {
          label: tab.label,
          active: activeChatTab(route) === tab.id,
          action: tab.route !== route ? "navigate" : "set-chat-tab",
          route: tab.route,
          chatTab: tab.id,
          count,
        };
      });
    case "feed":
      return [
        { label: "Все записи", active: true, action: "quick-capture" },
        { label: "Сообщение", active: false, action: "quick-capture" },
        { label: "Событие", active: false, action: "navigate", route: "calendar" },
        { label: "Опрос", active: false, action: "quick-capture" },
        { label: "Файл", active: false, action: "navigate", route: "documents" },
        { label: "Благодарность", active: false, action: "quick-capture" },
        { label: "Важное", active: false, action: "quick-capture" },
        { label: "Избранное", active: false, action: "quick-capture" },
      ];
    case "calendar":
      return [
        { id: "day", label: "День" },
        { id: "week", label: "Неделя" },
        { id: "month", label: "Месяц" },
        { id: "schedule", label: "Расписание" },
      ].map((v) => ({
        label: v.label,
        active: (state.ui.calendarView || "month") === v.id,
        action: "set-calendar-view",
        calendarView: v.id,
      })).concat([
        { label: "Фокус-блоки", active: false, action: "quick-capture" },
        { label: "Приглашения", active: false, action: "quick-capture" },
        { label: "Синхронизация", active: false, action: "quick-capture" },
        { label: "Настройки", active: false, action: "quick-capture" },
      ]);
    case "documents":
    case "boards":
    case "drive":
      return DOC_VIEWS.map((v) => ({
        label: v.label,
        active: route === v.route,
        action: "navigate",
        route: v.route,
      })).concat([
        { label: "Шаблоны", active: false, action: "quick-capture" },
        { label: "Недавние", active: false, action: "quick-capture" },
        { label: "Избранное", active: false, action: "quick-capture" },
        { label: "Общий доступ", active: false, action: "quick-capture" },
        { label: "Корзина", active: false, action: "quick-capture" },
      ]);
    case "mail":
      return [
        { label: "Входящие", active: true, action: "quick-capture" },
        { label: "Непрочитанные", active: false, action: "quick-capture" },
        { label: "Отправленные", active: false, action: "quick-capture" },
        { label: "Черновики", active: false, action: "quick-capture" },
        { label: "Спам", active: false, action: "quick-capture" },
        { label: "Корзина", active: false, action: "quick-capture" },
        { label: "Настройки", active: false, action: "quick-capture" },
      ];
    case "groups":
      return [
        { label: "Все группы", active: true, action: "quick-capture" },
        { label: "Мои группы", active: false, action: "quick-capture" },
        { label: "Избранные", active: false, action: "quick-capture" },
        { label: "Архив", active: false, action: "quick-capture" },
        { label: "Запросы", active: false, action: "quick-capture" },
        { label: "Создать группу", active: false, action: "route-create" },
      ];
    case "tasks":
      return [
        { label: "Задачи", route: "tasks" },
        { label: "Проекты", route: "groups" },
        { label: "Скрам", route: "boards" },
        { label: "Шаблоны", route: "documents" },
        { label: "Корзина", route: "drive" },
      ].map((t) => ({
        label: t.label,
        active: route === t.route && t.label === "Задачи",
        action: "navigate",
        route: t.route,
      })).concat([
        { label: "Эффективность", active: false, action: "quick-capture" },
        { label: "Роботы", active: false, action: "quick-capture" },
      ]);
    case "company":
      return [
        { label: "Все сотрудники", active: true, action: "quick-capture" },
        { label: "Структура", active: false, action: "quick-capture" },
        { label: "Отделы", active: false, action: "quick-capture" },
        { label: "Приглашения", active: false, action: "quick-capture" },
        { label: "Запросы", active: false, action: "quick-capture" },
        { label: "Телефонный справочник", active: false, action: "quick-capture" },
        { label: "Настройки", active: false, action: "quick-capture" },
      ];
    default:
      return [];
  }
}

function renderTopbar(route) {
  const meta = ROUTE_META[route];
  const tabs = getTopbarTabs(route);

  return `
    <header class="topbar fade-in">
      <div class="topbar-service portal-bar">
        <button class="mobile-toggle" data-action="toggle-sidebar" aria-label="Открыть меню">
          ☰
        </button>
        <div class="service-brand">
          <div class="service-brand-mark">LK</div>
          <strong class="service-brand-name">Linkora</strong>
        </div>
        <nav class="service-nav portal-left-tabs" aria-label="Подразделы страницы">
          ${tabs
            .map((tab) => {
              const attrs = [];
              if (tab.action === "navigate" && tab.route) {
                attrs.push(`data-action="navigate" data-route="${tab.route}"`);
              } else if (tab.action === "set-chat-tab" && tab.chatTab) {
                attrs.push(`data-action="set-chat-tab" data-chat-tab="${tab.chatTab}"`);
              } else if (tab.action === "set-calendar-view" && tab.calendarView) {
                attrs.push(`data-action="set-calendar-view" data-calendar-view="${tab.calendarView}"`);
              } else if (tab.action) {
                attrs.push(`data-action="${tab.action}"`);
              }
              const countBadge = tab.count ? `<span class="portal-badge">${tab.count}</span>` : "";
              return `
                <button
                  class="service-nav-button ${tab.active ? "is-active" : ""}"
                  ${attrs.join(" ")}
                >
                  ${escapeHtml(tab.label)}${countBadge}
                </button>
              `;
            })
            .join("")}
        </nav>
        <div class="service-actions">
          <span class="portal-center-brand">${escapeHtml(state.profile.workspace)}</span>
          <button
            class="utility-button"
            data-action="route-create"
            data-target="person"
            data-route="company"
          >
            Пригласить
          </button>
          <button class="utility-button" data-action="open-assistant">
            Помощь
          </button>
          <div class="service-time">17:00</div>
          <div class="avatar">${escapeHtml(state.profile.initials)}</div>
        </div>
      </div>
    </header>
  `;
}

function renderHero(route) {
  return ``;
}

function renderQuickTaskDialog() {
  if (!state.ui.showQuickTaskDialog) return "";
  return `
    <div class="task-dialog-backdrop" data-action="close-quick-task-dialog"></div>
    <div class="task-dialog">
      <form data-form="quick-add-task">
        <h3 class="task-dialog-title">Новая задача</h3>
        <div class="task-dialog-fields">
          <div class="field">
            <label for="quickTaskTitle">Название задачи</label>
            <input id="quickTaskTitle" name="title" placeholder="Например: подготовить отчёт" autofocus />
          </div>
          <div class="field">
            <label for="quickTaskDesc">Описание</label>
            <textarea id="quickTaskDesc" name="description" rows="3" placeholder="Что нужно сделать?"></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="quickTaskAssignee">Исполнитель</label>
              <select id="quickTaskAssignee" name="assignee">
                ${state.people.map((p) => `<option value="${escapeHtml(p.name)}" ${p.name === state.profile.name ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="quickTaskDeadline">Крайний срок</label>
              <input id="quickTaskDeadline" name="deadline" placeholder="10 апреля, 19:00" />
            </div>
          </div>
          <div class="task-quick-chips">
            <div class="chip-dropdown-wrap">
              <button type="button" class="ghost-button" data-action="toggle-file-dropdown" data-context="quick">📎 Файлы${state.ui.quickTaskFiles.length ? ` (${state.ui.quickTaskFiles.length})` : ""}</button>
              ${state.ui.fileDropdownContext === "quick" ? `
                <div class="chip-dropdown">
                  <button type="button" class="chip-dropdown-item" data-action="upload-file" data-context="quick">
                    <span class="chip-dropdown-icon">📤</span>
                    <span>Загрузить</span>
                    <span class="chip-dropdown-hint">с компьютера</span>
                  </button>
                  <button type="button" class="chip-dropdown-item" data-action="pick-from-disk" data-context="quick">
                    <span class="chip-dropdown-icon">☁️</span>
                    <span>Мой диск</span>
                    <span class="chip-dropdown-hint">облако workspace</span>
                  </button>
                </div>
              ` : ""}
            </div>
            <button type="button" class="ghost-button" data-action="quick-capture">☑ Чек-листы</button>
            <div class="chip-dropdown-wrap">
              <button type="button" class="ghost-button ${state.ui.quickTaskProject ? "chip-selected" : ""}" data-action="toggle-project-dropdown" data-context="quick">📁 ${state.ui.quickTaskProject ? escapeHtml(state.groups.find(g => g.id === state.ui.quickTaskProject)?.title || "Проект") : "Проект"}</button>
              ${state.ui.projectDropdownContext === "quick" ? `
                <div class="chip-dropdown">
                  ${state.ui.quickTaskProject ? `
                    <button type="button" class="chip-dropdown-item chip-dropdown-clear" data-action="select-project" data-context="quick" data-project-id="">
                      <span class="chip-dropdown-icon">✕</span>
                      <span>Убрать проект</span>
                    </button>
                  ` : ""}
                  ${state.groups.map(g => `
                    <button type="button" class="chip-dropdown-item ${state.ui.quickTaskProject === g.id ? "is-active" : ""}" data-action="select-project" data-context="quick" data-project-id="${g.id}">
                      <span class="chip-dropdown-icon">👥</span>
                      <span>${escapeHtml(g.title)}</span>
                      <span class="chip-dropdown-hint">${g.members} уч.</span>
                    </button>
                  `).join("")}
                </div>
              ` : ""}
            </div>
          </div>
        </div>
        <div class="task-dialog-actions">
          <button type="submit" class="primary-button">Создать</button>
          <button type="button" class="ghost-button" data-action="close-quick-task-dialog">Отмена</button>
          <button type="button" class="ghost-button task-dialog-fullform" data-action="open-full-task-form">Полная форма →</button>
        </div>
      </form>
    </div>
  `;
}

function renderFullTaskForm() {
  if (!state.ui.showFullTaskForm) return "";
  return `
    <div class="task-dialog-backdrop" data-action="close-full-task-form"></div>
    <div class="task-full-form">
      <form class="task-full-form-left" data-form="full-add-task">
        <h3 class="task-dialog-title">Создание задачи</h3>
        <div class="task-dialog-fields">
          <div class="field">
            <label for="fullTaskTitle">Название задачи</label>
            <input id="fullTaskTitle" name="title" placeholder="Название задачи" autofocus />
          </div>
          <div class="field">
            <label for="fullTaskDesc">Описание</label>
            <textarea id="fullTaskDesc" name="description" rows="4" placeholder="Подробное описание задачи"></textarea>
          </div>
          <div class="field">
            <label>Постановщик</label>
            <input value="${escapeHtml(state.profile.name)}" disabled />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="fullTaskAssignee">Исполнитель</label>
              <select id="fullTaskAssignee" name="assignee">
                ${state.people.map((p) => `<option value="${escapeHtml(p.name)}" ${p.name === state.profile.name ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fullTaskDeadline">Крайний срок</label>
              <input id="fullTaskDeadline" name="deadline" placeholder="10 апреля, 19:00" />
            </div>
          </div>
          <div class="task-full-form-sections">
            <details open class="task-section-files">
              <summary>📎 Файлы ${state.ui.fullTaskFiles.length ? `<span class="section-badge">${state.ui.fullTaskFiles.length}</span>` : ""}</summary>
              <div class="task-file-actions">
                <button type="button" class="task-file-btn" data-action="upload-file" data-context="full">
                  <span class="task-file-btn-icon">📤</span>
                  <span class="task-file-btn-label">Загрузить</span>
                  <span class="task-file-btn-hint">с компьютера</span>
                </button>
                <button type="button" class="task-file-btn" data-action="pick-from-disk" data-context="full">
                  <span class="task-file-btn-icon">☁️</span>
                  <span class="task-file-btn-label">Мой диск</span>
                  <span class="task-file-btn-hint">облако workspace</span>
                </button>
              </div>
              ${state.ui.fullTaskFiles.length ? `
                <div class="task-file-list">
                  ${state.ui.fullTaskFiles.map((f, i) => `
                    <div class="task-file-item">
                      <span class="task-file-item-icon">📄</span>
                      <span class="task-file-item-name">${escapeHtml(f)}</span>
                      <button type="button" class="task-file-item-remove" data-action="remove-file" data-context="full" data-file-index="${i}">✕</button>
                    </div>
                  `).join("")}
                </div>
              ` : ""}
            </details>
            <details><summary>☑ Чек-листы</summary><p>Добавьте пункты чек-листа</p></details>
            <details open class="task-section-project">
              <summary>📁 Проект ${state.ui.fullTaskProject ? `<span class="section-badge">✓</span>` : ""}</summary>
              <div class="task-project-selector">
                ${state.ui.fullTaskProject ? `
                  <div class="task-selected-project">
                    <span class="task-project-avatar">👥</span>
                    <div class="task-project-info">
                      <strong>${escapeHtml(state.groups.find(g => g.id === state.ui.fullTaskProject)?.title || "")}</strong>
                      <span>${escapeHtml(state.groups.find(g => g.id === state.ui.fullTaskProject)?.summary || "")}</span>
                    </div>
                    <button type="button" class="ghost-button task-project-clear" data-action="select-project" data-context="full" data-project-id="">✕ Убрать</button>
                  </div>
                ` : `
                  <div class="task-project-grid">
                    ${state.groups.map(g => `
                      <button type="button" class="task-project-card" data-action="select-project" data-context="full" data-project-id="${g.id}">
                        <span class="task-project-card-avatar">👥</span>
                        <div>
                          <strong>${escapeHtml(g.title)}</strong>
                          <span>${g.members} участника</span>
                        </div>
                      </button>
                    `).join("")}
                  </div>
                `}
              </div>
            </details>
            <details><summary>👥 Соисполнители</summary><p>Добавьте соисполнителей задачи</p></details>
            <details><summary>👁 Наблюдатели</summary><p>Добавьте наблюдателей</p></details>
            <details><summary>🔔 Напоминания</summary><p>Настройте напоминания</p></details>
            <details><summary>🔗 Родительская задача</summary><p>Укажите родительскую задачу</p></details>
            <details><summary>📋 Подзадачи</summary><p>Добавьте подзадачи</p></details>
            <details><summary>🔄 Связанные задачи</summary><p>Укажите связанные задачи</p></details>
            <details><summary>📊 Планирование сроков</summary><p>Настройте планирование по срокам</p></details>
            <details><summary>⏱ Учёт времени</summary><p>Настройте учёт времени по задаче</p></details>
          </div>
        </div>
        <div class="task-dialog-actions">
          <button type="submit" class="primary-button">Создать</button>
          <button type="button" class="ghost-button" data-action="close-full-task-form">Отмена</button>
          <button type="button" class="ghost-button" data-action="quick-capture">Шаблоны</button>
        </div>
      </form>
      <div class="task-full-form-right">
        <div class="task-full-form-chat-preview">
          <div class="pane-head"><h3>Чат задачи</h3><p>Предпросмотр</p></div>
          <div class="task-chat-placeholder">
            <p>Чат задачи будет доступен после создания</p>
            <p class="task-chat-hint">Используйте @ или + для упоминания людей, чатов или AI</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTaskChatView() {
  const tasks = filteredTasks();
  const selectedId = state.ui.selectedTaskId;
  const selectedTask = selectedId ? state.tasks.find((t) => t.id === selectedId) : null;
  const selectedChat = selectedTask?.chatId ? state.chats.find((c) => c.id === selectedTask.chatId) : null;

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Чаты задач</h2>
          <p>Обсуждайте задачи в привязанных чатах.</p>
        </div>
      </div>
    </section>

    ${renderQuickTaskDialog()}
    ${renderFullTaskForm()}
    ${renderCreateGroupDialog()}

    <section class="messenger-shell bitrix-messenger-shell fade-in">
      <div class="panel scroll-area bitrix-chat-list">
        <div class="panel-head">
          <div>
            <h3>Задачи</h3>
            <p>Найдено ${tasks.length}</p>
          </div>
        </div>
        <div class="bitrix-chat-search-row">
          <label class="search-shell compact" style="flex:1">
            <input
              type="search"
              placeholder="Найти задачу"
              data-action="search"
              value="${escapeHtml(state.ui.query)}"
            />
          </label>
          <button class="tiny-icon-button task-add-button" data-action="open-quick-task-dialog" title="Создать задачу">+</button>
        </div>
        <div class="list bitrix-thread-list">
          ${tasks.length
            ? tasks
                .map((task) => {
                  const active = selectedId === task.id;
                  const initials = (task.assignee || task.owner || "?").slice(0, 2);
                  return `
                    <button
                      class="chat-thread-card ${active ? "is-active" : ""}"
                      data-action="select-task-chat"
                      data-task-id="${task.id}"
                    >
                      <div class="thread-avatar task-thread-avatar">${escapeHtml(initials)}</div>
                      <div class="thread-content">
                        <div class="thread-title"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.deadline || "")}</span></div>
                        <div class="thread-snippet">${escapeHtml(task.description || "")}</div>
                      </div>
                      <span class="task-status-dot ${escapeHtml(task.priority)}"></span>
                    </button>
                  `;
                })
                .join("")
            : `<div class="empty-state">Задач не найдено.</div>`}
        </div>
      </div>

      <section class="message-pane bitrix-message-pane panel">
        ${selectedTask && selectedChat
          ? `
            <div class="pane-head">
              <h3>${escapeHtml(selectedTask.title)}</h3>
              <p>${escapeHtml(selectedTask.assignee || selectedTask.owner || "")} · ${escapeHtml(selectedTask.deadline || "без срока")}</p>
            </div>
            <div class="task-chat-meta">
              <span class="task-deadline-pill ${selectedTask.priority === "overdue" ? "overdue" : "upcoming"}">${escapeHtml(selectedTask.deadline || "без срока")}</span>
              <span class="small-tag">${escapeHtml(selectedTask.status)}</span>
              <span class="small-tag">${escapeHtml(selectedTask.project || "")}</span>
            </div>
            <div class="messages scroll-area">
              ${selectedChat.messages
                .map(
                  (message) => `
                  <article class="message-bubble ${message.mine ? "is-mine" : ""}">
                    <div class="message-author">${escapeHtml(message.author)}</div>
                    <p>${escapeHtml(message.text)}</p>
                    <div class="message-time">${escapeHtml(message.time)}</div>
                  </article>
                `,
                )
                .join("")}
            </div>
            <form class="message-form" data-form="send-message">
              <input type="hidden" name="chatId" value="${escapeHtml(selectedChat.id)}" />
              <div class="field-row">
                <div class="field">
                  <label for="taskMsgBody">Сообщение</label>
                  <textarea id="taskMsgBody" name="message" placeholder="Написать в чат задачи..."></textarea>
                </div>
                <button class="primary-button" type="submit">Отправить</button>
              </div>
            </form>
          `
          : `
            <div class="bitrix-empty-state">
              <div class="messenger-center-art">
                <div class="art-card main"></div>
                <div class="art-card mini one"></div>
                <div class="art-card mini two"></div>
                <div class="art-mascot"></div>
              </div>
              <h3>${selectedTask ? "Загрузка чата задачи..." : "Выберите задачу"}</h3>
              <p>Выберите задачу слева, чтобы открыть привязанный чат.</p>
            </div>
          `
        }
      </section>
    </section>
  `;
}

function renderMessenger(route) {
  const chats = getChatsForRoute(route);
  const current = getCurrentChat(route);
  const activeTab = activeChatTab(route);

  if (activeTab === "task") {
    return renderTaskChatView();
  }

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Диалоги и рабочие каналы</h2>
          <p>Чаты, задачи, AI, коллабы, каналы и уведомления под рукой.</p>
        </div>
      </div>
    </section>

    <section class="messenger-shell bitrix-messenger-shell fade-in">
      <div class="panel scroll-area bitrix-chat-list">
        <div class="panel-head">
          <div>
            <h3>Потоки</h3>
            <p>${chats.length ? `Найдено ${chats.length}` : "Потоков не найдено"}</p>
          </div>
        </div>
        <div class="bitrix-chat-search-row">
          <button class="tiny-icon-button" data-action="navigate" data-route="messenger">☷</button>
          <label class="search-shell compact">
            <input
              type="search"
              placeholder="Найти сотрудника или чат"
              data-action="search"
              value="${escapeHtml(state.ui.query)}"
            />
          </label>
          <button class="tiny-icon-button" data-action="route-create" data-target="chat">✎</button>
        </div>
        <div class="list bitrix-thread-list">
          ${chats.length
            ? chats
                .map((chat) => {
                  const active = current && current.id === chat.id;
                  return `
                    <button
                      class="chat-thread-card ${active ? "is-active" : ""}"
                      data-action="select-chat"
                      data-chat-id="${chat.id}"
                    >
                      <div class="thread-avatar">${escapeHtml((chat.title || "?").slice(0, 2))}</div>
                      <div class="thread-content">
                        <div class="thread-title"><strong>${escapeHtml(chat.title)}</strong><span>${escapeHtml(chat.updatedAt)}</span></div>
                        <div class="thread-snippet">${escapeHtml(chat.snippet)}</div>
                      </div>
                      ${chat.unread ? `<span class="pill-counter">${chat.unread}</span>` : ""}
                    </button>
                  `;
                })
                .join("")
            : `<div class="empty-state">По текущему поиску ничего не найдено.</div>`}
        </div>
      </div>

      <section class="message-pane bitrix-message-pane panel">
        ${
          current
            ? `
              <div class="pane-head">
                <h3>${escapeHtml(current.title)}</h3>
                <p>${escapeHtml(current.focus)}</p>
              </div>
              <div class="messages scroll-area">
                ${current.messages
                  .map(
                    (message) => `
                    <article class="message-bubble ${message.mine ? "is-mine" : ""}">
                      <div class="message-author">${escapeHtml(message.author)}</div>
                      <p>${escapeHtml(message.text)}</p>
                      <div class="message-time">${escapeHtml(message.time)}</div>
                    </article>
                  `,
                  )
                  .join("")}
              </div>
              <form class="message-form" data-form="send-message">
                <input type="hidden" name="chatId" value="${escapeHtml(current.id)}" />
                <div class="field-row">
                  <div class="field">
                    <label for="messageBody">Сообщение</label>
                    <textarea id="messageBody" name="message" placeholder="Написать короткий update, решение или follow-up"></textarea>
                  </div>
                  <button class="primary-button" type="submit">Отправить</button>
                </div>
              </form>
            `
            : `
              <div class="bitrix-empty-state">
                <div class="messenger-center-art">
                  <div class="art-card main"></div>
                  <div class="art-card mini one"></div>
                  <div class="art-card mini two"></div>
                  <div class="art-mascot"></div>
                </div>
                <h3>Выберите чат и начните общение</h3>
                <p>Чаты, каналы и уведомления собраны в едином окне.</p>
              </div>
            `
        }
      </section>
    </section>
  `;
}

function renderQuickRail(route) {
  const people = state.people.slice(0, 4);
  return `
    <aside class="quick-rail fade-in" aria-label="Быстрые переходы">
      ${QUICK_RAIL.map((item) => {
        const active = route === item.route;
        return `
          <button
            class="quick-rail-button ${active ? "is-active" : ""}"
            data-action="navigate"
            data-route="${item.route}"
            title="${escapeHtml(item.label)}"
            aria-label="${escapeHtml(item.label)}"
          >
            ${escapeHtml(item.badge)}
          </button>
        `;
      }).join("")}
      <button
        class="quick-rail-button"
        data-action="open-assistant"
        title="Orbit AI"
        aria-label="Orbit AI"
      >
        AI
      </button>
      ${people
        .map(
          (person) => `
            <button
              class="quick-rail-avatar"
              data-action="navigate"
              data-route="company"
              title="${escapeHtml(person.name)}"
              aria-label="${escapeHtml(person.name)}"
            >
              ${escapeHtml(person.name.split(" ").map((part) => part[0]).join("").slice(0, 2))}
            </button>
          `,
        )
        .join("")}
    </aside>
  `;
}

function renderFeed() {
  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Лента активности</h2>
          <p>Короткие апдейты, решения, изменения процессов и заметки по рабочему контуру.</p>
        </div>
      </div>
      <div class="tab-row feed-quick-tabs">
        <button class="tab-chip" data-action="quick-capture">Сообщение</button>
        <button class="tab-chip" data-action="navigate" data-route="calendar">Событие</button>
        <button
          class="tab-chip"
          data-action="create-task"
          data-title="Провести опрос команды"
          data-description="Задача создана из ленты в формате опроса."
          data-tag="feed"
        >
          Опрос
        </button>
        <button class="tab-chip" data-action="navigate" data-route="documents">Файл</button>
      </div>
      <form class="composer-card feed-composer" data-form="add-feed">
        <div class="field-row">
          <div class="field">
            <label for="feedTitle">Заголовок</label>
            <input id="feedTitle" name="title" placeholder="Что произошло или что ты решил?" />
          </div>
          <div class="field">
            <label for="feedTag">Тег</label>
            <select id="feedTag" name="tag">
              <option value="операции">операции</option>
              <option value="контент">контент</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="feedBody">Текст</label>
          <textarea id="feedBody" name="body" placeholder="Оставь короткое описание, чтобы вернуться к решению позже."></textarea>
        </div>
        <div class="hero-actions">
          <button type="submit" class="primary-button">Опубликовать в ленту</button>
        </div>
      </form>
    </section>

    <section class="dashboard-grid fade-in">
      <div class="stack">
        ${state.feed
          .map(
            (post) => `
            <article class="panel feed-card">
              <div class="page-head">
                <div>
                  <h2>${escapeHtml(post.title)}</h2>
                  <p>${escapeHtml(post.body)}</p>
                </div>
                <span class="status-pill active">${escapeHtml(post.tag)}</span>
              </div>
              <footer class="feed-card-footer">
                <span>${escapeHtml(post.author)}</span>
                <span>${escapeHtml(post.createdAt)}</span>
              </footer>
              <div class="label-row feed-card-actions">
                <button class="ghost-button" data-action="quick-capture">Нравится</button>
                <button
                  class="ghost-button"
                  data-action="create-task"
                  data-title="${escapeHtml(`Follow-up: ${post.title}`)}"
                  data-description="${escapeHtml(post.body)}"
                  data-tag="feed"
                >
                  Комментировать
                </button>
                <button class="ghost-button" data-action="navigate" data-route="tasks">Сделать задачей</button>
              </div>
            </article>
          `,
          )
          .join("")}
      </div>
      <div class="stack">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Недельные сигналы</h3>
              <p>Блок для ручной интерпретации, а не для декоративных графиков.</p>
            </div>
          </div>
          <div class="mini-grid">
            <div class="mini-card">
              <h4>Точка давления</h4>
              <p>Входящие письма и follow-up по сделкам всё ещё конкурируют за внимание.</p>
              <button class="ghost-button" data-action="navigate" data-route="mail">Открыть входящие</button>
            </div>
            <div class="mini-card">
              <h4>Лучшее решение</h4>
              <p>Выносить итог созвона сразу в ленту и параллельно создавать задачу.</p>
              <button
                class="ghost-button"
                data-action="create-task"
                data-title="Закрепить итог созвона в задаче"
                data-description="Задача создана из блока недельных сигналов в ленте."
                data-tag="feed"
              >
                Создать задачу
              </button>
            </div>
            <div class="mini-card">
              <h4>Следующий апгрейд</h4>
              <p>Связать ленту с задачами и документами.</p>
              <button class="ghost-button" data-action="navigate" data-route="documents">Перейти к документам</button>
            </div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderCalendar() {
  const calendarView = state.ui.calendarView || "month";
  const views = [
    { id: "day", label: "День" },
    { id: "week", label: "Неделя" },
    { id: "month", label: "Месяц" },
    { id: "schedule", label: "Расписание" },
  ];

  return `
    <section class="timeline-grid fade-in">
      <section class="panel">
        <div class="page-head">
          <div>
            <h2>Ближайшие события</h2>
            <p>Календарь в личной версии делает ставку на ясность, а не на перегруженную сетку.</p>
          </div>
        </div>
        <div class="timeline-list">
          ${state.events
            .map(
              (event) => `
              <article class="timeline-item">
                <time>${escapeHtml(`${event.date} • ${event.time}`)}</time>
                <h4>${escapeHtml(event.title)}</h4>
                <div class="label-row">
                  <span class="type-pill ${escapeHtml(event.type)}">${escapeHtml(event.type)}</span>
                </div>
                <div class="hero-actions">
                  <button
                    class="ghost-button"
                    data-action="create-task"
                    data-title="${escapeHtml(`Событие: ${event.title}`)}"
                    data-description="${escapeHtml(`Подготовка к событию ${event.title} (${event.date} ${event.time}).`)}"
                    data-tag="calendar"
                  >
                    Сделать задачей
                  </button>
                </div>
              </article>
            `,
            )
            .join("")}
        </div>
      </section>

      <section class="panel">
        <div class="page-head">
          <div>
            <h2>Добавить событие</h2>
            <p>Используй для встреч, фокус-блоков и персональных ритуалов.</p>
          </div>
        </div>
        <form class="composer-card" data-form="add-event">
          <div class="form-grid">
            <div class="field">
              <label for="eventTitle">Название</label>
              <input id="eventTitle" name="title" placeholder="Например: review по задачам" />
            </div>
            <div class="field-row">
              <div class="field">
                <label for="eventDate">Дата</label>
                <input id="eventDate" name="date" placeholder="08 апр" />
              </div>
              <div class="field">
                <label for="eventTime">Время</label>
                <input id="eventTime" name="time" placeholder="15:30" />
              </div>
              <div class="field">
                <label for="eventType">Тип</label>
                <select id="eventType" name="type">
                  <option value="meeting">meeting</option>
                  <option value="deadline">deadline</option>
                  <option value="note">note</option>
                </select>
              </div>
            </div>
            <button type="submit" class="primary-button">Сохранить в календарь</button>
          </div>
        </form>
      </section>
    </section>
  `;
}

function renderDocs(route) {
  const view = activeDocsView(route);
  const records = filteredDocs(view);
  const docsLayout = state.ui.docsLayout || "list";
  const launchers = [
    { label: "Документ", target: "document", meta: "DOC" },
    { label: "Таблица", target: "document", meta: "XLS" },
    { label: "Презентация", target: "document", meta: "PPT" },
    { label: "Доска", target: "board", meta: "BOARD", route: "boards" },
    { label: "Загрузка", target: "file", meta: "UP", route: "drive" },
  ];
  const openActions = [
    { label: "Открыть с компьютера", action: "route-create", target: "file", route: "drive" },
    { label: "Открыть с Linkora Диска", action: "navigate", route: "drive" },
    { label: "Выбрать с Google Docs", action: "quick-capture" },
    { label: "Выбрать с Dropbox", action: "quick-capture" },
    { label: "Выбрать с Office 365", action: "quick-capture" },
  ];
  const createdBy = "Кюри Амерханов";
  const layoutTabs = [
    { id: "list", label: "Список" },
    { id: "grid", label: "Сетка" },
    { id: "tile", label: "Плитка" },
  ];
  const renderListLayout = () => `
    <section class="panel fade-in sheet-panel">
      <div class="sheet-table docs-sheet-table">
        <div class="sheet-row is-head">
          <span>ID</span>
          <span>Название файла</span>
          <span>Активность</span>
          <span>Размер файла</span>
          <span>Создан</span>
          <span>Кто создал</span>
          <span>Общий доступ</span>
          <span>Опубликовано</span>
          <span>Действия</span>
        </div>
        ${records
          .map(
            (item, index) => `
              <article class="sheet-row">
                <span>${index + 1}</span>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.meta)}</span>
                <span>${escapeHtml(`${(index + 1) * 82} KB`)}</span>
                <span>${escapeHtml("08.04.2026 13:06")}</span>
                <span>${escapeHtml(createdBy)}</span>
                <span class="small-tag">ВКЛ / ВЫКЛ</span>
                <span class="small-tag">Не опубликовано</span>
                <span class="label-row">
                  <button
                    class="ghost-button"
                    data-action="create-task"
                    data-title="${escapeHtml(`Обновить: ${item.title}`)}"
                    data-description="${escapeHtml(item.summary)}"
                    data-tag="docs"
                  >
                    Открыть
                  </button>
                </span>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="task-table-actions docs-table-actions">
        <button class="task-primary-button" data-action="quick-capture">ПРИМЕНИТЬ</button>
        <button class="task-muted-button" data-action="quick-capture">ОТМЕНИТЬ</button>
        <button class="task-muted-button" data-action="quick-capture">Выбрать все</button>
        <button class="task-muted-button" data-action="quick-capture">Отменить все</button>
      </div>
    </section>
  `;
  const renderGridLayout = () => `
    <section class="cards-grid fade-in">
      ${records
        .map(
          (item) => `
            <article class="data-card">
              <label>${escapeHtml(view.toUpperCase())}</label>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.summary)}</p>
              <div class="label-row">
                <span class="small-tag">${escapeHtml(item.meta)}</span>
              </div>
              <button
                class="ghost-button"
                data-action="create-task"
                data-title="${escapeHtml(`Проверить: ${item.title}`)}"
                data-description="${escapeHtml(item.summary)}"
                data-tag="docs"
              >
                Открыть
              </button>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
  const renderTileLayout = () => `
    <section class="group-grid fade-in">
      ${records
        .map(
          (item) => `
            <article class="group-card">
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.summary)}</p>
              <footer>
                <span>${escapeHtml(item.meta)}</span>
                <span class="small-tag">${escapeHtml(view)}</span>
              </footer>
              <div class="hero-actions">
                <button class="ghost-button" data-action="navigate" data-route="documents">Открыть</button>
                <button
                  class="primary-button"
                  data-action="create-task"
                  data-title="${escapeHtml(`Доработать: ${item.title}`)}"
                  data-description="${escapeHtml(item.summary)}"
                  data-tag="docs"
                >
                  В работу
                </button>
              </div>
            </article>
          `,
        )
        .join("")}
    </section>
  `;

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Документный контур</h2>
          <p>Три близких режима: знания, визуальные доски и файловое хранилище.</p>
        </div>
      </div>
    </section>

    <section class="docs-launch-grid fade-in">
      ${launchers
        .map(
          (item) => `
            <button
              class="doc-launch-card"
              data-action="route-create"
              data-target="${item.target}"
              ${item.route ? `data-route="${item.route}"` : ""}
            >
              <span class="doc-launch-icon">${escapeHtml(item.meta)}</span>
              <strong>${escapeHtml(item.label)}</strong>
            </button>
          `,
        )
        .join("")}
    </section>

    <section class="panel fade-in">
      <div class="docs-open-row">
        <span class="small-tag">Открыть</span>
        ${openActions
          .map(
            (item) => `
              <button
                class="ghost-button"
                data-action="${item.action}"
                ${item.target ? `data-target="${item.target}"` : ""}
                ${item.route ? `data-route="${item.route}"` : ""}
              >
                ${escapeHtml(item.label)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="docs-layout-row">
        ${layoutTabs
          .map(
            (item) => `
              <button
                class="tab-chip ${docsLayout === item.id ? "is-active" : ""}"
                data-action="set-docs-layout"
                data-docs-layout="${item.id}"
              >
                ${escapeHtml(item.label)}
              </button>
            `,
          )
          .join("")}
        <button class="tab-chip" data-action="quick-capture">БУСТЫ</button>
      </div>
    </section>

    ${
      docsLayout === "grid"
        ? renderGridLayout()
        : docsLayout === "tile"
          ? renderTileLayout()
          : renderListLayout()
    }
  `;
}

function renderMail() {
  const selected =
    state.mail.find((item) => item.id === state.ui.mailSelection) || state.mail[0];

  return `
    <section class="mail-grid fade-in">
      <section class="panel">
        <div class="page-head">
          <div>
            <h2>Inbox</h2>
            <p>Письма, идеи и входящие сигналы в формате без лишнего визуального шума.</p>
          </div>
        </div>
        <div class="mail-list">
          ${state.mail
            .map(
              (mail) => `
              <button
                class="mail-item ${selected && selected.id === mail.id ? "is-active" : ""}"
                data-action="select-mail"
                data-mail-id="${mail.id}"
              >
                <h4>${escapeHtml(mail.subject)}</h4>
                <div class="label-row">
                  <span class="small-tag">${escapeHtml(mail.from)}</span>
                  ${mail.unread ? `<span class="status-pill active">new</span>` : ""}
                </div>
                <p>${escapeHtml(mail.preview)}</p>
                <footer>
                  <span>${escapeHtml(mail.receivedAt)}</span>
                </footer>
              </button>
            `,
            )
            .join("")}
        </div>
      </section>

      <article class="mail-preview fade-in">
        <div class="page-head">
          <div>
            <h2>${escapeHtml(selected.subject)}</h2>
            <p>${escapeHtml(`${selected.from} • ${selected.receivedAt}`)}</p>
          </div>
        </div>
        <p>${escapeHtml(selected.body)}</p>
        <div class="hero-actions">
          <button class="primary-button" data-action="navigate" data-route="tasks">Сделать задачей</button>
        </div>
      </article>
    </section>
  `;
}

function renderGroups() {
  // If a group detail is active, render detail view
  const content = (state.ui.activeGroupId && state.ui.activeGroup)
    ? renderGroupDetail()
    : renderGroupList();
  return content + renderCreateGroupDialog();
}

function renderGroupList() {
  const filter = state.ui.groupsFilter || "active";
  const groups = state.groups.filter((g) => {
    if (filter === "archived") return g.isArchived;
    if (filter === "active") return !g.isArchived;
    if (filter === "my") return g.myRole && !g.isArchived;
    if (filter === "open") return g.privacy === "OPEN" && !g.isArchived;
    if (filter === "closed") return g.privacy === "CLOSED" && !g.isArchived;
    return true;
  }).filter((g) => {
    const q = (state.ui.query || "").toLowerCase();
    if (!q) return true;
    return g.title.toLowerCase().includes(q) || (g.summary || "").toLowerCase().includes(q);
  });

  const filters = [
    { key: "active", label: "Активные" },
    { key: "my", label: "Мои" },
    { key: "open", label: "Открытые" },
    { key: "closed", label: "Закрытые" },
    { key: "archived", label: "Архив" },
    { key: "all", label: "Все" },
  ];

  return `
    <section class="groups-module fade-in">
      <!-- Filter bar -->
      <div class="groups-filters">
        ${filters.map((f) => `
          <button class="groups-filter-btn ${filter === f.key ? "is-active" : ""}" data-action="set-groups-filter" data-filter="${f.key}">
            ${f.label}${f.key === "active" ? ` <span class="groups-filter-count">${state.groups.filter((g) => !g.isArchived).length}</span>` : ""}
          </button>
        `).join("")}
        <button class="groups-create-btn" data-action="show-create-group">+ Создать</button>
      </div>

      <!-- Table -->
      ${groups.length === 0 ? `
        <div class="groups-empty">
          <div class="groups-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          </div>
          <p>Групп не найдено</p>
          <p class="groups-empty-hint">Создайте первую группу или проект</p>
        </div>
      ` : `
        <div class="groups-table-wrap">
          <table class="groups-table">
            <thead>
              <tr>
                <th class="groups-th-name">Название</th>
                <th class="groups-th-type">Тип</th>
                <th class="groups-th-privacy">Доступ</th>
                <th class="groups-th-members">Участники</th>
                <th class="groups-th-activity">Активность</th>
                <th class="groups-th-role">Моя роль</th>
              </tr>
            </thead>
            <tbody>
              ${groups.map((g) => {
                const privacyLabel = g.privacy === "CLOSED" ? "Закрытый" : "Открытый";
                const privacyClass = g.privacy === "CLOSED" ? "privacy-closed" : "privacy-open";
                const typeLabel = g.type === "project" ? "Проект" : "Группа";
                const roleLabel = g.myRole === "owner" ? "Владелец" : g.myRole === "moderator" ? "Модератор" : g.myRole === "member" ? "Участник" : "—";
                const initial = g.title.charAt(0).toUpperCase();
                const actDate = g.lastActivityAt ? formatDate(g.lastActivityAt) : "—";
                return `
                  <tr class="groups-row" data-action="open-group" data-group-id="${g.id}">
                    <td class="groups-td-name">
                      <div class="groups-name-cell">
                        <div class="groups-avatar">${initial}</div>
                        <div>
                          <strong>${escapeHtml(g.title)}</strong>
                          ${g.summary ? `<span class="groups-summary">${escapeHtml(g.summary.slice(0, 60))}</span>` : ""}
                        </div>
                      </div>
                    </td>
                    <td><span class="groups-type-badge groups-type-${g.type}">${typeLabel}</span></td>
                    <td><span class="groups-privacy-badge ${privacyClass}">${privacyLabel}</span></td>
                    <td>${g.memberCount || 0}</td>
                    <td class="groups-td-date">${actDate}</td>
                    <td><span class="groups-role-badge">${roleLabel}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `}
    </section>
  `;
}

// ─── Group detail helpers ───

function getKanbanStageLabel(stage) {
  const labels = { new: "Новые", in_progress: "Выполняются", done: "Сделаны", review: "На проверке" };
  return labels[stage] || stage || "Новые";
}

function getKanbanStageColor(stage) {
  const colors = { new: "gd-stage-blue", in_progress: "gd-stage-orange", done: "gd-stage-green", review: "gd-stage-purple" };
  return colors[stage] || "gd-stage-blue";
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startOffset) {
      cells.push({ day: daysInPrevMonth - startOffset + 1 + i, current: false });
    } else if (i < startOffset + daysInMonth) {
      cells.push({ day: i - startOffset + 1, current: true });
    } else {
      cells.push({ day: i - startOffset - daysInMonth + 1, current: false });
    }
  }
  // Split into weeks
  const weeks = [];
  for (let w = 0; w < cells.length; w += 7) {
    weeks.push(cells.slice(w, w + 7));
  }
  return weeks;
}

function getMonthName(month) {
  const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  return months[month] || "";
}

function filterGroupTasks() {
  const tasks = state.ui.groupTasks || [];
  const role = state.ui.groupTaskRole || "all";
  const status = state.ui.groupTaskStatus || "in-progress";
  const search = (state.ui.groupTaskSearch || "").toLowerCase();

  return tasks.filter((t) => {
    const matchesSearch = !search || `${t.title} ${t.description || ""} ${t.assignee || ""}`.toLowerCase().includes(search);
    const matchesRole =
      role === "all" ||
      (role === "assigned" && t.assignee === state.profile.name) ||
      (role === "assisted" && (t.coAssignees || []).includes(state.profile.name)) ||
      (role === "created" && t.creator === state.profile.name) ||
      (role === "watching" && (t.watchers || []).includes(state.profile.name));
    const matchesStatus =
      status === "all" ||
      (status === "in-progress" && t.kanbanStage !== "done") ||
      (status === "done" && t.kanbanStage === "done");
    return matchesSearch && matchesRole && matchesStatus;
  });
}

function renderGroupDetail() {
  const g = state.ui.activeGroup;
  if (!g) return "";
  const section = state.ui.activeGroupSection || "tasks";
  const following = state.ui.groupFollowing;
  const showMore = state.ui.showGroupMoreMenu;

  const sectionTabs = [
    { id: "tasks", label: "Задачи" },
    { id: "feed", label: "Лента" },
    { id: "calendar", label: "Календарь" },
    { id: "disk", label: "Диск" },
    { id: "more", label: "Ещё" },
  ];

  return `
    <section class="group-detail fade-in">
      <!-- Header -->
      <div class="gd-header">
        <button class="group-back-btn" data-action="close-group-detail">&larr; К списку</button>
        <div class="gd-header-row">
          <div class="gd-header-left">
            <div class="group-detail-avatar">${g.title.charAt(0).toUpperCase()}</div>
            <div class="gd-header-title">
              <h2>${escapeHtml(g.title)}</h2>
            </div>
          </div>
          <div class="gd-header-right">
            <button class="ghost-button" data-action="show-group-project-card">О проекте</button>
            <div class="gd-more-wrap">
              <button class="ghost-button gd-more-btn" data-action="toggle-group-more-menu">...</button>
              ${showMore ? `
                <div class="gd-more-dropdown">
                  <button class="gd-more-item" data-action="${following ? "unfollow-group" : "follow-group"}" data-group-id="${g.id}">
                    ${following ? "Не следить" : "Следить"}
                  </button>
                  <button class="gd-more-item" disabled>Расширения</button>
                </div>
              ` : ""}
            </div>
            <button class="ghost-button" data-action="${following ? "unfollow-group" : "follow-group"}" data-group-id="${g.id}">
              ${following ? "Отписаться" : "Подписаться"}
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation tabs -->
      <div class="gd-nav-tabs">
        ${sectionTabs.map((t) => `
          <button class="gd-nav-tab ${section === t.id ? "is-active" : ""}" data-action="set-group-section" data-section="${t.id}">
            ${t.label}
          </button>
        `).join("")}
      </div>

      <!-- Content area -->
      <div class="gd-content">
        ${section === "tasks" ? renderGroupTasksSection() : ""}
        ${section === "feed" ? renderGroupFeedSection() : ""}
        ${section === "calendar" ? renderGroupCalendarSection() : ""}
        ${section === "disk" ? renderGroupDiskSection() : ""}
        ${section === "more" ? renderGroupMoreSection() : ""}
      </div>

      <!-- Overlays -->
      ${renderGroupProjectCard()}
      ${renderGroupTaskDetailOverlay()}
    </section>
  `;
}

function renderGroupTasksSection() {
  const g = state.ui.activeGroup;
  if (!g) return "";
  const tasks = filterGroupTasks();
  const view = state.ui.groupTaskView || "list";
  const role = state.ui.groupTaskRole || "all";
  const status = state.ui.groupTaskStatus || "in-progress";
  const search = state.ui.groupTaskSearch || "";
  const showCreate = state.ui.showGroupTaskCreate;

  const roleTabs = [
    { id: "all", label: "Все роли" },
    { id: "assigned", label: "Я делаю" },
    { id: "assisted", label: "Мне помогают" },
    { id: "created", label: "Я поручил" },
    { id: "watching", label: "Наблюдаю" },
  ];
  const statusTabs = [
    { id: "in-progress", label: "В работе" },
    { id: "done", label: "Завершены" },
    { id: "all", label: "Все" },
  ];
  const viewTabs = [
    { id: "list", label: "Список" },
    { id: "kanban", label: "Канбан" },
    { id: "deadlines", label: "Сроки" },
    { id: "plan", label: "Мой план" },
    { id: "calendar", label: "Календарь" },
    { id: "overdue", label: "Просрочены" },
    { id: "comments", label: "Комментарии" },
  ];

  const renderTaskCreateForm = () => {
    if (!showCreate) return "";
    return `
      <div class="gd-task-create-form">
        <form data-form="create-group-task" data-group-id="${g.id}">
          <h4>Новая задача</h4>
          <div class="field">
            <label for="gdTaskTitle">Название</label>
            <input id="gdTaskTitle" name="title" placeholder="Название задачи" required autofocus />
          </div>
          <div class="field">
            <label for="gdTaskDesc">Описание</label>
            <textarea id="gdTaskDesc" name="description" rows="2" placeholder="Описание задачи"></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="gdTaskAssignee">Исполнитель</label>
              <select id="gdTaskAssignee" name="assignee">
                ${state.people.map((p) => `<option value="${escapeHtml(p.name)}" ${p.name === state.profile.name ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="gdTaskPriority">Приоритет</label>
              <select id="gdTaskPriority" name="priority">
                <option value="low">Низкий</option>
                <option value="medium" selected>Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="gdTaskDeadline">Крайний срок</label>
              <input id="gdTaskDeadline" name="deadline" type="date" />
            </div>
            <div class="field">
              <label for="gdTaskStage">Стадия</label>
              <select id="gdTaskStage" name="kanbanStage">
                <option value="new">Новые</option>
                <option value="in_progress">Выполняются</option>
                <option value="review">На проверке</option>
                <option value="done">Сделаны</option>
              </select>
            </div>
          </div>
          <div class="gd-task-create-actions">
            <button type="submit" class="primary-button">Создать задачу</button>
            <button type="button" class="ghost-button" data-action="close-group-task-create">Отмена</button>
          </div>
        </form>
      </div>
    `;
  };

  const renderListView = () => {
    if (tasks.length === 0) {
      return `<div class="gd-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:12px"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6M12 9v6"/></svg>
        <p style="font-size:1rem;font-weight:600;margin:0 0 4px">Задач пока нет</p>
        <p style="margin:0 0 16px;color:var(--muted)">Создайте первую задачу для этого проекта</p>
        <button class="primary-button" data-action="show-group-task-create" style="font-size:.95rem;padding:12px 32px">+ Создать задачу</button>
      </div>`;
    }
    return `
      <div class="gd-task-table-wrap">
        <table class="gd-task-table">
          <thead>
            <tr>
              <th class="gd-th-check">
                <input type="checkbox" disabled />
              </th>
              <th>Задача</th>
              <th>Стадия</th>
              <th>Активность</th>
              <th>Срок</th>
              <th>Постановщик</th>
              <th>Исполнитель</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map((t) => `
              <tr class="gd-task-row" data-action="open-group-task" data-task-id="${t.id}">
                <td class="gd-th-check"><input type="checkbox" data-stop-close="true" /></td>
                <td><strong>${escapeHtml(t.title)}</strong></td>
                <td><span class="gd-stage-badge ${getKanbanStageColor(t.kanbanStage)}">${getKanbanStageLabel(t.kanbanStage)}</span></td>
                <td class="gd-td-activity">${formatDate(t.updatedAt || t.createdAt)}</td>
                <td>${t.deadline ? `<span class="task-deadline-pill ${new Date(t.deadline) < new Date() ? "overdue" : "upcoming"}">${formatShortDate(t.deadline)}</span>` : "—"}</td>
                <td><span class="person-chip">${escapeHtml(typeof t.creator === "object" ? (t.creator?.name || "") : (t.creator || ""))}</span></td>
                <td><span class="person-chip">${escapeHtml(typeof t.assignee === "object" ? (t.assignee?.name || "") : (t.assignee || ""))}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderKanbanView = () => {
    const stages = ["new", "in_progress", "review", "done"];
    return `
      <div class="gd-kanban-board">
        ${stages.map((stage) => {
          const stageTasks = tasks.filter((t) => (t.kanbanStage || "new") === stage);
          return `
            <div class="gd-kanban-column">
              <div class="gd-kanban-column-head">
                <span class="gd-stage-badge ${getKanbanStageColor(stage)}">${getKanbanStageLabel(stage)}</span>
                <span class="gd-kanban-count">${stageTasks.length}</span>
                <button class="gd-kanban-plus" data-action="show-group-task-create" data-stage="${stage}">+</button>
              </div>
              <div class="gd-kanban-cards">
                ${stageTasks.map((t) => `
                  <div class="gd-kanban-card" data-action="open-group-task" data-task-id="${t.id}">
                    <div class="gd-kanban-card-title">${escapeHtml(t.title)}</div>
                    ${t.deadline ? `<div class="gd-kanban-card-deadline"><span class="task-deadline-pill ${new Date(t.deadline) < new Date() ? "overdue" : "upcoming"}">${formatShortDate(t.deadline)}</span></div>` : ""}
                    <div class="gd-kanban-card-assignee">
                      <span class="gd-mini-avatar">${(t.assignee || "?").charAt(0)}</span>
                      <span>${escapeHtml(t.assignee || "")}</span>
                    </div>
                  </div>
                `).join("")}
                ${stageTasks.length === 0 ? `<div class="gd-kanban-empty">Нет задач</div>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  const renderDeadlinesView = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    const buckets = [
      { id: "overdue", label: "Просрочено", tone: "gd-bucket-red", filter: (t) => t.deadline && new Date(t.deadline) < today },
      { id: "today", label: "Сегодня", tone: "gd-bucket-green", filter: (t) => { if (!t.deadline) return false; const d = new Date(t.deadline); return d >= today && d < new Date(today.getTime() + 86400000); } },
      { id: "week", label: "На этой неделе", tone: "gd-bucket-blue", filter: (t) => { if (!t.deadline) return false; const d = new Date(t.deadline); return d >= new Date(today.getTime() + 86400000) && d <= endOfWeek; } },
      { id: "later", label: "Позже", tone: "gd-bucket-gray", filter: (t) => { if (!t.deadline) return true; return new Date(t.deadline) > endOfWeek; } },
    ];

    return `
      <div class="gd-deadlines-board">
        ${buckets.map((b) => {
          const bucketTasks = tasks.filter(b.filter);
          return `
            <div class="gd-deadline-bucket">
              <div class="gd-deadline-bucket-head ${b.tone}">
                <strong>${b.label}</strong>
                <span>(${bucketTasks.length})</span>
              </div>
              <div class="gd-deadline-bucket-cards">
                ${bucketTasks.map((t) => `
                  <div class="gd-kanban-card" data-action="open-group-task" data-task-id="${t.id}">
                    <div class="gd-kanban-card-title">${escapeHtml(t.title)}</div>
                    ${t.deadline ? `<div class="gd-kanban-card-deadline">${formatShortDate(t.deadline)}</div>` : ""}
                    <div class="gd-kanban-card-assignee"><span class="gd-mini-avatar">${(t.assignee || "?").charAt(0)}</span></div>
                  </div>
                `).join("")}
                ${bucketTasks.length === 0 ? `<div class="gd-kanban-empty">Нет задач</div>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  const renderPlanView = () => {
    const columns = [
      { id: "unplanned", label: "Не спланированы", filter: (t) => !t.planBucket || t.planBucket === "unplanned" },
      { id: "week", label: "Сделаю на неделе", filter: (t) => t.planBucket === "week" },
      { id: "later", label: "Сделаю позже", filter: (t) => t.planBucket === "later" },
    ];
    return `
      <div class="gd-plan-board">
        ${columns.map((col) => {
          const colTasks = tasks.filter(col.filter);
          return `
            <div class="gd-plan-column">
              <div class="gd-plan-column-head">
                <strong>${col.label}</strong>
                <span>(${colTasks.length})</span>
              </div>
              <div class="gd-plan-column-cards">
                ${colTasks.map((t) => `
                  <div class="gd-kanban-card" data-action="open-group-task" data-task-id="${t.id}">
                    <div class="gd-kanban-card-title">${escapeHtml(t.title)}</div>
                    <span class="gd-stage-badge ${getKanbanStageColor(t.kanbanStage)}">${getKanbanStageLabel(t.kanbanStage)}</span>
                    <div class="gd-kanban-card-assignee"><span class="gd-mini-avatar">${(t.assignee || "?").charAt(0)}</span></div>
                  </div>
                `).join("")}
                ${colTasks.length === 0 ? `<div class="gd-kanban-empty">Нет задач</div>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  const renderTaskCalendarView = () => {
    const year = state.ui.groupCalendarYear || new Date().getFullYear();
    const month = state.ui.groupCalendarMonth ?? new Date().getMonth();
    const grid = getCalendarGrid(year, month);
    return `
      <div class="gd-task-calendar">
        <div class="gd-cal-head">
          <h3>${getMonthName(month)} ${year}</h3>
          <div class="gd-cal-nav">
            <button class="ghost-button" data-action="calendar-prev">&#8249;</button>
            <button class="ghost-button" data-action="calendar-next">&#8250;</button>
          </div>
        </div>
        <div class="gd-cal-weekdays">
          <span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span>
        </div>
        <div class="gd-cal-grid">
          ${grid.map((week) => `
            <div class="gd-cal-week">
              ${week.map((cell) => {
                const dayTasks = cell.current ? tasks.filter((t) => {
                  if (!t.deadline) return false;
                  const d = new Date(t.deadline);
                  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === cell.day;
                }) : [];
                return `
                  <div class="gd-cal-cell ${cell.current ? "" : "gd-cal-other"}">
                    <span class="gd-cal-date">${cell.day}</span>
                    ${dayTasks.map((t) => `<div class="gd-cal-pill" title="${escapeHtml(t.title)}">${escapeHtml(t.title.slice(0, 12))}${t.title.length > 12 ? "..." : ""}</div>`).join("")}
                  </div>
                `;
              }).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  };

  const renderOverdueView = () => {
    const now = new Date();
    const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && (t.kanbanStage || "new") !== "done");
    if (overdueTasks.length === 0) {
      return `<div class="gd-empty">Просроченных задач нет.</div>`;
    }
    return `
      <div class="gd-task-table-wrap">
        <table class="gd-task-table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Срок</th>
              <th>Исполнитель</th>
              <th>Стадия</th>
            </tr>
          </thead>
          <tbody>
            ${overdueTasks.map((t) => `
              <tr class="gd-task-row" data-action="open-group-task" data-task-id="${t.id}">
                <td><strong>${escapeHtml(t.title)}</strong></td>
                <td><span class="task-deadline-pill overdue">${formatShortDate(t.deadline)}</span></td>
                <td><span class="person-chip">${escapeHtml(t.assignee || "")}</span></td>
                <td><span class="gd-stage-badge ${getKanbanStageColor(t.kanbanStage)}">${getKanbanStageLabel(t.kanbanStage)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderCommentsView = () => {
    const commentTasks = tasks.filter((t) => (t.commentsCount || 0) > 0);
    if (commentTasks.length === 0) {
      return `<div class="gd-empty">Задач с комментариями нет.</div>`;
    }
    return `
      <div class="gd-task-table-wrap">
        <table class="gd-task-table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Комментарии</th>
              <th>Исполнитель</th>
              <th>Стадия</th>
            </tr>
          </thead>
          <tbody>
            ${commentTasks.map((t) => `
              <tr class="gd-task-row" data-action="open-group-task" data-task-id="${t.id}">
                <td><strong>${escapeHtml(t.title)}</strong></td>
                <td>${t.commentsCount || 0}</td>
                <td><span class="person-chip">${escapeHtml(t.assignee || "")}</span></td>
                <td><span class="gd-stage-badge ${getKanbanStageColor(t.kanbanStage)}">${getKanbanStageLabel(t.kanbanStage)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const views = {
    list: renderListView,
    kanban: renderKanbanView,
    deadlines: renderDeadlinesView,
    plan: renderPlanView,
    calendar: renderTaskCalendarView,
    overdue: renderOverdueView,
    comments: renderCommentsView,
  };

  return `
    <div class="gd-tasks-section">
      <!-- Top filter bar -->
      <div class="gd-tasks-filters">
        <button class="primary-button gd-create-btn" data-action="show-group-task-create">Создать</button>
        <select class="gd-filter-select" data-action="set-group-task-role">
          ${roleTabs.map((r) => `<option value="${r.id}" ${role === r.id ? "selected" : ""}>${r.label}</option>`).join("")}
        </select>
        <select class="gd-filter-select" data-action="set-group-task-status">
          ${statusTabs.map((s) => `<option value="${s.id}" ${status === s.id ? "selected" : ""}>${s.label}</option>`).join("")}
        </select>
        <label class="gd-search-shell">
          <input type="search" placeholder="Поиск задач..." data-action="group-task-search" value="${escapeHtml(search)}" />
        </label>
      </div>

      <!-- View tabs -->
      <div class="gd-view-tabs">
        ${viewTabs.map((t) => `
          <button class="gd-view-tab ${view === t.id ? "is-active" : ""}" data-action="set-group-task-view" data-view="${t.id}">
            ${t.label}
          </button>
        `).join("")}
      </div>

      <!-- Create form -->
      ${renderTaskCreateForm()}

      <!-- View content -->
      ${views[view] ? views[view]() : renderListView()}
    </div>
  `;
}

function renderGroupFeedSection() {
  const g = state.ui.activeGroup;
  if (!g) return "";
  const isMember = Boolean(g.myRole);
  const posts = g.posts || [];
  const postType = state.ui.groupFeedPostType || "message";

  const postTypes = [
    { id: "message", label: "Сообщение" },
    { id: "poll", label: "Опрос" },
    { id: "file", label: "Файл" },
    { id: "gratitude", label: "Благодарность" },
  ];

  const renderMessageForm = () => `
    <form class="gd-feed-form" data-form="add-group-post-typed" data-group-id="${g.id}">
      <input type="hidden" name="postType" value="message" />
      <textarea name="body" placeholder="Написать сообщение в ленту группы..." rows="3"></textarea>
      <button type="submit" class="primary-button">Опубликовать</button>
    </form>
  `;

  const renderPollForm = () => `
    <form class="gd-feed-form" data-form="add-group-post-typed" data-group-id="${g.id}">
      <input type="hidden" name="postType" value="poll" />
      <div class="field">
        <label>Вопрос</label>
        <textarea name="body" placeholder="Введите вопрос опроса..." rows="2"></textarea>
      </div>
      <div class="field">
        <label>Вариант 1</label>
        <input name="option1" placeholder="Вариант ответа 1" />
      </div>
      <div class="field">
        <label>Вариант 2</label>
        <input name="option2" placeholder="Вариант ответа 2" />
      </div>
      <div class="field">
        <label>Вариант 3 (необязательно)</label>
        <input name="option3" placeholder="Вариант ответа 3" />
      </div>
      <div class="field">
        <label>Вариант 4 (необязательно)</label>
        <input name="option4" placeholder="Вариант ответа 4" />
      </div>
      <button type="submit" class="primary-button">Опубликовать опрос</button>
    </form>
  `;

  const renderFileForm = () => `
    <form class="gd-feed-form" data-form="add-group-post-typed" data-group-id="${g.id}">
      <input type="hidden" name="postType" value="file" />
      <div class="field">
        <label>Описание файла</label>
        <textarea name="body" placeholder="Описание прикрепляемого файла..." rows="2"></textarea>
      </div>
      <div class="gd-file-placeholder">Загрузка файлов будет доступна в следующей версии</div>
      <button type="submit" class="primary-button">Опубликовать</button>
    </form>
  `;

  const renderGratitudeForm = () => `
    <form class="gd-feed-form" data-form="add-group-post-typed" data-group-id="${g.id}">
      <input type="hidden" name="postType" value="gratitude" />
      <div class="field">
        <label>Кому</label>
        <select name="recipient">
          ${state.people.map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Сообщение благодарности</label>
        <textarea name="body" placeholder="За что вы благодарите..." rows="3"></textarea>
      </div>
      <button type="submit" class="primary-button">Опубликовать благодарность</button>
    </form>
  `;

  const formRenderers = {
    message: renderMessageForm,
    poll: renderPollForm,
    file: renderFileForm,
    gratitude: renderGratitudeForm,
  };

  const renderPost = (p) => {
    const typeLabel = p.postType === "poll" ? "Опрос" : p.postType === "gratitude" ? "Благодарность" : p.postType === "file" ? "Файл" : "Сообщение";
    let pollHtml = "";
    if (p.postType === "poll" && p.metadata) {
      try {
        const meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata;
        const options = meta.options || [];
        pollHtml = `
          <div class="gd-poll-options">
            ${options.map((opt, idx) => `
              <div class="gd-poll-option">
                <span class="gd-poll-option-text">${escapeHtml(opt.text || opt)}</span>
                <span class="gd-poll-option-count">${opt.votes || 0} голос(ов)</span>
              </div>
            `).join("")}
          </div>
        `;
      } catch (e) { /* ignore parse errors */ }
    }
    return `
      <article class="group-post-card">
        <div class="group-post-author">
          <div class="group-post-author-avatar">${p.author?.initials || "?"}</div>
          <div>
            <strong>${escapeHtml(p.author?.name || "")}</strong>
            <span class="group-post-date">${formatDate(p.createdAt)}</span>
          </div>
          <span class="gd-post-type-badge">${typeLabel}</span>
        </div>
        ${p.title ? `<h4>${escapeHtml(p.title)}</h4>` : ""}
        <p>${escapeHtml(p.body)}</p>
        ${pollHtml}
      </article>
    `;
  };

  return `
    <div class="gd-feed-section">
      ${isMember ? `
        <!-- Post type selector -->
        <div class="gd-feed-type-tabs">
          ${postTypes.map((pt) => `
            <button class="gd-feed-type-tab ${postType === pt.id ? "is-active" : ""}" data-action="set-feed-post-type" data-post-type="${pt.id}">
              ${pt.label}
            </button>
          `).join("")}
        </div>
        <!-- Form -->
        ${formRenderers[postType] ? formRenderers[postType]() : renderMessageForm()}
      ` : ""}

      <!-- Posts -->
      ${posts.length === 0 ? `
        <div class="gd-empty" style="padding: 40px 0;">Сообщений в ленте пока нет</div>
      ` : posts.map(renderPost).join("")}
    </div>
  `;
}

function renderGroupCalendarSection() {
  const g = state.ui.activeGroup;
  if (!g) return "";
  const calView = state.ui.groupCalendarView || "month";
  const year = state.ui.groupCalendarYear || new Date().getFullYear();
  const month = state.ui.groupCalendarMonth ?? new Date().getMonth();
  const events = state.ui.groupEvents || [];

  const viewTabs = [
    { id: "day", label: "День" },
    { id: "week", label: "Неделя" },
    { id: "month", label: "Месяц" },
  ];

  const grid = getCalendarGrid(year, month);

  return `
    <div class="gd-calendar-section">
      <!-- View tabs and nav -->
      <div class="gd-cal-toolbar">
        <div class="gd-cal-view-tabs">
          ${viewTabs.map((v) => `
            <button class="gd-view-tab ${calView === v.id ? "is-active" : ""}" data-action="set-group-calendar-view" data-calendar-view="${v.id}">
              ${v.label}
            </button>
          `).join("")}
        </div>
        <div class="gd-cal-navigation">
          <button class="ghost-button" data-action="calendar-prev">&#8249;</button>
          <span class="gd-cal-label">${getMonthName(month)} ${year}</span>
          <button class="ghost-button" data-action="calendar-next">&#8250;</button>
        </div>
        <button class="primary-button" data-action="show-group-event-create">Создать</button>
      </div>

      <!-- Month grid -->
      <div class="gd-cal-weekdays">
        <span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span>
      </div>
      <div class="gd-cal-grid">
        ${grid.map((week) => `
          <div class="gd-cal-week">
            ${week.map((cell) => {
              const dayEvents = cell.current ? events.filter((e) => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === cell.day;
              }) : [];
              const isToday = cell.current && cell.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return `
                <div class="gd-cal-cell ${cell.current ? "" : "gd-cal-other"} ${isToday ? "gd-cal-today" : ""}">
                  <span class="gd-cal-date">${cell.day}</span>
                  ${dayEvents.map((e) => `<div class="gd-cal-event-pill" title="${escapeHtml(e.title)}">${escapeHtml(e.title.slice(0, 10))}${e.title.length > 10 ? "..." : ""}</div>`).join("")}
                </div>
              `;
            }).join("")}
          </div>
        `).join("")}
      </div>

      <!-- Create event form -->
      <form class="gd-event-form" data-form="create-group-event" data-group-id="${g.id}" style="margin-top: 16px;">
        <h4>Добавить событие</h4>
        <div class="field-row">
          <div class="field">
            <label for="gdEventTitle">Название</label>
            <input id="gdEventTitle" name="title" placeholder="Название события" required />
          </div>
          <div class="field">
            <label for="gdEventDate">Дата</label>
            <input id="gdEventDate" name="date" type="date" required />
          </div>
          <div class="field">
            <label for="gdEventTime">Время</label>
            <input id="gdEventTime" name="time" type="time" />
          </div>
          <div class="field">
            <label for="gdEventType">Тип</label>
            <select id="gdEventType" name="type">
              <option value="meeting">Встреча</option>
              <option value="deadline">Дедлайн</option>
              <option value="note">Заметка</option>
            </select>
          </div>
        </div>
        <button type="submit" class="primary-button">Создать событие</button>
      </form>
    </div>
  `;
}

function renderGroupDiskSection() {
  const g = state.ui.activeGroup;
  if (!g) return "";
  const files = state.ui.groupFiles || [];
  const currentFolder = state.ui.groupDiskFolder;

  const displayFiles = currentFolder
    ? files.filter((f) => f.parentId === currentFolder)
    : files.filter((f) => !f.parentId);

  const breadcrumbs = [];
  if (currentFolder) {
    let folderId = currentFolder;
    let safety = 0;
    while (folderId && safety < 10) {
      const folder = files.find((f) => f.id === folderId);
      if (folder) {
        breadcrumbs.unshift({ id: folder.id, name: folder.filename });
        folderId = folder.parentId || null;
      } else {
        break;
      }
      safety++;
    }
  }

  return `
    <div class="gd-disk-section">
      <!-- Breadcrumb -->
      <div class="gd-disk-breadcrumb">
        <button class="ghost-button" data-action="set-group-disk-folder" data-folder-id="">Корень</button>
        ${breadcrumbs.map((b) => `
          <span class="gd-disk-sep">/</span>
          <button class="ghost-button" data-action="set-group-disk-folder" data-folder-id="${b.id}">${escapeHtml(b.name)}</button>
        `).join("")}
      </div>

      <!-- Actions -->
      <div class="gd-disk-actions">
        <form data-form="create-group-folder" data-group-id="${g.id}" class="gd-disk-create-form">
          <input name="filename" placeholder="Имя новой папки" required />
          <input type="hidden" name="parentId" value="${currentFolder || ""}" />
          <button type="submit" class="ghost-button">Создать папку</button>
        </form>
        <button class="ghost-button" disabled>Загрузить файл</button>
      </div>

      <!-- File table -->
      ${displayFiles.length === 0 ? `
        <div class="gd-empty">Файлов нет. Загрузите первый файл или создайте папку.</div>
      ` : `
        <div class="gd-disk-table-wrap">
          <table class="gd-disk-table">
            <thead>
              <tr>
                <th></th>
                <th>Название</th>
                <th>Размер</th>
                <th>Дата</th>
                <th>Автор</th>
              </tr>
            </thead>
            <tbody>
              ${displayFiles.map((f) => {
                const isFolder = f.isFolder || f.kind === "folder";
                return `
                  <tr class="gd-disk-row" ${isFolder ? `data-action="set-group-disk-folder" data-folder-id="${f.id}"` : ""}>
                    <td class="gd-disk-icon">${isFolder ? "📁" : "📄"}</td>
                    <td><strong>${escapeHtml(f.filename || f.name || "")}</strong></td>
                    <td>${isFolder ? "—" : (f.size ? `${Math.round(f.size / 1024)} KB` : "—")}</td>
                    <td>${formatDate(f.createdAt)}</td>
                    <td>${escapeHtml(f.author?.name || f.creatorName || "")}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function renderGroupMoreSection() {
  return `
    <div class="gd-more-section">
      <div class="gd-more-links">
        <div class="gd-more-link-card">
          <h4>Чат</h4>
          <p>Групповой чат для быстрой коммуникации</p>
          <button class="ghost-button" data-action="navigate" data-route="messenger">Открыть групповой чат</button>
        </div>
        <div class="gd-more-link-card">
          <h4>Сообщения</h4>
          <p>Личные и групповые сообщения</p>
          <button class="ghost-button" data-action="navigate" data-route="messenger">Перейти к сообщениям</button>
        </div>
        <div class="gd-more-link-card">
          <h4>Маркетплейс</h4>
          <p class="gd-more-placeholder">Скоро появится</p>
        </div>
        <div class="gd-more-link-card">
          <h4>База знаний</h4>
          <p class="gd-more-placeholder">Доступ запрещён</p>
        </div>
      </div>
    </div>
  `;
}

function renderGroupProjectCard() {
  if (!state.ui.showGroupProjectCard) return "";
  const g = state.ui.activeGroup;
  if (!g) return "";
  const tab = state.ui.groupProjectCardTab || "about";
  const members = g.members || [];
  const isOwner = g.myRole === "owner" || g.myRole === "moderator";

  const tabs = [
    { id: "about", label: "О проекте" },
    { id: "members", label: "Участники" },
    { id: "streams", label: "Потоки" },
  ];

  const renderAboutTab = () => {
    const privacyLabel = g.privacy === "CLOSED" ? "Закрытый" : "Открытый";
    const typeLabel = g.type === "project" ? "Проект" : "Группа";
    const efficiency = g.efficiency || 0;
    return `
      <div class="gd-pc-about">
        <div class="gd-pc-type-row">
          <span class="groups-type-badge groups-type-${g.type}">${typeLabel}</span>
          <span class="groups-privacy-badge ${g.privacy === "CLOSED" ? "privacy-closed" : "privacy-open"}">${privacyLabel}</span>
        </div>
        <div class="gd-pc-efficiency">
          <div class="gd-pc-efficiency-circle">
            <span class="gd-pc-efficiency-value">${efficiency}%</span>
          </div>
          <span>Эффективность</span>
        </div>
        <div class="gd-pc-participants">
          <div class="gd-pc-owner">
            <div class="group-post-author-avatar">${g.owner?.initials || g.owner?.name?.charAt(0) || "?"}</div>
            <div>
              <strong>${escapeHtml(g.owner?.name || "")}</strong>
              <span>Владелец</span>
            </div>
          </div>
          <span class="gd-pc-member-count">${g.memberCount || 0} участн.</span>
        </div>
        <div class="gd-pc-properties">
          <div class="gd-pc-prop"><label>Создан</label><span>${formatDate(g.createdAt)}</span></div>
          ${g.dateStart ? `<div class="gd-pc-prop"><label>Начало</label><span>${formatShortDate(g.dateStart)}</span></div>` : ""}
          ${g.dateEnd ? `<div class="gd-pc-prop"><label>Конец</label><span>${formatShortDate(g.dateEnd)}</span></div>` : ""}
          ${g.description ? `<div class="gd-pc-prop"><label>Описание</label><span>${escapeHtml(g.description)}</span></div>` : ""}
        </div>
      </div>
    `;
  };

  const renderMembersTab = () => `
    <div class="gd-pc-members">
      <button class="primary-button" data-action="quick-capture" style="margin-bottom: 12px;">+ Пригласить</button>
      <div class="gd-pc-members-table">
        ${members.map((m) => {
          const roleLabel = m.role === "owner" ? "Владелец" : m.role === "moderator" ? "Модератор" : "Участник";
          return `
            <div class="group-member-row">
              <div class="group-member-info">
                <div class="group-post-author-avatar">${m.user?.initials || "?"}</div>
                <div>
                  <strong>${escapeHtml(m.user?.name || "")}</strong>
                  <span class="group-member-role">${escapeHtml(m.user?.jobTitle || "")}</span>
                </div>
              </div>
              <span class="groups-role-badge">${roleLabel}</span>
              ${isOwner && m.role !== "owner" ? `
                <button class="ghost-button small" data-action="remove-group-member" data-group-id="${g.id}" data-user-id="${m.userId}">Исключить</button>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  const renderStreamsTab = () => `
    <div class="gd-pc-streams">
      <div class="gd-empty">Потоков пока нет</div>
      <button class="ghost-button" disabled>Создать поток</button>
    </div>
  `;

  const tabRenderers = { about: renderAboutTab, members: renderMembersTab, streams: renderStreamsTab };

  return `
    <div class="dialog-overlay" data-action="close-group-project-card">
      <div class="dialog-card gd-project-card" data-stop-close="true">
        <div class="dialog-header">
          <h3>${escapeHtml(g.title)}</h3>
          <button class="dialog-close" data-action="close-group-project-card">&times;</button>
        </div>
        <div class="gd-pc-tabs">
          ${tabs.map((t) => `
            <button class="gd-pc-tab ${tab === t.id ? "is-active" : ""}" data-action="set-project-card-tab" data-tab="${t.id}">
              ${t.label}
            </button>
          `).join("")}
        </div>
        <div class="gd-pc-content">
          ${tabRenderers[tab] ? tabRenderers[tab]() : renderAboutTab()}
        </div>
      </div>
    </div>
  `;
}

function renderGroupTaskDetailOverlay() {
  const task = state.ui.activeGroupTask;
  if (!task) return "";
  const g = state.ui.activeGroup;

  return `
    <div class="dialog-overlay" data-action="close-group-task-detail">
      <div class="dialog-card gd-task-detail-card" data-stop-close="true">
        <div class="gd-task-detail-layout">
          <!-- Left: Task info -->
          <div class="gd-task-detail-left">
            <div class="dialog-header">
              <h3>${escapeHtml(task.title)}</h3>
              <button class="dialog-close" data-action="close-group-task-detail">&times;</button>
            </div>
            <div class="gd-task-detail-body">
              ${task.description ? `<div class="gd-task-detail-desc"><label>Описание</label><p>${escapeHtml(task.description)}</p></div>` : ""}
              <div class="gd-task-detail-fields">
                <div class="gd-task-detail-field">
                  <label>Статус / Стадия</label>
                  <select data-action="change-task-kanban-stage" data-task-id="${task.id}" data-group-id="${g ? g.id : ""}">
                    <option value="new" ${task.kanbanStage === "new" ? "selected" : ""}>Новые</option>
                    <option value="in_progress" ${task.kanbanStage === "in_progress" ? "selected" : ""}>Выполняются</option>
                    <option value="review" ${task.kanbanStage === "review" ? "selected" : ""}>На проверке</option>
                    <option value="done" ${task.kanbanStage === "done" ? "selected" : ""}>Сделаны</option>
                  </select>
                </div>
                <div class="gd-task-detail-field">
                  <label>Исполнитель</label>
                  <span class="person-chip">${escapeHtml(task.assignee || "Не назначен")}</span>
                </div>
                <div class="gd-task-detail-field">
                  <label>Постановщик</label>
                  <span class="person-chip">${escapeHtml(typeof task.creator === "object" ? (task.creator?.name || "") : (task.creator || ""))}</span>
                </div>
                <div class="gd-task-detail-field">
                  <label>Срок</label>
                  <span>${task.deadline ? formatShortDate(task.deadline) : "Не указан"}</span>
                </div>
                <div class="gd-task-detail-field">
                  <label>Приоритет</label>
                  <span class="small-tag">${escapeHtml(task.priority || "medium")}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Chat panel -->
          <div class="gd-task-detail-right">
            <div class="pane-head"><h4>Чат задачи</h4></div>
            <div class="gd-task-chat-messages">
              <div class="gd-task-chat-placeholder">
                <p>Чат задачи. Сообщения появятся здесь.</p>
              </div>
            </div>
            <div class="gd-task-chat-input">
              <input type="text" placeholder="Написать комментарий..." disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCreateGroupDialog() {
  if (!state.ui.showCreateGroupDialog) return "";
  return `
    <div class="dialog-overlay" data-action="close-create-group">
      <div class="dialog-card" data-stop-close="true">
        <div class="dialog-header">
          <h3>Создать группу / проект</h3>
          <button class="dialog-close" data-action="close-create-group">&times;</button>
        </div>
        <form data-form="create-group" class="dialog-form">
          <div class="auth-field">
            <label>Название</label>
            <input name="title" type="text" placeholder="Название группы или проекта" required autofocus />
          </div>
          <div class="auth-field">
            <label>Описание</label>
            <textarea name="description" rows="3" placeholder="Краткое описание (необязательно)"></textarea>
          </div>
          <div class="dialog-row">
            <div class="auth-field" style="flex:1">
              <label>Тип</label>
              <select name="type" class="dialog-select">
                <option value="group">Группа</option>
                <option value="project">Проект</option>
              </select>
            </div>
            <div class="auth-field" style="flex:1">
              <label>Доступ</label>
              <select name="privacy" class="dialog-select">
                <option value="OPEN">Открытый</option>
                <option value="CLOSED">Закрытый</option>
              </select>
            </div>
          </div>
          <button type="submit" class="primary-button" style="width:100%;margin-top:8px">Создать</button>
        </form>
      </div>
    </div>
  `;
}

function renderTasks() {
  const tasks = filteredTasks();
  const activeTaskView = state.ui.activeTaskView || "list";
  const taskRole = state.ui.taskRole || "all";
  const taskScope = state.ui.taskScope || "in-progress";
  const moduleTabs = [
    { label: "Задачи", route: "tasks" },
    { label: "Проекты", route: "groups" },
    { label: "Скрам", route: "boards" },
    { label: "Шаблоны", route: "documents" },
    { label: "Корзина", route: "drive" },
  ];
  const roleTabs = [
    { id: "all", label: "Все роли" },
    { id: "created", label: "Поручил" },
    { id: "assigned", label: "Делаю" },
  ];
  const scopeTabs = [
    { id: "in-progress", label: "В работе" },
    { id: "overdue", label: "Просрочены" },
    { id: "done", label: "Выполнено" },
    { id: "all", label: "Все" },
  ];
  const taskTabs = [
    { id: "list", label: "Список" },
    { id: "deadlines", label: "Сроки" },
    { id: "plan", label: "Мой план" },
    { id: "calendar", label: "Календарь" },
    { id: "gantt", label: "Гант" },
  ];
  const signalTabs = [
    { label: "Чаты задач", tone: "green", value: 1, action: "navigate", route: "messenger", chatTab: "task" },
    { label: "Просрочены", tone: "orange", value: 1, action: "set-task-view", taskView: "deadlines" },
    { label: "Комментарии", tone: "green", value: 1, action: "quick-capture" },
    { label: "Прочитать все", tone: "plain", value: null, action: "clear-task-signals" },
  ];
  const deadlineColumns = [
    { id: "overdue", label: "Просрочены", tone: "salmon" },
    { id: "today", label: "На сегодня", tone: "lime" },
    { id: "week", label: "На этой неделе", tone: "cyan" },
    { id: "next", label: "На следующей неделе", tone: "sky" },
    { id: "none", label: "Без срока", tone: "gray" },
    { id: "later", label: "Больше двух недель", tone: "blue" },
  ];
  const planColumns = [
    { id: "unscheduled", label: "Не спланированы", tone: "cyan" },
    { id: "doneweek", label: "Сделаю на неделе", tone: "mint" },
  ];

  const renderTaskBadge = (task) => {
    if (task.priority === "overdue") {
      return `<span class="task-deadline-pill overdue">${escapeHtml(task.deadline)}</span>`;
    }
    return `<span class="task-deadline-pill upcoming">${escapeHtml(task.deadline)}</span>`;
  };

  const renderTaskMiniCard = (task) => `
    <article class="task-board-card ${escapeHtml(task.priority)}">
      <div class="task-board-title-row">
        <h5>${escapeHtml(task.title)}</h5>
      <span class="task-count-badge ${escapeHtml(task.priority)}">${escapeHtml(String(task.comments || 0))}</span>
      </div>
      ${renderTaskBadge(task)}
      <div class="task-avatar-row">
        <span class="task-avatar">👤</span>
        <span class="task-arrow">›</span>
        <span class="task-avatar">👤</span>
      </div>
    </article>
  `;

  const renderListView = () => `
    <section class="task-surface fade-in">
      <div class="task-table-wrap">
        <table class="task-table bitrix-task-table">
          <thead>
            <tr>
              <th class="checkbox-cell">☐</th>
              <th>Название</th>
              <th class="active-col">Активность</th>
              <th>Крайний срок</th>
              <th>Постановщик</th>
              <th>Исполнитель</th>
              <th>Проект</th>
              <th>Теги</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (task) => `
                <tr>
                  <td class="checkbox-cell">☐</td>
                  <td>
                    <div class="task-list-title">${escapeHtml(task.title)}</div>
                  </td>
                  <td class="active-col">
                    <div class="task-activity-wrap">
                      <span class="task-signal-dot ${escapeHtml(task.priority)}">1</span>
                      <span>${escapeHtml(task.activity || "")}</span>
                    </div>
                  </td>
                  <td>${renderTaskBadge(task)}</td>
                  <td><span class="person-chip">👤 ${escapeHtml(task.creator || task.owner || "")}</span></td>
                  <td><span class="person-chip">👤 ${escapeHtml(task.assignee || task.owner || "")}</span></td>
                  <td><span class="project-chip">👥 ${escapeHtml(task.project || "")}</span></td>
                  <td>${escapeHtml(task.tags || "")}</td>
                </tr>
              `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="task-table-footer">
          <div>ОТМЕЧЕНО: 0 / ${tasks.length}</div>
          <div>ВСЕГО: <span>ПОКАЗАТЬ КОЛИЧЕСТВО</span></div>
          <div>СТРАНИЦЫ: 1</div>
          <div class="task-footer-right">НА СТРАНИЦЕ: <strong>50</strong></div>
        </div>
        <div class="task-table-actions">
          <button class="task-muted-button" data-action="set-task-view" data-task-view="plan">ВЫБЕРИТЕ ДЕЙСТВИЕ</button>
          <button class="task-primary-button" data-action="quick-capture">ПРИМЕНИТЬ</button>
          <label class="task-check-all"><input type="checkbox" /> ДЛЯ ВСЕХ</label>
        </div>
      </div>
    </section>
  `;

  const renderDeadlinesView = () => `
    <section class="task-kanban-surface fade-in">
      <div class="task-deadline-board">
        ${deadlineColumns
          .map((column) => {
            const tasksByColumn = tasks.filter((task) => task.bucket === column.id);
            return `
              <div class="task-deadline-column">
                <div class="task-column-head ${escapeHtml(column.tone)}">
                  <strong>${escapeHtml(column.label)}</strong>
                  <span>(${tasksByColumn.length})</span>
                </div>
                <div class="task-column-plus">+</div>
                <div class="task-column-stack">
                  ${tasksByColumn.map(renderTaskMiniCard).join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;

  const renderPlanView = () => `
    <section class="task-kanban-surface fade-in">
      <div class="task-plan-board">
        ${planColumns
          .map((column) => {
            const tasksByColumn = tasks.filter((task) => task.planBucket === column.id);
            return `
              <div class="task-plan-column">
                <div class="task-column-head ${escapeHtml(column.tone)}">
                  <strong>${escapeHtml(column.label)}</strong>
                  <span>(${tasksByColumn.length})</span>
                </div>
                <div class="task-column-plus">+</div>
                ${column.id === "doneweek" ? '<div class="task-fast-add">✚ Быстрая задача</div>' : ""}
                <div class="task-column-stack">
                  ${tasksByColumn.map(renderTaskMiniCard).join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;

  const renderCalendarView = () => {
    const days = Array.from({ length: 35 }, (_, index) => index - 1);
    return `
      <section class="task-surface fade-in">
        <div class="task-calendar-wrap">
          <div class="task-calendar-head">
            <h3>Апрель, 2026</h3>
            <div class="task-calendar-controls">Месяц <span>‹</span> Сегодня <span>›</span></div>
          </div>
          <div class="task-calendar-weekdays">
            <span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span>
          </div>
          <div class="task-calendar-grid">
            ${days
              .map((day, index) => {
                const labels = [30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3];
                const label = labels[index];
                const event = label === 10 ? '<div class="task-calendar-event"><span class="dot"></span>Внедрении ии в тг ка... <small>19:00</small></div>' : '';
                const marker = label === 6 ? '<span class="task-calendar-badge">6</span>' : '';
                return `
                  <div class="task-calendar-cell ${label === 6 ? "selected" : ""}">
                    <span class="task-calendar-date">${label}</span>
                    ${marker}
                    ${event}
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </section>
    `;
  };

  const renderGanttView = () => `
    <section class="task-surface fade-in">
      <div class="task-gantt-wrap">
        <div class="task-gantt-sidebar">
          <div class="task-gantt-sidebar-head">Задачи</div>
          ${tasks
            .map(
              (task) => `
                <div class="task-gantt-name ${escapeHtml(task.priority)}">
                  ${escapeHtml(task.title)}
                  <span class="task-count-badge ${escapeHtml(task.priority)}">1</span>
                </div>
              `,
            )
            .join("")}
          <div class="task-gantt-pages">СТРАНИЦЫ: 1</div>
        </div>
        <div class="task-gantt-chart">
          <div class="task-gantt-month">Апрель 2026</div>
          <div class="task-gantt-days">
            ${Array.from({ length: 22 }, (_, idx) => `<span>${idx + 1}</span>`).join("")}
          </div>
          <div class="task-gantt-rows">
            ${tasks
              .map(
                (task) => `
                  <div class="task-gantt-row">
                    ${Array.from({ length: 22 }, (_, idx) => `<span class="task-gantt-cell ${idx + 1 === 6 ? "highlight" : ""}"></span>`).join("")}
                    <div class="task-gantt-bar ${escapeHtml(task.priority)}" style="left:${(task.startDay - 1) * 48}px;width:${(task.endDay - task.startDay + 1) * 48}px"></div>
                    <div class="task-gantt-marker ${escapeHtml(task.priority)}" style="left:${(task.doneDay - 1) * 48}px"></div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;

  const views = {
    list: renderListView,
    deadlines: renderDeadlinesView,
    plan: renderPlanView,
    calendar: renderCalendarView,
    gantt: renderGanttView,
  };

  return `
    <section class="task-shell fade-in">

      <section class="panel task-intake-card">
        <div class="page-head">
          <div>
            <h2>Быстрое создание задачи</h2>
            <p>Короткая форма для мгновенного добавления задачи в текущий контур.</p>
          </div>
        </div>
        <form class="composer-card task-inline-form" data-form="add-task">
          <div class="form-grid">
            <div class="field">
              <label for="taskTitle">Название</label>
              <input id="taskTitle" name="title" placeholder="Например: закрыть CRM cleanup" />
            </div>
            <div class="field">
              <label for="taskDescription">Описание</label>
              <textarea id="taskDescription" name="description" placeholder="Что именно нужно довести до результата?"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="taskStatus">Статус</label>
                <select id="taskStatus" name="status">
                  <option value="backlog">backlog</option>
                  <option value="active">active</option>
                  <option value="review">review</option>
                </select>
              </div>
              <div class="field">
                <label for="taskPriority">Приоритет</label>
                <select id="taskPriority" name="priority">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div class="field">
                <label for="taskDeadline">Дедлайн</label>
                <input id="taskDeadline" name="deadline" placeholder="13 апр" />
              </div>
            </div>
            <button type="submit" class="primary-button">Добавить задачу</button>
          </div>
        </form>
      </section>
      <div class="task-toolbar-top">
        <div class="task-role-row">
          ${roleTabs
            .map(
              (item) => `
                <button
                  class="task-view-tab ${taskRole === item.id ? "is-active" : ""}"
                  data-action="set-task-role"
                  data-task-role="${item.id}"
                >
                  ${escapeHtml(item.label)}${item.id === "all" ? `<span class="pill-counter">${tasks.length}</span>` : ""}
                </button>
              `,
            )
            .join("")}
          <span class="task-search-chip small-tag">${escapeHtml(state.ui.query ? `Поиск: ${state.ui.query}` : "Поиск из верхней панели")}</span>
        </div>
        <div class="task-role-row">
          ${scopeTabs
            .map(
              (item) => `
                <button
                  class="task-view-tab ${taskScope === item.id ? "is-active" : ""}"
                  data-action="set-task-scope"
                  data-task-scope="${item.id}"
                >
                  ${escapeHtml(item.label)}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="task-view-tabs">
          ${taskTabs
            .map(
              (tab) => `
                <button class="task-view-tab ${tab.id === activeTaskView ? "is-active" : ""}" data-action="set-task-view" data-task-view="${tab.id}">${tab.label}</button>
              `,
            )
            .join("")}
        </div>
        <div class="task-toolbar-actions">
          <button class="task-toolbar-button" data-action="open-assistant">Обратная связь</button>
        </div>
      </div>
      <div class="task-signal-tabs">
        ${signalTabs
          .map(
            (tab) => `
              <button
                class="task-signal-tab ${tab.tone}"
                data-action="${tab.action}"
                ${tab.route ? `data-route="${tab.route}"` : ""}
                ${tab.chatTab ? `data-chat-tab="${tab.chatTab}"` : ""}
                ${tab.taskView ? `data-task-view="${tab.taskView}"` : ""}
              >${tab.value !== null ? `<span>${tab.value}</span>` : ""}${tab.label}</button>
            `,
          )
          .join("")}
      </div>
      ${views[activeTaskView] ? views[activeTaskView]() : renderListView()}
    </section>
  `;
}

function renderCompany() {
  return `
    <section class="directory-grid fade-in">
      ${state.people
        .map(
          (person) => `
          <article class="person-card">
            <h4>${escapeHtml(person.name)}</h4>
            <div class="label-row">
              <span class="small-tag">${escapeHtml(person.role)}</span>
              <span class="status-pill active">${escapeHtml(person.state)}</span>
            </div>
            <p>${escapeHtml(person.focus)}</p>
            <div class="hero-actions">
              <button
                class="ghost-button"
                data-action="open-person-chat"
                data-person="${escapeHtml(person.name)}"
              >
                Написать
              </button>
              <button
                class="primary-button"
                data-action="create-task"
                data-title="${escapeHtml(`Задача: ${person.name}`)}"
                data-description="${escapeHtml(`Согласовать шаг с ${person.name}.`)}"
                data-tag="company"
              >
                Поставить задачу
              </button>
            </div>
          </article>
        `,
        )
        .join("")}
    </section>
  `;
}

function renderDashboard(route) {
  switch (route) {
    case "messenger":
    case "collabs":
      return renderMessenger(route);
    case "feed":
      return renderFeed();
    case "calendar":
      return renderCalendar();
    case "documents":
    case "boards":
    case "drive":
      return renderDocs(route);
    case "mail":
      return renderMail();
    case "groups":
      return renderGroups();
    case "tasks":
      return renderTasks();
    case "company":
      return renderCompany();
    default:
      return "";
  }
}

function renderWorkspace(route) {
  return `
    <main class="workspace">
      <section class="workspace-body workspace-body-flat">
        ${renderDashboard(route)}
      </section>
    </main>
  `;
}

function renderApp(route) {
  return `
    <div class="overlay" data-action="close-sidebar"></div>
    <div class="app-shell">
      ${renderSidebar(route)}
      <div class="content-shell">
        ${renderTopbar(route)}
        ${renderWorkspace(route)}
      </div>
      ${renderQuickRail(route)}
    </div>
  `;
}

function createRouteRecord(draft, target, options = {}) {
  switch (target) {
    case "chat": {
      const chatId = createId("chat");
      draft.chats.unshift({
        id: chatId,
        title: "Новый диалог",
        tab: "chat",
        counterpart: "Новый контакт",
        snippet: "Диалог создан из верхней панели.",
        unread: 0,
        updatedAt: "Сейчас",
        focus: "Старт общения",
        checklist: ["Уточнить тему", "Зафиксировать следующий шаг", "Связать с задачей при необходимости"],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text: "Новый диалог создан. Можно сразу зафиксировать контекст и следующий шаг.",
            time: "Сейчас",
          },
        ],
      });
      draft.ui.activeChat = chatId;
      draft.ui.activeChatTab = "chat";
      break;
    }
    case "collab": {
      const chatId = createId("chat");
      draft.chats.unshift({
        id: chatId,
        title: "Новый коллаб",
        tab: "collab",
        counterpart: "Внешняя команда",
        snippet: "Коллаб создан и готов к наполнению.",
        unread: 0,
        updatedAt: "Сейчас",
        focus: "Согласовать цель и ритм",
        checklist: ["Собрать участников", "Определить scope", "Поставить дедлайн"],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text: "Коллаб создан. Зафиксируй участников и ожидаемый результат, чтобы не терять рамку.",
            time: "Сейчас",
          },
        ],
      });
      draft.ui.activeChat = chatId;
      draft.ui.activeChatTab = "collab";
      break;
    }
    case "document":
      draft.docs.documents.unshift({
        id: createId("doc"),
        title: "Новый документ",
        summary: "Черновик для заметок, описаний и рабочих решений.",
        meta: "Только что",
      });
      break;
    case "board":
      draft.docs.boards.unshift({
        id: createId("board"),
        title: "Новая доска",
        summary: "Полотно для структуры, идей и быстрых схем.",
        meta: "0 карточек",
      });
      break;
    case "file":
      draft.docs.files.unshift({
        id: createId("file"),
        title: "new-upload/",
        summary: "Новая рабочая папка для материалов текущего цикла.",
        meta: "Пусто",
      });
      break;
    case "mail": {
      const mailId = createId("mail");
      draft.mail.unshift({
        id: mailId,
        from: "System",
        subject: "Подключение нового ящика",
        preview: "Черновик подключения почтового ящика создан и ждет настроек.",
        body: "Новый ящик добавлен в рабочий контур как черновик. На backend-этапе это место будет связано с реальным почтовым провайдером и очередью синхронизации.",
        receivedAt: "Только что",
        unread: true,
      });
      draft.ui.mailSelection = mailId;
      draft.metrics.inbox = draft.mail.filter((item) => item.unread).length;
      break;
    }
    case "group":
      // Show create group dialog instead of instant local creation
      draft.ui.showCreateGroupDialog = true;
      break;
    case "task":
      draft.tasks.unshift({
        id: createId("task"),
        title: options.title || "Новая задача",
        description:
          options.description ||
          "Задача создана из связанного блока интерфейса. Уточни шаги и дедлайн.",
        status: "backlog",
        priority: "medium",
        deadline: "без даты",
        owner: draft.profile.name,
        assignee: draft.profile.name,
        creator: draft.profile.name,
        project: "Внутрянка Консалт",
        projectType: "group",
        tags: options.tag || "manual",
        bucket: "none",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 2,
        doneDay: 3,
        comments: 0,
      });
      draft.metrics.openTasks = draft.tasks.filter((task) => task.status !== "done").length;
      break;
    case "campaign":
      draft.feed.unshift({
        id: createId("feed"),
        title: "Новый маркетинговый эксперимент",
        body: "Создан новый эксперимент. Зафиксируй гипотезу, метрику успеха и следующий шаг перед запуском.",
        author: draft.profile.name,
        createdAt: "Только что",
        tag: "маркетинг",
      });
      break;
    case "report":
      draft.docs.documents.unshift({
        id: createId("doc"),
        title: "Отчет BI",
        summary: "Черновик отчета по ключевым метрикам и управленческим сигналам.",
        meta: "Только что",
      });
      break;
    case "person":
      draft.people.unshift({
        id: createId("person"),
        name: "Новый участник",
        role: "Приглашение отправлено",
        state: "Ожидает",
        focus: "Подключение к личному контуру",
      });
      break;
    default:
      break;
  }
}

function handleClick(event) {
  // If clicked inside a dialog-card (data-stop-close), skip overlay-close actions
  // but still handle other data-action clicks inside the card
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const action = actionTarget.dataset.action;

  // For overlay close actions: only fire if the click was directly on the overlay, not inside the card
  const overlayCloseActions = ["close-create-group", "close-group-project-card", "close-group-task-detail"];
  if (overlayCloseActions.includes(action) && actionTarget.classList.contains("dialog-overlay")) {
    // Check if click was actually on a child card (not the overlay background)
    const cardInside = event.target.closest("[data-stop-close]");
    if (cardInside) return; // Click was inside card — don't close
  }

  if (action === "navigate") {
    const route = actionTarget.dataset.route;
    if (route) {
      commit((draft) => {
        const nextTab = actionTarget.dataset.chatTab;
        if (nextTab) {
          const nextChat = draft.chats.find((chat) => chat.tab === nextTab);
          if (nextChat) {
            draft.ui.activeChat = nextChat.id;
          }
          draft.ui.activeChatTab = nextTab;
        } else if (route === "messenger") {
          draft.ui.activeChatTab = "chat";
          const nextChat = draft.chats.find((chat) => chat.tab === "chat");
          if (nextChat) {
            draft.ui.activeChat = nextChat.id;
          }
        }
        draft.ui.sidebarOpen = false;
      });
      navigate(route);
    }
    return;
  }

  if (action === "logout") {
    if (logoutImpl) {
      logoutImpl();
    }
    return;
  }

  if (action === "toggle-group") {
    const group = actionTarget.dataset.group;
    commit((draft) => {
      draft.ui.groups[group] = draft.ui.groups[group] === false;
    });
    return;
  }

  if (action === "toggle-sidebar") {
    commit((draft) => {
      draft.ui.sidebarOpen = !draft.ui.sidebarOpen;
    });
    return;
  }

  if (action === "close-sidebar") {
    commit((draft) => {
      draft.ui.sidebarOpen = false;
    });
    return;
  }

  // ─── Group actions ───

  if (action === "set-groups-filter") {
    const filter = actionTarget.dataset.filter;
    commit((draft) => { draft.ui.groupsFilter = filter; });
    return;
  }

  if (action === "open-group") {
    const groupId = actionTarget.closest("[data-group-id]")?.dataset.groupId;
    if (groupId) {
      api.groups.get(groupId).then((data) => {
        const defaultLanding = data.group.defaultLanding || "tasks";
        // Fetch posts, tasks, events, and files in parallel
        Promise.allSettled([
          api.groups.listPosts(groupId),
          api.groups.listTasks(groupId),
          api.groups.listEvents(groupId),
          api.groups.listFiles(groupId),
        ]).then(([postsRes, tasksRes, eventsRes, filesRes]) => {
          commit((draft) => {
            draft.ui.activeGroupId = groupId;
            draft.ui.activeGroup = {
              ...data.group,
              posts: postsRes.status === "fulfilled" ? postsRes.value.posts : [],
            };
            draft.ui.activeGroupTab = "feed";
            draft.ui.activeGroupSection = defaultLanding;
            draft.ui.groupTasks = tasksRes.status === "fulfilled" ? tasksRes.value.tasks : [];
            draft.ui.groupEvents = eventsRes.status === "fulfilled" ? eventsRes.value.events : [];
            draft.ui.groupFiles = filesRes.status === "fulfilled" ? filesRes.value.files : [];
            draft.ui.groupFollowing = false;
            draft.ui.groupTaskView = "list";
            draft.ui.groupTaskRole = "all";
            draft.ui.groupTaskStatus = "in-progress";
            draft.ui.groupTaskSearch = "";
            draft.ui.groupDiskFolder = null;
            draft.ui.showGroupProjectCard = false;
            draft.ui.showGroupTaskCreate = false;
            draft.ui.activeGroupTaskId = null;
            draft.ui.activeGroupTask = null;
            draft.ui.showGroupMoreMenu = false;
            draft.ui.groupFeedPostType = "message";
          });
        });
      }).catch(() => {});
    }
    return;
  }

  if (action === "close-group-detail") {
    commit((draft) => {
      draft.ui.activeGroupId = null;
      draft.ui.activeGroup = null;
    });
    return;
  }

  if (action === "set-group-tab") {
    const tab = actionTarget.dataset.tab;
    commit((draft) => { draft.ui.activeGroupTab = tab; });
    return;
  }

  if (action === "join-group") {
    const groupId = actionTarget.dataset.groupId;
    if (groupId) {
      api.groups.join(groupId).then(() => {
        // Re-fetch group detail and list
        api.groups.get(groupId).then((data) => {
          api.groups.listPosts(groupId).then((postsData) => {
            commit((draft) => {
              draft.ui.activeGroup = { ...data.group, posts: postsData.posts };
            });
          }).catch(() => {
            commit((draft) => { draft.ui.activeGroup = { ...data.group, posts: [] }; });
          });
        });
        // Refresh list
        api.groups.list().then((listData) => {
          commit((draft) => {
            draft.groups = listData.groups.map((g) => ({
              id: g.id, title: g.title, summary: g.summary, description: g.description,
              type: g.type, privacy: g.privacy, isArchived: g.isArchived,
              memberCount: g.memberCount, myRole: g.myRole,
              lastActivityAt: g.lastActivityAt, createdAt: g.createdAt,
              owner: g.owner,
            }));
          });
        });
      }).catch(() => {});
    }
    return;
  }

  if (action === "leave-group") {
    const groupId = actionTarget.dataset.groupId;
    if (groupId) {
      api.groups.leave(groupId).then(() => {
        commit((draft) => {
          draft.ui.activeGroupId = null;
          draft.ui.activeGroup = null;
        });
        api.groups.list().then((listData) => {
          commit((draft) => {
            draft.groups = listData.groups.map((g) => ({
              id: g.id, title: g.title, summary: g.summary, description: g.description,
              type: g.type, privacy: g.privacy, isArchived: g.isArchived,
              memberCount: g.memberCount, myRole: g.myRole,
              lastActivityAt: g.lastActivityAt, createdAt: g.createdAt,
              owner: g.owner,
            }));
          });
        });
      }).catch(() => {});
    }
    return;
  }

  if (action === "remove-group-member") {
    const groupId = actionTarget.dataset.groupId;
    const userId = actionTarget.dataset.userId;
    if (groupId && userId) {
      api.groups.removeMember(groupId, userId).then(() => {
        // Refresh group detail
        api.groups.get(groupId).then((data) => {
          commit((draft) => {
            if (draft.ui.activeGroup) draft.ui.activeGroup = { ...draft.ui.activeGroup, ...data.group };
          });
        });
      }).catch(() => {});
    }
    return;
  }

  if (action === "show-create-group") {
    commit((draft) => { draft.ui.showCreateGroupDialog = true; });
    return;
  }

  if (action === "close-create-group") {
    commit((draft) => { draft.ui.showCreateGroupDialog = false; });
    return;
  }

  // ─── New group detail actions ───

  if (action === "set-group-section") {
    const section = actionTarget.dataset.section;
    if (section) {
      commit((draft) => { draft.ui.activeGroupSection = section; });
      // Lazy-fetch data for section if not yet loaded
      const groupId = state.ui.activeGroupId;
      if (groupId) {
        if (section === "tasks" && (state.ui.groupTasks || []).length === 0) {
          api.groups.listTasks(groupId).then((data) => {
            commit((d) => { d.ui.groupTasks = data.tasks; });
          }).catch(() => {});
        }
        if (section === "calendar" && (state.ui.groupEvents || []).length === 0) {
          api.groups.listEvents(groupId).then((data) => {
            commit((d) => { d.ui.groupEvents = data.events; });
          }).catch(() => {});
        }
        if (section === "disk" && (state.ui.groupFiles || []).length === 0) {
          api.groups.listFiles(groupId).then((data) => {
            commit((d) => { d.ui.groupFiles = data.files; });
          }).catch(() => {});
        }
        if (section === "feed" && !(state.ui.activeGroup?.posts)) {
          api.groups.listPosts(groupId).then((data) => {
            commit((d) => {
              if (d.ui.activeGroup) d.ui.activeGroup.posts = data.posts;
            });
          }).catch(() => {});
        }
      }
    }
    return;
  }

  if (action === "set-group-task-view") {
    const view = actionTarget.dataset.view;
    if (view) {
      commit((draft) => { draft.ui.groupTaskView = view; });
    }
    return;
  }

  if (action === "set-group-task-role") {
    const nextRole = actionTarget.value || actionTarget.dataset.role;
    if (nextRole) {
      commit((draft) => { draft.ui.groupTaskRole = nextRole; });
    }
    return;
  }

  if (action === "set-group-task-status") {
    const nextStatus = actionTarget.value || actionTarget.dataset.status;
    if (nextStatus) {
      commit((draft) => { draft.ui.groupTaskStatus = nextStatus; });
    }
    return;
  }

  if (action === "group-task-search") {
    commit((draft) => { draft.ui.groupTaskSearch = actionTarget.value || ""; });
    return;
  }

  if (action === "show-group-task-create") {
    commit((draft) => { draft.ui.showGroupTaskCreate = true; });
    return;
  }

  if (action === "close-group-task-create") {
    commit((draft) => { draft.ui.showGroupTaskCreate = false; });
    return;
  }

  if (action === "open-group-task") {
    const taskId = actionTarget.closest("[data-task-id]")?.dataset.taskId;
    if (taskId) {
      const task = (state.ui.groupTasks || []).find((t) => t.id === taskId);
      commit((draft) => {
        draft.ui.activeGroupTaskId = taskId;
        draft.ui.activeGroupTask = task || null;
      });
    }
    return;
  }

  if (action === "close-group-task-detail") {
    commit((draft) => {
      draft.ui.activeGroupTaskId = null;
      draft.ui.activeGroupTask = null;
    });
    return;
  }

  if (action === "change-task-kanban-stage") {
    const taskId = actionTarget.dataset.taskId;
    const groupId = actionTarget.dataset.groupId;
    const newStage = actionTarget.value;
    if (taskId && groupId && newStage) {
      api.groups.updateTask(groupId, taskId, { kanbanStage: newStage }).then(() => {
        commit((draft) => {
          const t = (draft.ui.groupTasks || []).find((tk) => tk.id === taskId);
          if (t) t.kanbanStage = newStage;
          if (draft.ui.activeGroupTask && draft.ui.activeGroupTask.id === taskId) {
            draft.ui.activeGroupTask.kanbanStage = newStage;
          }
        });
      }).catch(() => {});
    }
    return;
  }

  if (action === "set-group-calendar-view") {
    const calView = actionTarget.dataset.calendarView;
    if (calView) {
      commit((draft) => { draft.ui.groupCalendarView = calView; });
    }
    return;
  }

  if (action === "set-group-disk-folder") {
    const folderId = actionTarget.dataset.folderId;
    commit((draft) => { draft.ui.groupDiskFolder = folderId || null; });
    return;
  }

  if (action === "show-group-project-card") {
    commit((draft) => {
      draft.ui.showGroupProjectCard = true;
      draft.ui.groupProjectCardTab = "about";
    });
    return;
  }

  if (action === "close-group-project-card") {
    commit((draft) => { draft.ui.showGroupProjectCard = false; });
    return;
  }

  if (action === "set-project-card-tab") {
    const tab = actionTarget.dataset.tab;
    if (tab) {
      commit((draft) => { draft.ui.groupProjectCardTab = tab; });
    }
    return;
  }

  if (action === "toggle-group-more-menu") {
    commit((draft) => { draft.ui.showGroupMoreMenu = !draft.ui.showGroupMoreMenu; });
    return;
  }

  if (action === "follow-group") {
    const groupId = actionTarget.dataset.groupId || state.ui.activeGroupId;
    if (groupId) {
      api.groups.follow(groupId).then(() => {
        commit((draft) => { draft.ui.groupFollowing = true; draft.ui.showGroupMoreMenu = false; });
      }).catch(() => {});
    }
    return;
  }

  if (action === "unfollow-group") {
    const groupId = actionTarget.dataset.groupId || state.ui.activeGroupId;
    if (groupId) {
      api.groups.unfollow(groupId).then(() => {
        commit((draft) => { draft.ui.groupFollowing = false; draft.ui.showGroupMoreMenu = false; });
      }).catch(() => {});
    }
    return;
  }

  if (action === "calendar-prev") {
    commit((draft) => {
      let m = draft.ui.groupCalendarMonth ?? new Date().getMonth();
      let y = draft.ui.groupCalendarYear || new Date().getFullYear();
      m--;
      if (m < 0) { m = 11; y--; }
      draft.ui.groupCalendarMonth = m;
      draft.ui.groupCalendarYear = y;
    });
    return;
  }

  if (action === "calendar-next") {
    commit((draft) => {
      let m = draft.ui.groupCalendarMonth ?? new Date().getMonth();
      let y = draft.ui.groupCalendarYear || new Date().getFullYear();
      m++;
      if (m > 11) { m = 0; y++; }
      draft.ui.groupCalendarMonth = m;
      draft.ui.groupCalendarYear = y;
    });
    return;
  }

  if (action === "set-feed-post-type") {
    const postType = actionTarget.dataset.postType;
    if (postType) {
      commit((draft) => { draft.ui.groupFeedPostType = postType; });
    }
    return;
  }

  if (action === "show-group-event-create") {
    // Scroll to event form (it is always visible in calendar section)
    const form = document.querySelector('[data-form="create-group-event"]');
    if (form instanceof HTMLElement) form.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (action === "select-chat") {
    const chatId = actionTarget.dataset.chatId;
    commit((draft) => {
      draft.ui.activeChat = chatId;
      const targetChat = draft.chats.find((chat) => chat.id === chatId);
      if (targetChat) {
        targetChat.unread = 0;
        draft.ui.activeChatTab = targetChat.tab;
      }
    });
    return;
  }

  if (action === "set-chat-tab") {
    const nextTab = actionTarget.dataset.chatTab;
    if (nextTab) {
      commit((draft) => {
        draft.ui.activeChatTab = nextTab;
        const nextChat = draft.chats.find((chat) => chat.tab === nextTab);
        if (nextChat) {
          draft.ui.activeChat = nextChat.id;
        }
      });
    }
    return;
  }

  if (action === "select-task-chat") {
    const taskId = actionTarget.dataset.taskId;
    commit((draft) => {
      draft.ui.selectedTaskId = taskId;
      const task = draft.tasks.find((t) => t.id === taskId);
      if (task && !task.chatId) {
        const chatId = createId("chat");
        draft.chats.unshift({
          id: chatId,
          title: task.title,
          tab: "task",
          counterpart: task.assignee || task.creator || "",
          snippet: task.description || "",
          unread: 0,
          updatedAt: "Сейчас",
          focus: "Чат задачи",
          checklist: [],
          messages: [
            {
              author: "Orbit AI",
              mine: false,
              text: `Чат задачи «${task.title}» создан. Обсуждайте прогресс здесь.`,
              time: "Сейчас",
            },
          ],
        });
        task.chatId = chatId;
      }
      if (task?.chatId) {
        draft.ui.activeChat = task.chatId;
      }
    });
    return;
  }

  if (action === "open-quick-task-dialog") {
    commit((draft) => {
      draft.ui.showQuickTaskDialog = true;
      draft.ui.showFullTaskForm = false;
      draft.ui.fileDropdownContext = null;
      draft.ui.projectDropdownContext = null;
      draft.ui.quickTaskFiles = [];
      draft.ui.quickTaskProject = null;
    });
    return;
  }

  if (action === "close-quick-task-dialog") {
    commit((draft) => {
      draft.ui.showQuickTaskDialog = false;
      draft.ui.fileDropdownContext = null;
      draft.ui.projectDropdownContext = null;
    });
    return;
  }

  if (action === "open-full-task-form") {
    commit((draft) => {
      draft.ui.showFullTaskForm = true;
      draft.ui.showQuickTaskDialog = false;
      draft.ui.fileDropdownContext = null;
      draft.ui.projectDropdownContext = null;
      draft.ui.fullTaskFiles = [];
      draft.ui.fullTaskProject = null;
    });
    return;
  }

  if (action === "close-full-task-form") {
    commit((draft) => {
      draft.ui.showFullTaskForm = false;
      draft.ui.fileDropdownContext = null;
      draft.ui.projectDropdownContext = null;
    });
    return;
  }

  if (action === "toggle-file-dropdown") {
    const ctx = actionTarget.dataset.context;
    commit((draft) => {
      draft.ui.fileDropdownContext = draft.ui.fileDropdownContext === ctx ? null : ctx;
      draft.ui.projectDropdownContext = null;
    });
    return;
  }

  if (action === "toggle-project-dropdown") {
    const ctx = actionTarget.dataset.context;
    commit((draft) => {
      draft.ui.projectDropdownContext = draft.ui.projectDropdownContext === ctx ? null : ctx;
      draft.ui.fileDropdownContext = null;
    });
    return;
  }

  if (action === "upload-file") {
    const ctx = actionTarget.dataset.context;
    const fakeName = `Документ_${Date.now().toString().slice(-4)}.pdf`;
    commit((draft) => {
      if (ctx === "quick") {
        draft.ui.quickTaskFiles.push(fakeName);
      } else {
        draft.ui.fullTaskFiles.push(fakeName);
      }
      draft.ui.fileDropdownContext = null;
    });
    return;
  }

  if (action === "pick-from-disk") {
    const ctx = actionTarget.dataset.context;
    const fakeName = `Диск_${Date.now().toString().slice(-4)}.docx`;
    commit((draft) => {
      if (ctx === "quick") {
        draft.ui.quickTaskFiles.push(fakeName);
      } else {
        draft.ui.fullTaskFiles.push(fakeName);
      }
      draft.ui.fileDropdownContext = null;
    });
    return;
  }

  if (action === "remove-file") {
    const ctx = actionTarget.dataset.context;
    const idx = parseInt(actionTarget.dataset.fileIndex, 10);
    commit((draft) => {
      if (ctx === "quick") {
        draft.ui.quickTaskFiles.splice(idx, 1);
      } else {
        draft.ui.fullTaskFiles.splice(idx, 1);
      }
    });
    return;
  }

  if (action === "select-project") {
    const ctx = actionTarget.dataset.context;
    const projectId = actionTarget.dataset.projectId;
    commit((draft) => {
      if (ctx === "quick") {
        draft.ui.quickTaskProject = projectId || null;
      } else {
        draft.ui.fullTaskProject = projectId || null;
      }
      draft.ui.projectDropdownContext = null;
    });
    return;
  }

  if (action === "select-mail") {
    const mailId = actionTarget.dataset.mailId;
    commit((draft) => {
      draft.ui.mailSelection = mailId;
      const mail = draft.mail.find((item) => item.id === mailId);
      if (mail) {
        mail.unread = false;
      }
    });
    return;
  }

  if (action === "set-task-view") {
    const nextView = actionTarget.dataset.taskView || actionTarget.dataset.target;
    if (nextView) {
      commit((draft) => {
        draft.ui.activeTaskView = nextView;
      });
    }
    return;
  }

  if (action === "set-task-role") {
    const nextRole = actionTarget.dataset.taskRole;
    if (nextRole) {
      commit((draft) => {
        draft.ui.taskRole = nextRole;
      });
    }
    return;
  }

  if (action === "set-task-scope") {
    const nextScope = actionTarget.dataset.taskScope;
    if (nextScope) {
      commit((draft) => {
        draft.ui.taskScope = nextScope;
      });
    }
    return;
  }

  if (action === "set-calendar-view") {
    const nextView = actionTarget.dataset.calendarView;
    if (nextView) {
      commit((draft) => {
        draft.ui.calendarView = nextView;
      });
    }
    return;
  }

  if (action === "set-docs-layout") {
    const nextLayout = actionTarget.dataset.docsLayout;
    if (nextLayout) {
      commit((draft) => {
        draft.ui.docsLayout = nextLayout;
      });
    }
    return;
  }

  if (action === "clear-task-signals") {
    commit((draft) => {
      draft.tasks = draft.tasks.map((task) => ({ ...task, comments: 0 }));
    });
    return;
  }

  if (action === "create-task") {
    const title = actionTarget.dataset.title;
    const description = actionTarget.dataset.description;
    const tag = actionTarget.dataset.tag;
    commit((draft) => {
      createRouteRecord(draft, "task", { title, description, tag });
    });
    navigate("tasks");
    return;
  }

  if (action === "quick-capture") {
    commit((draft) => {
      draft.feed.unshift({
        id: createId("feed"),
        title: "Быстрая заметка из верхней панели",
        body:
          "Новая мысль добавлена в ленту напрямую из topbar. Это полезно для capture-моментов без переключения контекста.",
        author: draft.profile.name,
        createdAt: "Только что",
        tag: "операции",
      });
    });
    return;
  }

  if (action === "focus-field") {
    const selector = actionTarget.dataset.selector;
    if (selector) {
      const field = document.querySelector(selector);
      if (field instanceof HTMLElement) {
        field.focus();
        if ("select" in field && typeof field.select === "function") {
          field.select();
        }
      }
    }
    return;
  }

  if (action === "route-create") {
    const target = actionTarget.dataset.target;
    const nextRoute = actionTarget.dataset.route;
    commit((draft) => {
      createRouteRecord(draft, target);
    });
    if (nextRoute && nextRoute !== getRoute()) {
      navigate(nextRoute);
    }
    return;
  }

  if (action === "open-person-chat") {
    const personName = actionTarget.dataset.person;
    if (!personName) {
      return;
    }

    commit((draft) => {
      let personChat = draft.chats.find(
        (chat) => chat.counterpart === personName || chat.title.includes(personName),
      );

      if (!personChat) {
        const chatId = createId("chat");
        personChat = {
          id: chatId,
          title: personName,
          tab: "chat",
          counterpart: personName,
          snippet: "Новый чат создан из раздела сотрудников.",
          unread: 0,
          updatedAt: "Сейчас",
          focus: "Рабочая коммуникация",
          checklist: ["Уточнить контекст", "Согласовать следующий шаг"],
          messages: [
            {
              author: "Orbit AI",
              mine: false,
              text: `Чат с ${personName} создан. Зафиксируй цель и следующий шаг.`,
              time: "Сейчас",
            },
          ],
        };
        draft.chats.unshift(personChat);
      }

      draft.ui.activeChat = personChat.id;
      draft.ui.activeChatTab = "chat";
    });
    navigate("messenger");
    return;
  }

  if (action === "open-assistant") {
    commit((draft) => {
      const assistantChat = draft.chats.find((chat) => chat.id === "chat-copilot");
      if (assistantChat) {
        draft.ui.activeChat = assistantChat.id;
        draft.ui.activeChatTab = assistantChat.tab;
      }
    });
    navigate("messenger");
    return;
  }

  if (action === "open-memory") {
    window.open("/PROJECT_MEMORY.md", "_blank", "noopener");
    return;
  }

  if (action === "open-path") {
    const path = actionTarget.dataset.path;
    if (path) {
      window.open(path, "_blank", "noopener");
    }
  }
}

function handleSearch(event) {
  // Handle group task search
  const groupSearchInput = event.target.closest('[data-action="group-task-search"]');
  if (groupSearchInput) {
    commit((draft) => { draft.ui.groupTaskSearch = groupSearchInput.value || ""; });
    return;
  }

  // Handle group task role filter (select change)
  const roleSelect = event.target.closest('[data-action="set-group-task-role"]');
  if (roleSelect) {
    commit((draft) => { draft.ui.groupTaskRole = roleSelect.value || "all"; });
    return;
  }

  // Handle group task status filter (select change)
  const statusSelect = event.target.closest('[data-action="set-group-task-status"]');
  if (statusSelect) {
    commit((draft) => { draft.ui.groupTaskStatus = statusSelect.value || "in-progress"; });
    return;
  }

  const input = event.target.closest('[data-action="search"]');
  if (!input) {
    return;
  }

  commit((draft) => {
    draft.ui.query = input.value;

    const route = getRoute();
    if (route === "messenger" || route === "collabs") {
      const tab = route === "messenger" ? draft.ui.activeChatTab || "chat" : activeChatTab(route);
      const search = draft.ui.query.trim().toLowerCase();
      const nextChat = draft.chats.find((chat) => {
        const matchesTab = chat.tab === tab;
        const haystack = `${chat.title} ${chat.snippet} ${chat.counterpart}`.toLowerCase();
        const matchesSearch = search ? haystack.includes(search) : true;
        return matchesTab && matchesSearch;
      });

      if (nextChat) {
        draft.ui.activeChat = nextChat.id;
      }
    }
  });
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.form) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(form);

  if (form.dataset.form === "create-group") {
    const title = String(formData.get("title") || "").trim();
    if (!title) return;
    const description = String(formData.get("description") || "").trim();
    const type = String(formData.get("type") || "group");
    const privacy = String(formData.get("privacy") || "OPEN");

    api.groups.create({ title, description, type, privacy }).then((data) => {
      commit((draft) => {
        draft.ui.showCreateGroupDialog = false;
        draft.groups.unshift({
          id: data.group.id, title: data.group.title, summary: data.group.summary || "",
          description: data.group.description || "", type: data.group.type, privacy: data.group.privacy,
          isArchived: false, memberCount: data.group.memberCount || 1, myRole: "owner",
          lastActivityAt: data.group.lastActivityAt, createdAt: data.group.createdAt,
          owner: data.group.owner,
        });
      });
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "add-group-post") {
    const groupId = form.dataset.groupId;
    const body = String(formData.get("body") || "").trim();
    if (!body || !groupId) return;

    api.groups.createPost(groupId, { body }).then((data) => {
      commit((draft) => {
        if (draft.ui.activeGroup) {
          if (!draft.ui.activeGroup.posts) draft.ui.activeGroup.posts = [];
          draft.ui.activeGroup.posts.unshift(data.post);
        }
      });
      form.reset();
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "create-group-task") {
    const groupId = form.dataset.groupId;
    const title = String(formData.get("title") || "").trim();
    if (!title || !groupId) return;
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "medium");
    const deadline = String(formData.get("deadline") || "");
    const assignee = String(formData.get("assignee") || state.profile.name);
    const kanbanStage = String(formData.get("kanbanStage") || "new");

    api.groups.createTask(groupId, { title, description, priority, deadline, assignee, kanbanStage }).then((data) => {
      commit((draft) => {
        if (!draft.ui.groupTasks) draft.ui.groupTasks = [];
        draft.ui.groupTasks.unshift(data.task);
        draft.ui.showGroupTaskCreate = false;
      });
      form.reset();
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "create-group-event") {
    const groupId = form.dataset.groupId;
    const title = String(formData.get("title") || "").trim();
    const date = String(formData.get("date") || "").trim();
    if (!title || !date || !groupId) return;
    const time = String(formData.get("time") || "");
    const type = String(formData.get("type") || "meeting");

    api.groups.createEvent(groupId, { title, date, time, type }).then((data) => {
      commit((draft) => {
        if (!draft.ui.groupEvents) draft.ui.groupEvents = [];
        draft.ui.groupEvents.unshift(data.event);
      });
      form.reset();
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "create-group-folder") {
    const groupId = form.dataset.groupId;
    const filename = String(formData.get("filename") || "").trim();
    if (!filename || !groupId) return;
    const parentId = String(formData.get("parentId") || "") || undefined;

    api.groups.createFolder(groupId, { filename, parentId }).then((data) => {
      commit((draft) => {
        if (!draft.ui.groupFiles) draft.ui.groupFiles = [];
        draft.ui.groupFiles.unshift(data.file);
      });
      form.reset();
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "add-group-post-typed") {
    const groupId = form.dataset.groupId;
    const body = String(formData.get("body") || "").trim();
    const postType = String(formData.get("postType") || "message");
    if (!body || !groupId) return;

    let metadata = undefined;
    if (postType === "poll") {
      const options = [];
      for (let i = 1; i <= 4; i++) {
        const opt = String(formData.get(`option${i}`) || "").trim();
        if (opt) options.push({ text: opt, votes: 0 });
      }
      if (options.length >= 2) {
        metadata = JSON.stringify({ options });
      }
    }
    if (postType === "gratitude") {
      const recipient = String(formData.get("recipient") || "").trim();
      if (recipient) {
        metadata = JSON.stringify({ recipient });
      }
    }

    api.groups.createPost(groupId, { body, postType, metadata }).then((data) => {
      commit((draft) => {
        if (draft.ui.activeGroup) {
          if (!draft.ui.activeGroup.posts) draft.ui.activeGroup.posts = [];
          draft.ui.activeGroup.posts.unshift(data.post);
        }
      });
      form.reset();
    }).catch(() => {});
    return;
  }

  if (form.dataset.form === "send-message") {
    const chatId = formData.get("chatId");
    const message = String(formData.get("message") || "").trim();
    if (!message) {
      return;
    }

    commit((draft) => {
      const chat = draft.chats.find((item) => item.id === chatId);
      if (!chat) {
        return;
      }

      chat.messages.push({
        author: draft.profile.name,
        mine: true,
        text: message,
        time: "Только что",
      });
      chat.snippet = message;
      chat.updatedAt = "Сейчас";
    });
    return;
  }

  if (form.dataset.form === "add-task") {
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    if (!title || !description) {
      return;
    }

    commit((draft) => {
      const status = String(formData.get("status") || "backlog");
      const priority = String(formData.get("priority") || "medium");
      draft.tasks.unshift({
        id: createId("task"),
        title,
        description,
        status,
        priority,
        deadline: String(formData.get("deadline") || "без даты"),
        owner: draft.profile.name,
        assignee: draft.profile.name,
        creator: draft.profile.name,
        project: "Внутрянка Консалт",
        projectType: "group",
        tags: "manual",
        bucket: priority === "high" ? "today" : "none",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 2,
        doneDay: 3,
        comments: 0,
      });
      draft.metrics.openTasks = draft.tasks.filter((task) => task.status !== "done").length;
    });
    return;
  }

  if (form.dataset.form === "quick-add-task" || form.dataset.form === "full-add-task") {
    const title = String(formData.get("title") || "").trim();
    if (!title) return;
    const description = String(formData.get("description") || "").trim();
    const assignee = String(formData.get("assignee") || state.profile.name);
    const deadline = String(formData.get("deadline") || "без даты");
    const isQuick = form.dataset.form === "quick-add-task";
    const projectId = isQuick ? state.ui.quickTaskProject : state.ui.fullTaskProject;
    const projectGroup = projectId ? state.groups.find(g => g.id === projectId) : null;
    const projectName = projectGroup ? projectGroup.title : "Внутрянка Консалт";
    const files = isQuick ? [...state.ui.quickTaskFiles] : [...state.ui.fullTaskFiles];

    commit((draft) => {
      const taskId = createId("task");
      const chatId = createId("chat");
      draft.tasks.unshift({
        id: taskId,
        title,
        description,
        status: "active",
        priority: "today",
        deadline,
        owner: draft.profile.name,
        assignee,
        creator: draft.profile.name,
        project: projectName,
        projectType: "group",
        tags: "manual",
        bucket: "today",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 2,
        doneDay: 3,
        comments: 0,
        chatId,
        files,
      });
      draft.chats.unshift({
        id: chatId,
        title,
        tab: "task",
        counterpart: assignee,
        snippet: description || "Задача создана",
        unread: 0,
        updatedAt: "Сейчас",
        focus: "Чат задачи",
        checklist: [],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text: `Задача «${title}» создана. Исполнитель: ${assignee}. Срок: ${deadline}. Проект: ${projectName}.${files.length ? ` Файлы: ${files.join(", ")}.` : ""}`,
            time: "Сейчас",
          },
        ],
      });
      draft.ui.selectedTaskId = taskId;
      draft.ui.activeChat = chatId;
      draft.ui.showQuickTaskDialog = false;
      draft.ui.showFullTaskForm = false;
      draft.ui.fileDropdownContext = null;
      draft.ui.projectDropdownContext = null;
      draft.ui.quickTaskFiles = [];
      draft.ui.quickTaskProject = null;
      draft.ui.fullTaskFiles = [];
      draft.ui.fullTaskProject = null;
      draft.metrics.openTasks = draft.tasks.filter((t) => t.status !== "done").length;
    });
    return;
  }

  if (form.dataset.form === "add-event") {
    const title = String(formData.get("title") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const time = String(formData.get("time") || "").trim();
    if (!title || !date || !time) {
      return;
    }

    commit((draft) => {
      draft.events.unshift({
        id: createId("event"),
        title,
        date,
        time,
        type: String(formData.get("type") || "meeting"),
      });
      draft.metrics.scheduledEvents = draft.events.length;
    });
    return;
  }

  if (form.dataset.form === "add-feed") {
    const title = String(formData.get("title") || "").trim();
    const body = String(formData.get("body") || "").trim();
    if (!title || !body) {
      return;
    }

    commit((draft) => {
      draft.feed.unshift({
        id: createId("feed"),
        title,
        body,
        author: draft.profile.name,
        createdAt: "Только что",
        tag: String(formData.get("tag") || "операции"),
      });
    });
  }
}

let logoutImpl = null;

export default function LegacyWorkspace() {
  const { route: routeParam } = useParams();
  const navigateRouter = useNavigate();
  const { user: authUser, workspace: authWorkspace, logout } = useAuth();
  const wsId = authWorkspace?.id || null;
  const [appState, setAppState] = useState(() => loadState(wsId));
  const loadedWsRef = useRef(null);

  const route = useMemo(() => {
    if (routeParam && ROUTE_META[routeParam]) {
      return routeParam;
    }

    return "messenger";
  }, [routeParam]);

  state = appState;
  currentRouteKey = route;
  setReactState = setAppState;
  navigateImpl = navigateRouter;
  logoutImpl = logout;

  // When workspace changes — reload state from localStorage (per-workspace key) and fetch from API
  useEffect(() => {
    if (!wsId) return;
    // Switch localStorage key to this workspace
    const freshState = loadState(wsId);
    setAppState(freshState);
    state = freshState;

    // Fetch from backend if we haven't loaded this workspace yet
    if (loadedWsRef.current !== wsId) {
      loadedWsRef.current = wsId;
      fetchWorkspaceData().then((apiData) => {
        if (!apiData) return;
        setAppState((prev) => {
          const draft = cloneState(prev);
          if (apiData.tasks) draft.tasks = apiData.tasks;
          if (apiData.chats) draft.chats = apiData.chats;
          if (apiData.events) draft.events = apiData.events;
          if (apiData.feed) draft.feed = apiData.feed;
          if (apiData.mail) draft.mail = apiData.mail;
          if (apiData.docs) draft.docs = apiData.docs;
          if (apiData.groups) draft.groups = apiData.groups;
          if (apiData.people) draft.people = apiData.people;
          if (apiData.metrics) draft.metrics = apiData.metrics;
          state = draft;
          saveState(draft);
          return draft;
        });
      });
    }
  }, [wsId]);

  // Sync auth user profile into state
  useEffect(() => {
    if (authUser) {
      setAppState((prev) => {
        const draft = cloneState(prev);
        draft.profile.name = authUser.name;
        draft.profile.initials = authUser.initials;
        draft.profile.role = authUser.jobTitle || draft.profile.role;
        draft.profile.workspace = authWorkspace?.name || draft.profile.workspace;
        draft.profile.tag = authUser.tag || draft.profile.tag;
        state = draft;
        saveState(draft);
        return draft;
      });
    }
  }, [authUser, authWorkspace]);

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", Boolean(appState.ui.sidebarOpen));

    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [appState.ui.sidebarOpen]);

  useEffect(() => {
    if (!routeParam || !ROUTE_META[routeParam]) {
      navigateRouter("/messenger", { replace: true });
    }
  }, [navigateRouter, routeParam]);

  return (
    <div
      onClick={handleClick}
      onInput={handleSearch}
      onSubmitCapture={handleSubmit}
      dangerouslySetInnerHTML={{ __html: renderApp(route) }}
    />
  );
}
