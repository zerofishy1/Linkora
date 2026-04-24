# CLAUDE.md — Linkora

Проектный контекст для Claude Code. Читается автоматически в начале каждой сессии.

## О проекте

**Linkora** — клон Битрикс24 (SaaS для команд): мессенджер, задачи, проекты, календарь, документы, CRM-подобные разделы. Интерфейс на русском.

## Технологический стек

### Frontend (порт 4173)
- **React 19.2** + **Vite 8.0** + **TypeScript 6.0**
- **React Router DOM 7** — маршрутизация
- **TanStack Query** — кеширование/fetch
- **Supabase JS** — scaffold подключён (`src/lib/supabase.ts`)

### Backend (порт 3000)
- **Express 5** + **Prisma 6** ORM
- **Supabase Postgres** (EU West 3, Paris) — активная БД
- **JWT** auth (Bearer token / cookie), **bcryptjs**, **multer** для файлов

### Dev инструменты
- **Playwright** для audit-скриптов
- **Supabase CLI** (`~/.local/bin/supabase`) — управление БД без пароля через PAT

## Структура проекта

```
/Users/hamidmusaev/Documents/Bitrix 2.0/
├── src/
│   ├── legacy/LegacyWorkspace.tsx  # ГЛАВНЫЙ UI (~5800 строк, монолит)
│   ├── app/                         # App.tsx, AuthPage, WorkspaceSelectPage
│   ├── providers/AuthProvider.tsx   # JWT auth, workspace selection
│   ├── services/api.ts              # Типизированный fetch клиент для backend
│   ├── lib/supabase.ts              # Supabase клиент (isSupabaseConfigured)
│   └── features/workspace/          # Конфиг рабочих областей
├── server/
│   ├── src/
│   │   ├── index.ts, app.ts         # Express factory
│   │   ├── routes/                  # 11 доменов API
│   │   ├── middleware/auth.ts       # authRequired, workspaceRequired, requireRole
│   │   └── lib/jwt.ts, prisma.ts
│   └── prisma/
│       ├── schema.prisma            # 17 моделей, provider=postgresql
│       └── seed.ts                  # Тестовые данные
├── styles.css                       # Глобальный CSS (~5900 строк)
└── .claude/                         # launch.json для preview_start("dev")
```

## ⚠️ Критически важно: паттерн LegacyWorkspace.tsx

Это **монолитный компонент в ~5800 строк**, который НЕ использует JSX для рендеринга UI.

```tsx
<div dangerouslySetInnerHTML={{ __html: renderApp(route) }} />
```

### Рендеринг — innerHTML template literals
Вся разметка собирается как строки:
```javascript
function renderMessenger(route) {
  return `
    <section class="task-shell fade-in">
      <button class="bitrix-nav-item" data-action="navigate" data-route="tasks">
        Задачи
      </button>
    </section>
  `;
}
```

### Обработка событий — data-action делегирование
Клики ловятся ОДНИМ обработчиком через `handleClick`, который диспатчит по `dataset.action`:
```javascript
function handleClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  // switch (action) { ... }
}
```

**Чтобы добавить интерактив:**
1. Добавить атрибут `data-action="new-action"` на элемент
2. Добавить case в switch внутри `handleClick` (ищется по ключу `data-action`)

### Состояние — commit(draft => {...})
```javascript
commit((draft) => {
  draft.ui.someField = newValue;
});
```
`commit()` клонирует state, применяет мутацию, сохраняет в localStorage, триггерит React rerender.

### Структура state
```
state = {
  ui: { /* UI preferences */ },
  profile: { /* user info */ },
  tasks: [], chats: [], events: [], feed: [], mail: [],
  docs: { documents: [], boards: [], files: [] },
  groups: [], people: [], metrics: {}
}
```

## Конвенции

### Стиль кода
- **Язык UI** — русский (все строки, ошибки, заголовки)
- **Error messages** в backend — русские: `"Задача не найдена"`, `"Ошибка загрузки"`
- **Именование классов CSS** — BEM-like, префиксы: `bitrix-*` (shell), `task-*` (tasks), `portal-*` (topbar), `gd-*` (groups)
- **Модификаторы состояния**: `.is-active`, `.is-collapsed`, `.fade-in`

### CSS тема
Основные переменные в `:root`:
```css
--bg, --bg-deep              /* фон */
--accent, --accent-strong    /* акцент */
--panel, --panel-border      /* карточки */
--text, --muted, --subtle    /* текст */
--radius-sm/md/lg, --space-xs/sm/md/lg
```

**Правило**: всегда использовать CSS custom properties, никогда хардкодить цвета.

### Backend паттерн (Express + Prisma)
Каждый handler обязан:
```typescript
router.use(authRequired, workspaceRequired);

router.get("/", async (req, res) => {
  try {
    const wsId = (req as any).workspaceId;
    const items = await prisma.task.findMany({
      where: { workspaceId: wsId },     // всегда scope по workspace
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Ошибка загрузки" });
  }
});
```

Для write-операций: `requireRole("admin", "member")`.

## Команды

### Dev
```bash
# Frontend (из корня)
npm run dev               # Vite на 4173 — ИСПОЛЬЗОВАТЬ preview_start("dev") в Claude Code
npm run build             # TypeScript check + Vite build

# Backend (из server/)
cd server
npm run dev               # tsx watch на 3000, подключён к Supabase
npm run db:push           # Prisma schema → Supabase
npm run db:seed           # Тестовые данные
npm run db:studio         # Prisma Studio GUI
```

### Supabase CLI (опционально)
```bash
export SUPABASE_ACCESS_TOKEN='sbp_...'   # PAT из Supabase dashboard
~/.local/bin/supabase db query --linked  # SQL без DB пароля
```

### Тестовый логин
```
email: hamid@consult24.ru
password: admin123
workspace: "Консалт Комьюнити 24"
```

## Git

- **Основная ветка**: `main`
- **Remote**: `git@github.com:zerofishy1/Linkora.git`
- Не пушить напрямую в `main` без явной просьбы — создавать feature-ветки

## Supabase

- Проект: `umurlfxyjvggzlyltdgy` (EU West 3, Paris)
- 20 таблиц в `public` схеме
- `server/.env` содержит `DATABASE_URL` (pooler 6543) + `DIRECT_URL` (session 5432)
- RLS пока не включён — backend ходит через service-режим Postgres

## Чего НЕ делать

- ❌ НЕ переписывать `LegacyWorkspace.tsx` как JSX — текущий innerHTML-паттерн сознательный
- ❌ НЕ добавлять хардкодные цвета в CSS — только через CSS переменные
- ❌ НЕ коммитить `server/.env`, `.env`, `server/uploads/`
- ❌ НЕ дублировать табы топбара внутри страниц
- ❌ НЕ править запрос БД без scope по `workspaceId`
- ❌ НЕ менять порт без обновления `.claude/launch.json` (4173 фронт, 3000 API)

## Что полезно знать

- Состояние UI сохраняется в `localStorage` под ключами `orbit-ws-{wsId}` (per-workspace) и `orbit-ui-global` (общие настройки)
- `LegacyWorkspace.tsx` делит render на функции: `renderApp` → `renderSidebar` + `renderTopbar` + `renderWorkspace` → `renderDashboard(route)` → конкретный renderer
- Топбар (`getTopbarTabs(route)`) показывает route-specific табы — их НЕ дублировать внутри страниц
