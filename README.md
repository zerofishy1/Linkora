# Orbit24 Personal

Личный workspace в визуальной логике Bitrix24, переведенный на `React + Vite + TypeScript + React Router + TanStack Query + Supabase-ready layer`.

Что уже сделано:

- сохранен прошлый UI/logic как baseline;
- новый entrypoint теперь работает через React/Vite;
- текущий интерфейс перенесен в transitional React-слой без потери маршрутов и действий;
- `localStorage` пока остается основным источником данных;
- подготовлен backend-план на Supabase.

## Быстрый старт

Подними dev-сервер:

```bash
npm run dev
```

Либо preview:

```bash
npm run build
npm run preview
```

## Проверки

Синтаксис фронтенда:

```bash
npm run build
```

Локальный smoke-аудит со скриншотами:

```bash
npm run audit:local
```

Полный аудит кнопок:

```bash
npm run audit:buttons
```

Живой аудит Bitrix:

```bash
npm run audit:bitrix
```

Карта кликов и переходов по сохраненному live-audit:

```bash
npm run audit:bitrix:clickmap
```

## Основные файлы

- [index.html](/Users/hamidmusaev/Documents/Bitrix 2.0/index.html)
- [styles.css](/Users/hamidmusaev/Documents/Bitrix 2.0/styles.css)
- [app.js](/Users/hamidmusaev/Documents/Bitrix 2.0/app.js)
- [src/main.tsx](/Users/hamidmusaev/Documents/Bitrix 2.0/src/main.tsx)
- [src/app/App.tsx](/Users/hamidmusaev/Documents/Bitrix 2.0/src/app/App.tsx)
- [src/legacy/LegacyWorkspace.tsx](/Users/hamidmusaev/Documents/Bitrix 2.0/src/legacy/LegacyWorkspace.tsx)
- [src/lib/supabase.ts](/Users/hamidmusaev/Documents/Bitrix 2.0/src/lib/supabase.ts)
- [PROJECT_MEMORY.md](/Users/hamidmusaev/Documents/Bitrix 2.0/PROJECT_MEMORY.md)
- [BACKEND_PLAN.md](/Users/hamidmusaev/Documents/Bitrix 2.0/BACKEND_PLAN.md)
- [REACT_MIGRATION_PLAN.md](/Users/hamidmusaev/Documents/Bitrix 2.0/REACT_MIGRATION_PLAN.md)
- [tools/bitrix-audit.mjs](/Users/hamidmusaev/Documents/Bitrix 2.0/tools/bitrix-audit.mjs)
- [tools/bitrix-click-map.mjs](/Users/hamidmusaev/Documents/Bitrix 2.0/tools/bitrix-click-map.mjs)
- [tools/local-smoke.mjs](/Users/hamidmusaev/Documents/Bitrix 2.0/tools/local-smoke.mjs)

## Baseline старой версии

Архив прошлой ванильной версии оставлен для безопасного сравнения:

- [legacy/index.legacy.html](/Users/hamidmusaev/Documents/Bitrix 2.0/legacy/index.legacy.html)
- [legacy/app.legacy.js](/Users/hamidmusaev/Documents/Bitrix 2.0/legacy/app.legacy.js)
- [legacy/styles.legacy.css](/Users/hamidmusaev/Documents/Bitrix 2.0/legacy/styles.legacy.css)

## Артефакты аудита

- [docs/bitrix-audit/README.md](/Users/hamidmusaev/Documents/Bitrix 2.0/docs/bitrix-audit/README.md)
- [docs/local-audit/README.md](/Users/hamidmusaev/Documents/Bitrix 2.0/docs/local-audit/README.md)
- [docs/button-coverage/README.md](/Users/hamidmusaev/Documents/Bitrix 2.0/docs/button-coverage/README.md)
