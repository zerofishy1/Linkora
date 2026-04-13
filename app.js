const STORAGE_KEY = "orbit-workspace-state-v1";

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
  crm: {
    title: "CRM",
    description:
      "Клиенты, сделки, следующий шаг и прозрачная воронка работы.",
    searchPlaceholder: "Поиск по сделкам и клиентам",
    actionLabel: "Новая сделка",
  },
  marketing: {
    title: "Маркетинг",
    description:
      "Кампании, эксперименты, контентные запуски и рабочие гипотезы.",
    searchPlaceholder: "Поиск кампаний и запусков",
    actionLabel: "Новый эксперимент",
  },
  bi: {
    title: "BI Конструктор",
    description:
      "Метрики эффективности, продаж и управленческих сигналов.",
    searchPlaceholder: "Поиск отчетов и метрик",
    actionLabel: "Создать отчет",
  },
  company: {
    title: "Сотрудники",
    description:
      "Сотрудники, роли, статусы и быстрый доступ к нужным контактам.",
    searchPlaceholder: "Поиск по сотрудникам",
    actionLabel: "Добавить сотрудника",
  },
  automation: {
    title: "Автоматизация",
    description:
      "Правила, сценарии и регламенты для повторяющихся процессов.",
    searchPlaceholder: "Поиск правил и сценариев",
    actionLabel: "Создать правило",
  },
  market: {
    title: "Маркетплейс",
    description:
      "Каталог расширений, приложений и полезных подключений.",
    group: "apps",
    searchPlaceholder: "Поиск приложений",
    actionLabel: "Установить приложение",
  },
  devops: {
    title: "Разработчикам",
    description:
      "Репозитории, окружения, пайплайны и технические сервисы.",
    group: "apps",
    searchPlaceholder: "Поиск репозиториев и стендов",
    actionLabel: "Новый репозиторий",
  },
  mcp: {
    title: "MCP-подключения",
    description:
      "Подключения для агентов, инструментов и приватных рабочих контекстов.",
    group: "apps",
    searchPlaceholder: "Фильтр + поиск",
    actionLabel: "Добавить",
  },
  telegram: {
    title: "Безлимитный Telegram",
    description:
      "Канал для алертов, сводок и быстрых команд из Telegram.",
    group: "apps",
    searchPlaceholder: "Поиск Telegram-сценариев",
    actionLabel: "Подключить Telegram",
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
      { route: "crm", label: "CRM", badge: "CR" },
      { route: "marketing", label: "Маркетинг", badge: "MK" },
      { route: "bi", label: "BI Конструктор", badge: "BI" },
      { route: "company", label: "Сотрудники", badge: "TM" },
      { route: "automation", label: "Автоматизация", badge: "AU" },
    ],
  },
  {
    id: "apps",
    title: "Приложения",
    items: [
      { route: "market", label: "Маркетплейс", badge: "MP" },
      { route: "devops", label: "Разработчикам", badge: "DV" },
      { route: "mcp", label: "MCP-подключения", badge: "MC" },
      { route: "telegram", label: "Безлимитный Telegram", badge: "TG" },
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
  { id: "market", label: "Маркет", route: "market", badge: "MR" },
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
  { route: "crm", label: "CRM", badge: "C" },
  { route: "automation", label: "Роботы", badge: "R" },
  { route: "mcp", label: "MCP", badge: "M" },
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
      return { action: "set-task-view", target: "list", label: actionLabel };
    case "crm":
      return { action: "focus-field", selector: "#dealTitle", label: actionLabel };
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
    case "marketing":
      return { action: "route-create", target: "campaign", label: actionLabel };
    case "bi":
      return { action: "route-create", target: "report", label: actionLabel };
    case "company":
      return { action: "route-create", target: "person", label: actionLabel };
    case "automation":
      return { action: "route-create", target: "automation", label: actionLabel };
    case "market":
      return { action: "route-create", target: "app", label: actionLabel };
    case "devops":
      return { action: "route-create", target: "repo", label: actionLabel };
    case "mcp":
      return { action: "route-create", target: "integration", label: actionLabel };
    case "telegram":
      return { action: "route-create", target: "telegram", label: actionLabel };
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
    case "crm":
      return [
        { label: "Сделки", value: state.deals.length },
        { label: "Pipeline", value: formatMoney(state.metrics.pipeline) },
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
    case "automation":
      return [
        { label: "Правила", value: state.automations.length },
        { label: "Активно", value: state.automations.filter((item) => item.status === "active").length },
      ];
    case "mcp":
      return [
        { label: "Подключения", value: state.integrations.length },
        { label: "Статус", value: "Онлайн" },
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
        apps: true,
      },
      mailSelection: "mail-ops-review",
      activeChat: "chat-core",
      query: "",
    },
    profile: {
      initials: "HM",
      name: "Хамид Мусаев",
      role: "Личный операционный контур",
      workspace: "Orbit24 Personal",
      tag: "CRM, документы, Telegram, AI и рабочая память в одном пространстве.",
    },
    metrics: {
      focusHours: 23,
      openTasks: 8,
      activeDeals: 6,
      scheduledEvents: 5,
      responseRate: 92,
      automations: 7,
      revenue: 312000,
      pipeline: 740000,
      inbox: 9,
    },
    feed: [
      {
        id: "feed-1",
        title: "Собран личный operating cadence на неделю",
        body:
          "Утренний обзор перенесён на 09:30, а вечерний close loop теперь идёт через короткий шаблон: задачи, клиенты, learning, next step.",
        author: "Orbit AI",
        createdAt: "Сегодня, 10:15",
        tag: "ритуалы",
      },
      {
        id: "feed-2",
        title: "Обновлена структура личной CRM",
        body:
          "Лиды разделены на входящие, активные и партнёрские. Для каждого контакта теперь хранится ближайший follow-up и конкретный следующий шаг.",
        author: "Хамид",
        createdAt: "Сегодня, 08:50",
        tag: "crm",
      },
      {
        id: "feed-3",
        title: "Пересобран слой автоматизаций",
        body:
          "Добавлены напоминания по дедлайнам, weekly digest и единый intake для новых идей, чтобы не распыляться на ручной контроль.",
        author: "Orbit AI",
        createdAt: "Вчера, 19:05",
        tag: "automation",
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Внедрении ии в тг канал",
        description: "Подключение канала и выпуск в рабочий контур.",
        status: "active",
        priority: "today",
        deadline: "10 апреля, 19:00",
        activity: "6 апреля, 09:24",
        assignee: "Кирилл Морев",
        creator: "Кирилл Морев",
        project: "Внутрянка Консалт",
        projectType: "group",
        tags: "tg, ai",
        bucket: "week",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 6,
        doneDay: 10,
        comments: 1,
      },
      {
        id: "task-2",
        title: "Перенос рег ру личного, на консалт комьюнити",
        description: "Перевод домена и привязка к новому рабочему пространству.",
        status: "backlog",
        priority: "overdue",
        deadline: "- 1 месяц",
        activity: "20 февраля, 21:50",
        assignee: "Хамид Мусаев",
        creator: "Кирилл Морев",
        project: "Внутрянка Консалт",
        projectType: "group",
        tags: "domain",
        bucket: "overdue",
        planBucket: "unscheduled",
        startDay: 1,
        endDay: 6,
        doneDay: 10,
        comments: 1,
      },
    ],
    deals: [
      {
        id: "deal-1",
        title: "Консалтинг по внедрению",
        company: "Nova Systems",
        stage: "lead",
        amount: 180000,
        nextStep: "Созвон и уточнение объёма",
      },
      {
        id: "deal-2",
        title: "AI-пакет для команды продаж",
        company: "Aster Lab",
        stage: "proposal",
        amount: 320000,
        nextStep: "Отправить пакет и demo flow",
      },
      {
        id: "deal-3",
        title: "Поддержка и контентный контур",
        company: "North Hall",
        stage: "won",
        amount: 240000,
        nextStep: "Запуск onboard-плана",
      },
      {
        id: "deal-4",
        title: "Аудит внутренних процессов",
        company: "Bright Tower",
        stage: "proposal",
        amount: 145000,
        nextStep: "Закрыть возражения по срокам",
      },
    ],
    events: [
      {
        id: "event-1",
        title: "Weekly operating review",
        date: "04 апр",
        time: "09:30",
        type: "meeting",
      },
      {
        id: "event-2",
        title: "Фокус-блок: CRM cleanup",
        date: "04 апр",
        time: "13:00",
        type: "deadline",
      },
      {
        id: "event-3",
        title: "Созвон с Nova Systems",
        date: "05 апр",
        time: "11:00",
        type: "meeting",
      },
      {
        id: "event-4",
        title: "Personal learning sprint",
        date: "06 апр",
        time: "18:30",
        type: "note",
      },
    ],
    mail: [
      {
        id: "mail-ops-review",
        from: "Orbit AI",
        subject: "Короткий обзор по неделе и следующему спринту",
        preview:
          "Собрал в одном письме: риски, стоп-факторы, сделки, проседающие задачи и то, где лучше держать фокус ближайшие три дня.",
        body:
          "Фокус недели лучше держать на трёх направлениях: 1) вычистить CRM и закрепить следующий шаг по каждой активной сделке; 2) довести workspace home до состояния ежедневного operating center; 3) разгрузить backlog через пакет быстрых решений. Сильнее всего тормозит отсутствие жёсткого triage по входящим.",
        receivedAt: "Сегодня, 09:12",
        unread: true,
      },
      {
        id: "mail-client-demo",
        from: "Nova Systems",
        subject: "Готовы посмотреть demo и получить ориентир по срокам",
        preview:
          "Подтверждаем интерес к пилоту, нужна короткая демонстрация и понимание очередности этапов.",
        body:
          "Добрый день. Посмотрели ваши материалы и готовы на короткую демонстрацию. Особенно интересует, как вы организуете CRM-воронку и AI-сценарии внутри одного пространства. Удобно ли обсудить это 5 апреля?",
        receivedAt: "Вчера, 17:42",
        unread: false,
      },
      {
        id: "mail-content-loop",
        from: "Личный intake",
        subject: "Идея: weekly digest для Telegram + MCP log",
        preview:
          "Чтобы не терять контекст между устройствами, можно делать короткую сводку в Telegram и дублировать trace в MCP-контур.",
        body:
          "Предлагаю собрать weekly digest так, чтобы он жил в двух плоскостях: 1) лаконичное текстовое summary в Telegram; 2) нормализованный лог в MCP-подключении. Тогда любой агент сможет быстро поднять контекст без погружения в весь поток сообщений.",
        receivedAt: "Вчера, 14:08",
        unread: true,
      },
    ],
    docs: {
      documents: [
        {
          id: "doc-1",
          title: "Operating system для личного workspace",
          summary: "Правила обзоров, ритуалов, задач и контроля входящих.",
          meta: "Обновлено сегодня",
        },
        {
          id: "doc-2",
          title: "Пакет AI-агентов и MCP-подключений",
          summary: "Карта скиллов, безопасных действий и доступов.",
          meta: "Версия 2.1",
        },
        {
          id: "doc-3",
          title: "Шаблоны коммерческих предложений",
          summary: "Короткие пакеты под аудит, внедрение и сопровождение.",
          meta: "3 шаблона",
        },
      ],
      boards: [
        {
          id: "board-1",
          title: "Product ideas",
          summary: "Наброски по новым сервисам и AI-пакетам.",
          meta: "12 карточек",
        },
        {
          id: "board-2",
          title: "Content engine",
          summary: "Темы, серии постов и доп. материалы для экспертизы.",
          meta: "8 карточек",
        },
        {
          id: "board-3",
          title: "Client journeys",
          summary: "Сценарии onboarding, удержания и апсейла.",
          meta: "5 маршрутов",
        },
      ],
      files: [
        {
          id: "file-1",
          title: "contracts/",
          summary: "Договоры, приложения, акты и шаблоны условий.",
          meta: "18 файлов",
        },
        {
          id: "file-2",
          title: "knowledge/",
          summary: "Конспекты, заметки, playbooks и архив решений.",
          meta: "42 файла",
        },
        {
          id: "file-3",
          title: "delivery/",
          summary: "Пакеты для клиентов, презентации и handoff-материалы.",
          meta: "27 файлов",
        },
      ],
    },
    groups: [
      {
        id: "group-1",
        title: "Core delivery",
        summary: "Внутренний контур для рабочих процессов, шаблонов и задач.",
        members: 4,
      },
      {
        id: "group-2",
        title: "Growth lab",
        summary: "Эксперименты по маркетингу, упаковке и продуктовым идеям.",
        members: 3,
      },
      {
        id: "group-3",
        title: "AI systems",
        summary: "Связка агентов, MCP и приватной базы знаний.",
        members: 2,
      },
    ],
    people: [
      {
        id: "person-1",
        name: "Хамид Мусаев",
        role: "Младший специалист",
        state: "Онлайн",
        focus: "CRM + AI контур",
      },
      {
        id: "person-2",
        name: "Orbit AI",
        role: "AI-координатор",
        state: "Готов",
        focus: "Сводки, планирование, follow-up",
      },
      {
        id: "person-3",
        name: "Nova Systems",
        role: "Клиентский контакт",
        state: "Ждёт ответа",
        focus: "Demo и scope",
      },
    ],
    automations: [
      {
        id: "auto-1",
        title: "Daily focus digest",
        description: "Собирает задачи, письма и ближайшие встречи в утреннюю сводку.",
        status: "active",
      },
      {
        id: "auto-2",
        title: "Pipeline nudge",
        description: "Напоминает, если у активной сделки нет следующего шага дольше 48 часов.",
        status: "active",
      },
      {
        id: "auto-3",
        title: "Archive sweep",
        description: "Раз в неделю чистит старые заметки и переносит в knowledge bucket.",
        status: "review",
      },
    ],
    integrations: [
      {
        id: "int-1",
        title: "Telegram bridge",
        description: "Уведомления, ручные команды и экспресс-сводки в одном канале.",
        state: "Подключен",
      },
      {
        id: "int-2",
        title: "MCP server",
        description: "Личный контур доступа к документам, агентам и рабочим протоколам.",
        state: "Активен",
      },
      {
        id: "int-3",
        title: "Dev sandbox",
        description: "Стенд для проверки сценариев и локальных сборок.",
        state: "Готов",
      },
    ],
    chats: [
      {
        id: "chat-core",
        title: "Личное ядро",
        tab: "chat",
        counterpart: "Orbit AI",
        snippet: "Сделал проектный слой для Bitrix-подобного workspace без внешних зависимостей.",
        unread: 2,
        updatedAt: "Сейчас",
        focus: "Решения дня",
        checklist: [
          "Зафиксировать структуру меню",
          "Собрать локальные формы",
          "Запустить и проверить статическую сборку",
        ],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Я уже вытащил реальную навигацию из live-портала: Мессенджер, Лента, Коллабы, Календарь, Документы, Доски, Диск, Почта, Группы, Задачи, CRM, Маркетинг, BI, Сотрудники, Автоматизация и блок приложений.",
            time: "11:24",
          },
          {
            author: "Хамид",
            mine: true,
            text:
              "Нужно, чтобы этот клон был не только похожим, но и полезным для личного ежедневного использования.",
            time: "11:26",
          },
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Поэтому я сделал акцент на localStorage, быстрых формах и простых страницах для задач, CRM, календаря, почты и автоматизаций.",
            time: "11:28",
          },
        ],
      },
      {
        id: "chat-tasks",
        title: "Task sync",
        tab: "task",
        counterpart: "Core delivery",
        snippet: "Нужно закрыть CRM cleanup и пакет по новой услуге.",
        unread: 1,
        updatedAt: "10 мин назад",
        focus: "Исполнительский контур",
        checklist: [
          "Разобрать backlog",
          "Сверить дедлайны",
          "Собрать короткий end-of-day",
        ],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Самый тяжёлый кусок сегодня: вычистить старые стадии в CRM и сразу назначить следующий шаг по каждой активной сделке.",
            time: "10:46",
          },
        ],
      },
      {
        id: "chat-copilot",
        title: "Orbit AI Studio",
        tab: "copilot",
        counterpart: "Orbit AI",
        snippet: "Могу собрать сводку, ответить на письмо или помочь с контентом.",
        unread: 0,
        updatedAt: "15 мин назад",
        focus: "AI слой",
        checklist: [
          "Подготовить weekly digest",
          "Развернуть шаблон предложения",
          "Обновить knowledge map",
        ],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Я могу работать как личный стратег, редактор или оператор follow-up. Выбери режим и сужу контекст под задачу.",
            time: "10:40",
          },
        ],
      },
      {
        id: "chat-collab",
        title: "Growth lab sprint",
        tab: "collab",
        counterpart: "Growth lab",
        snippet: "Нужно согласовать три гипотезы на следующий спринт.",
        unread: 0,
        updatedAt: "Вчера",
        focus: "Короткий спринт",
        checklist: [
          "Проверить гипотезы",
          "Собрать owner и deadline",
          "Утвердить формат эксперимента",
        ],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Для collab-режима удобнее держать отдельные карточки решений и быстрые summary после каждого sync.",
            time: "Вчера, 18:02",
          },
        ],
      },
      {
        id: "chat-channel",
        title: "Signal channel",
        tab: "channel",
        counterpart: "Signals",
        snippet: "Дневные сигналы по продажам, нагрузке и ответам.",
        unread: 0,
        updatedAt: "Вчера",
        focus: "Сигналы",
        checklist: [
          "Revenue delta",
          "Inbox pressure",
          "Overdue tasks",
        ],
        messages: [
          {
            author: "Orbit AI",
            mine: false,
            text:
              "Сегодня response rate выше 90%, но перегруз идёт из-за отсутствия жёсткого triage по письмам.",
            time: "Вчера, 16:11",
          },
        ],
      },
      {
        id: "chat-notification",
        title: "Уведомления",
        tab: "notification",
        counterpart: "System",
        snippet: "3 напоминания по дедлайнам и 2 новых письма.",
        unread: 3,
        updatedAt: "Сейчас",
        focus: "Алерты",
        checklist: [
          "Nova Systems",
          "CRM cleanup",
          "Weekly digest",
        ],
        messages: [
          {
            author: "System",
            mine: false,
            text:
              "Сделка Nova Systems ждёт следующего шага. Дедлайн по CRM cleanup — завтра. Во входящих появилось два новых письма.",
            time: "11:30",
          },
        ],
      },
      {
        id: "chat-calls",
        title: "Call center",
        tab: "call",
        counterpart: "Voice desk",
        snippet: "Созвон с Nova Systems завтра в 11:00.",
        unread: 0,
        updatedAt: "Сегодня",
        focus: "Созвоны",
        checklist: [
          "Подготовить вопросы",
          "Показать demo flow",
          "Зафиксировать scope",
        ],
        messages: [
          {
            author: "Voice desk",
            mine: false,
            text:
              "Напомнить за 30 минут до созвона, подготовить deck и заметки по текущей воронке.",
            time: "Сегодня, 08:12",
          },
        ],
      },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function commit(mutator) {
  mutator(state);
  saveState();
  render();
}

function getRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (raw && ROUTE_META[raw]) {
    return raw;
  }

  return "messenger";
}

function navigate(route) {
  window.location.hash = `#/${route}`;
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
    case "crm":
      return state.deals.length;
    case "automation":
      return state.automations.filter((item) => item.status !== "done").length;
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
  return ROUTE_META[route].chatTab || "chat";
}

function activeDocsView(route) {
  return ROUTE_META[route].docsView || "documents";
}

function getChatsForRoute(route) {
  const tab = activeChatTab(route);
  const search = state.ui.query.trim().toLowerCase();

  return state.chats.filter((chat) => {
    const matchesTab =
      tab === "chat"
        ? chat.tab === "chat" || chat.tab === "task" || chat.tab === "copilot" || chat.tab === "notification" || chat.tab === "call" || chat.tab === "channel"
        : chat.tab === tab;
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
      <div class="sidebar-brand">
        <div class="brand-mark">O24</div>
        <div class="brand-copy">
          <p class="eyebrow">Personal Cloud</p>
          <h1 class="brand-title">Orbit24</h1>
          <p class="brand-subtitle">${escapeHtml(state.profile.tag)}</p>
        </div>
      </div>

      <section class="spotlight-card">
        <h2>Рабочие направления</h2>
        <p>
          Консалтинг, CRM, документы, Telegram, AI-помощники и автоматизация
          собраны в одном ежедневном контуре.
        </p>
      </section>

      <nav class="sidebar-nav" aria-label="Основная навигация">
        ${MENU.map((section) => {
          const isOpen = state.ui.groups[section.id] !== false;
          const sectionItems = section.items
            .map((item) => {
              const active = route === item.route;
              const count = getMenuCount(item.route);
              return `
                <button
                  class="nav-item ${active ? "is-active" : ""}"
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
            <section class="nav-section">
              <p class="nav-section-title">${escapeHtml(section.title)}</p>
              <div class="nav-group ${isOpen ? "" : "is-collapsed"}">
                <button class="nav-group-toggle" data-action="toggle-group" data-group="${section.id}">
                  <span class="nav-group-label">
                    ${renderIconBadge(section.title.slice(0, 2))}
                    <span>${escapeHtml(section.title)}</span>
                  </span>
                  <span class="group-arrow">⌄</span>
                </button>
                <div class="nav-group-items">${sectionItems}</div>
              </div>
            </section>
          `;
        }).join("")}
      </nav>

      <div class="sidebar-footer">
        <div class="footer-stat">
          <span>Фокус-часов</span>
          <strong>${state.metrics.focusHours}</strong>
        </div>
        <div class="footer-stat">
          <span>Сделок в работе</span>
          <strong>${state.deals.filter((deal) => deal.stage !== "won").length}</strong>
        </div>
      </div>
    </aside>
  `;
}

function renderTopbar(route) {
  const meta = ROUTE_META[route];
  const section = getMenuSection(route);
  const primaryAction = getPrimaryAction(route);
  const actionAttrs = [
    `data-action="${primaryAction.action}"`,
    primaryAction.selector ? `data-selector="${primaryAction.selector}"` : "",
    primaryAction.target ? `data-target="${primaryAction.target}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <header class="topbar fade-in">
      <div class="topbar-service">
        <button class="mobile-toggle" data-action="toggle-sidebar" aria-label="Открыть меню">
          ☰
        </button>
        <div class="service-brand">
          <div class="service-brand-mark">O24</div>
          <div class="service-brand-copy">
            <strong>Orbit24</strong>
            <span>${escapeHtml(state.profile.workspace)}</span>
          </div>
        </div>
        <nav class="service-nav" aria-label="Горизонтальная навигация">
          ${section.items
            .map((item) => {
              const active = route === item.route;
              return `
                <button
                  class="service-nav-button ${active ? "is-active" : ""}"
                  data-action="navigate"
                  data-route="${item.route}"
                >
                  ${escapeHtml(item.label)}
                </button>
              `;
            })
            .join("")}
        </nav>
        <div class="service-actions">
          <button
            class="utility-button"
            data-action="route-create"
            data-target="person"
            data-route="company"
          >
            Пригласить
          </button>
          <button class="utility-button" data-action="navigate" data-route="market">
            Мой тариф
          </button>
          <button class="utility-button" data-action="open-assistant">
            Помощь
          </button>
          <div class="service-time">17:00</div>
          <div class="avatar">${escapeHtml(state.profile.initials)}</div>
        </div>
      </div>
      <div class="topbar-page">
        <div class="topbar-copy">
          <p class="eyebrow">${escapeHtml(state.profile.workspace)}</p>
          <h2 class="topbar-title">${escapeHtml(meta.title)}</h2>
          <p class="topbar-description">${escapeHtml(meta.description)}</p>
        </div>
        <div class="page-toolbar">
          <button class="primary-button" ${actionAttrs}>
            + ${escapeHtml(primaryAction.label)}
          </button>
          <label class="search-shell">
            <span class="search-label">поиск</span>
            <input
              type="search"
              value="${escapeHtml(state.ui.query)}"
              placeholder="${escapeHtml(getSearchPlaceholder(route))}"
              data-action="search"
            />
          </label>
          <button class="ghost-button" data-action="quick-capture">Быстрая заметка</button>
        </div>
        <div class="toolbar-pills">
          ${getHeaderPills(route)
            .map(
              (item) => `
                <span class="toolbar-pill">
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.value)}</strong>
                </span>
              `,
            )
            .join("")}
        </div>
      </div>
    </header>
  `;
}

function renderHero(route) {
  const meta = ROUTE_META[route];

  return `
    <section class="surface-strip fade-in">
      <article class="surface-banner">
        <p class="eyebrow">Операционный центр</p>
        <h3>${escapeHtml(meta.title)}</h3>
        <p>${escapeHtml(meta.description)}</p>
        <div class="chip-row">
          <span class="chip">Консалтинг</span>
          <span class="chip">CRM</span>
          <span class="chip">Telegram</span>
          <span class="chip">AI</span>
          <span class="chip">Supabase-ready</span>
        </div>
      </article>
      <article class="surface-metric">
        <span>Открытых задач</span>
        <strong>${state.tasks.filter((task) => task.status !== "done").length}</strong>
        <p>Живой объем на текущий цикл.</p>
      </article>
      <article class="surface-metric">
        <span>Сделки в работе</span>
        <strong>${state.deals.filter((deal) => deal.stage !== "won").length}</strong>
        <p>Клиентский контур и следующий шаг.</p>
      </article>
      <article class="surface-metric">
        <span>Входящие</span>
        <strong>${state.mail.filter((item) => item.unread).length + getMenuCount("messenger")}</strong>
        <p>Письма, чаты и рабочие сигналы.</p>
      </article>
      <article class="surface-metric">
        <span>Память проекта</span>
        <button class="quiet-button" data-action="open-path" data-path="./PROJECT_MEMORY.md">
          Открыть
        </button>
        <p>Контекст, артефакты и статус разработки.</p>
      </article>
    </section>
  `;
}

function renderMessenger(route) {
  const chats = getChatsForRoute(route);
  const current = getCurrentChat(route);
  const activeTab = activeChatTab(route);

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Диалоги и рабочие каналы</h2>
          <p>Чаты, задачи, AI, коллабы, каналы и уведомления под рукой.</p>
        </div>
      </div>
      <div class="tab-row">
        ${CHAT_TABS.map((tab) => {
          const count = state.chats
            .filter((chat) => chat.tab === tab.id)
            .reduce((sum, chat) => sum + chat.unread, 0);

          return `
            <button
              class="tab-chip ${activeTab === tab.id ? "is-active" : ""}"
              data-action="navigate"
              data-route="${tab.route}"
              ${tab.route === "messenger" ? `data-chat-tab="${tab.id}"` : ""}
            >
              <span class="nav-item-label">
                ${renderIconBadge(tab.badge)}
                <span>${escapeHtml(tab.label)}</span>
              </span>
              ${count ? `<span class="tab-counter">${count}</span>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    </section>

    <section class="messenger-shell fade-in">
      <div class="panel scroll-area">
        <div class="panel-head">
          <div>
            <h3>Потоки</h3>
            <p>${chats.length ? `Найдено ${chats.length}` : "Потоков не найдено"}</p>
          </div>
        </div>
        <div class="list">
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
                      <div class="thread-title">
                        <strong>${escapeHtml(chat.title)}</strong>
                        ${chat.unread ? `<span class="pill-counter">${chat.unread}</span>` : ""}
                      </div>
                      <div class="thread-snippet">${escapeHtml(chat.snippet)}</div>
                      <div class="thread-meta">
                        <span>${escapeHtml(chat.counterpart)}</span>
                        <span>${escapeHtml(chat.updatedAt)}</span>
                      </div>
                    </button>
                  `;
                })
                .join("")
            : `<div class="empty-state">По текущему поиску ничего не найдено.</div>`}
        </div>
      </div>

      <section class="message-pane">
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
            : `<div class="empty-state">Выбери поток слева, чтобы увидеть переписку.</div>`
        }
      </section>

      <aside class="inspector-pane">
        ${
          current
            ? `
              <div class="inspector-head">
                <h3>Контекст</h3>
                <p>${escapeHtml(current.counterpart)}</p>
              </div>
              <div class="inspector-body">
                <section class="inspector-card">
                  <h4>Чек-лист</h4>
                  <ul>
                    ${current.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                  </ul>
                </section>
                <section class="inspector-card">
                  <h4>Подсказка</h4>
                  <p class="muted">
                    В личной версии этот блок удобно использовать как mini-brief:
                    цель диалога, следующий шаг и короткий summary после каждого созвона.
                  </p>
                </section>
                <section class="inspector-card">
                  <h4>Быстрые действия</h4>
                  <div class="label-row">
                    <span class="small-tag">создать задачу</span>
                    <span class="small-tag">зафиксировать summary</span>
                    <span class="small-tag">добавить в CRM</span>
                  </div>
                </section>
              </div>
            `
            : ""
        }
      </aside>
    </section>
  `;
}

function renderQuickRail(route) {
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
              <option value="crm">crm</option>
              <option value="контент">контент</option>
              <option value="автоматизация">автоматизация</option>
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
              <footer>
                <span>${escapeHtml(post.author)}</span>
                <span>${escapeHtml(post.createdAt)}</span>
              </footer>
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
            </div>
            <div class="mini-card">
              <h4>Лучшее решение</h4>
              <p>Выносить итог созвона сразу в ленту и параллельно создавать задачу.</p>
            </div>
            <div class="mini-card">
              <h4>Следующий апгрейд</h4>
              <p>Связать ленту с Telegram-дайджестом и MCP-логом.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderCalendar() {
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
  const records = state.docs[view];
  const launchers = [
    { label: "Документ", target: "document", meta: "DOC" },
    { label: "Таблица", target: "document", meta: "XLS" },
    { label: "Презентация", target: "document", meta: "PPT" },
    { label: "Доска", target: "board", meta: "BOARD", route: "boards" },
    { label: "Загрузка", target: "file", meta: "UP", route: "drive" },
    { label: "Подключение", target: "integration", meta: "MCP", route: "mcp" },
  ];

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Документный контур</h2>
          <p>Три близких режима: знания, визуальные доски и файловое хранилище.</p>
        </div>
      </div>
      <div class="tab-row">
        ${DOC_VIEWS.map((item) => {
          const active = view === item.id;
          const count = state.docs[item.id].length;
          return `
            <button
              class="tab-chip ${active ? "is-active" : ""}"
              data-action="navigate"
              data-route="${item.route}"
            >
              <span class="nav-item-label">
                ${renderIconBadge(item.badge)}
                <span>${escapeHtml(item.label)}</span>
              </span>
              <span class="tab-counter">${count}</span>
            </button>
          `;
        }).join("")}
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

    <section class="panel fade-in sheet-panel">
      <div class="sheet-table">
        <div class="sheet-row is-head">
          <span>Название</span>
          <span>Описание</span>
          <span>Статус</span>
        </div>
        ${records
          .map(
            (item) => `
              <article class="sheet-row">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.summary)}</span>
                <span class="small-tag">${escapeHtml(item.meta)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
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
          <button class="ghost-button" data-action="navigate" data-route="crm">Добавить в CRM</button>
          <button class="primary-button" data-action="navigate" data-route="tasks">Сделать задачей</button>
        </div>
      </article>
    </section>
  `;
}

function renderGroups() {
  return `
    <section class="group-grid fade-in">
      ${state.groups
        .map(
          (group) => `
          <article class="group-card">
            <h4>${escapeHtml(group.title)}</h4>
            <p>${escapeHtml(group.summary)}</p>
            <footer>
              <span>${group.members} участника</span>
              <span class="small-tag">space</span>
            </footer>
          </article>
        `,
        )
        .join("")}
    </section>
  `;
}

function renderTasks() {
  const activeTaskView = state.ui.activeTaskView || "list";
  const taskTabs = [
    { id: "list", label: "Список" },
    { id: "deadlines", label: "Сроки" },
    { id: "plan", label: "Мой план" },
    { id: "calendar", label: "Календарь" },
    { id: "gantt", label: "Гант" },
  ];
  const signalTabs = [
    { label: "Чаты задач", tone: "green", value: 1 },
    { label: "Просрочены", tone: "orange", value: 1 },
    { label: "Комментарии", tone: "green", value: 1 },
    { label: "Прочитать все", tone: "plain", value: null },
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
        <span class="task-count-badge ${escapeHtml(task.priority)}">${escapeHtml(String(task.comments || 1))}</span>
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
            ${state.tasks
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
          <div>ОТМЕЧЕНО: 0 / ${state.tasks.length}</div>
          <div>ВСЕГО: <span>ПОКАЗАТЬ КОЛИЧЕСТВО</span></div>
          <div>СТРАНИЦЫ: 1</div>
          <div class="task-footer-right">НА СТРАНИЦЕ: <strong>50</strong></div>
        </div>
        <div class="task-table-actions">
          <button class="task-muted-button">ВЫБЕРИТЕ ДЕЙСТВИЕ</button>
          <button class="task-primary-button">ПРИМЕНИТЬ</button>
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
            const tasks = state.tasks.filter((task) => task.bucket === column.id);
            return `
              <div class="task-deadline-column">
                <div class="task-column-head ${escapeHtml(column.tone)}">
                  <strong>${escapeHtml(column.label)}</strong>
                  <span>(${tasks.length})</span>
                </div>
                <div class="task-column-plus">+</div>
                <div class="task-column-stack">
                  ${tasks.map(renderTaskMiniCard).join("")}
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
            const tasks = state.tasks.filter((task) => task.planBucket === column.id);
            return `
              <div class="task-plan-column">
                <div class="task-column-head ${escapeHtml(column.tone)}">
                  <strong>${escapeHtml(column.label)}</strong>
                  <span>(${tasks.length})</span>
                </div>
                <div class="task-column-plus">+</div>
                ${column.id === "doneweek" ? '<div class="task-fast-add">✚ Быстрая задача</div>' : ""}
                <div class="task-column-stack">
                  ${tasks.map(renderTaskMiniCard).join("")}
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
          ${state.tasks
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
            ${state.tasks
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
      <div class="task-toolbar-top">
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
          <button class="task-toolbar-button">Обратная связь</button>
          <button class="task-toolbar-button">🔒 Роботы</button>
          <button class="task-toolbar-button">Маркетплейс ▾</button>
        </div>
      </div>
      <div class="task-signal-tabs">
        ${signalTabs
          .map(
            (tab) => `
              <button class="task-signal-tab ${tab.tone}">${tab.value !== null ? `<span>${tab.value}</span>` : ""}${tab.label}</button>
            `,
          )
          .join("")}
      </div>
      ${views[activeTaskView] ? views[activeTaskView]() : renderListView()}
    </section>
  `;
}

function renderCrm() {
  const columns = [
    { id: "lead", label: "Lead" },
    { id: "proposal", label: "Proposal" },
    { id: "won", label: "Won" },
  ];

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>Новая сделка</h2>
          <p>Лёгкий CRM-контур, когда нужен контроль по клиентам без отдельной тяжёлой системы.</p>
        </div>
      </div>
      <form class="composer-card" data-form="add-deal">
        <div class="form-grid">
          <div class="field-row">
            <div class="field">
              <label for="dealTitle">Сделка</label>
              <input id="dealTitle" name="title" placeholder="Например: аудит процессов" />
            </div>
            <div class="field">
              <label for="dealCompany">Компания</label>
              <input id="dealCompany" name="company" placeholder="Кто клиент?" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="dealAmount">Сумма</label>
              <input id="dealAmount" name="amount" placeholder="150000" />
            </div>
            <div class="field">
              <label for="dealStage">Стадия</label>
              <select id="dealStage" name="stage">
                <option value="lead">lead</option>
                <option value="proposal">proposal</option>
                <option value="won">won</option>
              </select>
            </div>
            <div class="field">
              <label for="dealNextStep">Следующий шаг</label>
              <input id="dealNextStep" name="nextStep" placeholder="Demo, предложение, созвон" />
            </div>
          </div>
          <button type="submit" class="primary-button">Добавить в pipeline</button>
        </div>
      </form>
    </section>

    <section class="deal-grid fade-in">
      ${columns
        .map((column) => {
          const items = state.deals.filter((deal) => deal.stage === column.id);
          const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
          return `
            <div class="deal-column">
              <div class="deal-column-head">
                <h4>${escapeHtml(column.label)}</h4>
                <span class="pill-counter">${items.length}</span>
              </div>
              <div class="column-meta">${formatMoney(total)}</div>
              ${items
                .map(
                  (deal) => `
                  <article class="deal-card">
                    <h4>${escapeHtml(deal.title)}</h4>
                    <p>${escapeHtml(deal.company)}</p>
                    <div class="label-row">
                      <span class="status-pill ${escapeHtml(deal.stage)}">${escapeHtml(deal.stage)}</span>
                      <span class="small-tag">${formatMoney(deal.amount)}</span>
                    </div>
                    <p>${escapeHtml(deal.nextStep)}</p>
                  </article>
                `,
                )
                .join("")}
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderMarketing() {
  return `
    <section class="cards-grid fade-in">
      <article class="data-card">
        <label>Запуск недели</label>
        <strong>Telegram digest</strong>
        <p>Первая короткая версия личного weekly digest для клиентов и для себя.</p>
      </article>
      <article class="data-card">
        <label>Эксперимент</label>
        <strong>AI follow-up</strong>
        <p>Проверка шаблона ответов после созвонов и входящих писем.</p>
      </article>
      <article class="data-card">
        <label>Контентный фокус</label>
        <strong>3 темы</strong>
        <p>AI workflow, личный workspace и операционный консалтинг.</p>
      </article>
    </section>
  `;
}

function renderBi() {
  const bars = [
    { label: "Фокус-ритм", value: 78 },
    { label: "Скорость follow-up", value: 92 },
    { label: "Чистота backlog", value: 64 },
    { label: "Контроль pipeline", value: 81 },
  ];

  return `
    <section class="bi-grid fade-in">
      <article class="panel">
        <div class="page-head">
          <div>
            <h2>Ключевые метрики</h2>
            <p>Здесь лучше смотреть на управленческие сигналы, а не на шум ради дашборда.</p>
          </div>
        </div>
        <div class="stat-grid">
          <div class="data-card">
            <label>Выручка в работе</label>
            <strong>${formatMoney(state.metrics.revenue)}</strong>
            <p>Подтверждённый контур по выигранным сделкам и активной доставке.</p>
          </div>
          <div class="data-card">
            <label>Pipeline</label>
            <strong>${formatMoney(state.metrics.pipeline)}</strong>
            <p>Потенциал активных сделок без учёта холодных лидов.</p>
          </div>
          <div class="data-card">
            <label>Открытых задач</label>
            <strong>${state.tasks.filter((task) => task.status !== "done").length}</strong>
            <p>Живой личный объём, который реально нужно довести.</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="page-head">
          <div>
            <h2>Операционные сигналы</h2>
            <p>Небольшой BI-блок вместо тяжёлого визуального конструктора.</p>
          </div>
        </div>
        <div class="bi-chart">
          ${bars
            .map(
              (bar) => `
              <div class="bar-row">
                <header>
                  <span>${escapeHtml(bar.label)}</span>
                  <strong>${bar.value}%</strong>
                </header>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${bar.value}%"></div>
                </div>
              </div>
            `,
            )
            .join("")}
        </div>
      </article>
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
          </article>
        `,
        )
        .join("")}
    </section>
  `;
}

function renderAutomation() {
  return `
    <section class="automation-grid fade-in">
      ${state.automations
        .map(
          (item) => `
          <article class="automation-card">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
            <div class="label-row">
              <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
            </div>
          </article>
        `,
        )
        .join("")}
    </section>
  `;
}

function renderIntegrations(route, title, copy) {
  if (route === "mcp") {
    return `
      <section class="panel fade-in sheet-panel">
        <div class="page-head">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(copy)}</p>
          </div>
        </div>
        <div class="sheet-table">
          <div class="sheet-row is-head">
            <span>Название сервиса</span>
            <span>Описание</span>
            <span>Статус</span>
          </div>
          ${state.integrations
            .map(
              (item) => `
                <article class="sheet-row">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.description)}</span>
                  <span class="small-tag">${escapeHtml(item.state)}</span>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="panel fade-in">
      <div class="page-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(copy)}</p>
        </div>
      </div>
      <div class="integration-grid">
        ${state.integrations
          .map(
            (item) => `
            <article class="integration-card">
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.description)}</p>
              <div class="label-row">
                <span class="small-tag">${escapeHtml(item.state)}</span>
              </div>
            </article>
          `,
          )
          .join("")}
      </div>
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
    case "crm":
      return renderCrm();
    case "marketing":
      return renderMarketing();
    case "bi":
      return renderBi();
    case "company":
      return renderCompany();
    case "automation":
      return renderAutomation();
    case "market":
      return renderIntegrations(
        "market",
        "Маркетплейс и расширения",
        "Каталог подключений и AI-инструментов, которые можно держать в личном стеке.",
      );
    case "devops":
      return renderIntegrations(
        "devops",
        "Разработчикам",
        "Если workspace нужен для кода, здесь удобно собрать пайплайны, репозитории и стенды.",
      );
    case "mcp":
      return renderIntegrations(
        "mcp",
        "MCP-подключения",
        "Слой для связки агентов, инструментов и приватных контекстных источников.",
      );
    case "telegram":
      return renderIntegrations(
        "telegram",
        "Безлимитный Telegram",
        "Личный коммуникационный мост для оповещений, summary и ручных команд.",
      );
    default:
      return "";
  }
}

function renderWorkspace(route) {
  return `
    <main class="workspace">
      ${renderHero(route)}
      <section class="workspace-body">
        ${renderDashboard(route)}
      </section>
    </main>
  `;
}

function render() {
  const route = getRoute();
  const root = document.getElementById("app");
  const body = document.body;
  body.classList.toggle("sidebar-open", Boolean(state.ui.sidebarOpen));

  root.innerHTML = `
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

function createRouteRecord(draft, target) {
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
      draft.groups.unshift({
        id: createId("group"),
        title: "Новая группа",
        summary: "Рабочее пространство для отдельной инициативы или клиентского контура.",
        members: 1,
      });
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
    case "automation":
      draft.automations.unshift({
        id: createId("auto"),
        title: "Новое правило",
        description: "Черновик автоматизации. На следующем шаге сюда можно привязать backend-логику и внешние события.",
        status: "review",
      });
      draft.metrics.automations = draft.automations.length;
      break;
    case "app":
      draft.integrations.unshift({
        id: createId("int"),
        title: "Новое приложение",
        description: "Черновик установки из внутреннего каталога приложений.",
        state: "Черновик",
      });
      break;
    case "repo":
      draft.integrations.unshift({
        id: createId("int"),
        title: "Новый репозиторий",
        description: "Сервис для разработки, деплоя и рабочих проверок.",
        state: "Подготовка",
      });
      break;
    case "integration":
      draft.integrations.unshift({
        id: createId("int"),
        title: "Новое MCP-подключение",
        description: "Связка с агентом, внешним инструментом или источником знаний.",
        state: "Не подключено",
      });
      break;
    case "telegram":
      draft.integrations.unshift({
        id: createId("int"),
        title: "Telegram-сценарий",
        description: "Новый канал для алертов, дайджестов и управляющих команд.",
        state: "Черновик",
      });
      break;
    default:
      break;
  }
}

function handleClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const action = actionTarget.dataset.action;

  if (action === "navigate") {
    const route = actionTarget.dataset.route;
    if (route) {
      const nextTab = actionTarget.dataset.chatTab;
      if (nextTab) {
        const nextChat = state.chats.find((chat) => chat.tab === nextTab);
        if (nextChat) {
          state.ui.activeChat = nextChat.id;
        }
      }
      state.ui.sidebarOpen = false;
      saveState();
      navigate(route);
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

  if (action === "select-chat") {
    const chatId = actionTarget.dataset.chatId;
    commit((draft) => {
      draft.ui.activeChat = chatId;
      const targetChat = draft.chats.find((chat) => chat.id === chatId);
      if (targetChat) {
        targetChat.unread = 0;
      }
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

  if (action === "open-assistant") {
    commit((draft) => {
      const assistantChat = draft.chats.find((chat) => chat.id === "chat-copilot");
      if (assistantChat) {
        draft.ui.activeChat = assistantChat.id;
      }
    });
    navigate("messenger");
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
  const input = event.target.closest('[data-action="search"]');
  if (!input) {
    return;
  }

  state.ui.query = input.value;
  saveState();

  const route = getRoute();
  if (route === "messenger" || route === "collabs") {
    const nextChat = getChatsForRoute(route)[0];
    if (nextChat) {
      state.ui.activeChat = nextChat.id;
      saveState();
    }
  }

  render();
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.form) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(form);

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
      draft.tasks.unshift({
        id: createId("task"),
        title,
        description,
        status: String(formData.get("status") || "backlog"),
        priority: String(formData.get("priority") || "medium"),
        deadline: String(formData.get("deadline") || "без даты"),
        owner: draft.profile.name,
      });
      draft.metrics.openTasks = draft.tasks.filter((task) => task.status !== "done").length;
    });
    return;
  }

  if (form.dataset.form === "add-deal") {
    const title = String(formData.get("title") || "").trim();
    const company = String(formData.get("company") || "").trim();
    if (!title || !company) {
      return;
    }

    commit((draft) => {
      draft.deals.unshift({
        id: createId("deal"),
        title,
        company,
        stage: String(formData.get("stage") || "lead"),
        amount: Number(formData.get("amount") || 0),
        nextStep: String(formData.get("nextStep") || "уточнить следующий шаг"),
      });
      draft.metrics.activeDeals = draft.deals.length;
      draft.metrics.pipeline = draft.deals
        .filter((item) => item.stage !== "won")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      draft.metrics.revenue = draft.deals
        .filter((item) => item.stage === "won")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
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

window.addEventListener("hashchange", render);
document.addEventListener("click", handleClick);
document.addEventListener("input", handleSearch);
document.addEventListener("submit", handleSubmit);

if (!window.location.hash) {
  navigate("messenger");
} else {
  render();
}
