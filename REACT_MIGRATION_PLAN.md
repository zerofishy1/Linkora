# React Migration Plan

Последнее обновление: 2026-04-06

## Цель

Перевести текущий рабочий прототип на стек:

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Supabase

При этом сохранить:

- визуальный язык текущей версии;
- маршруты и пользовательские сценарии прошлой версии;
- логику локальных действий до подключения backend.

## Стратегия

### Этап 1. Safe migration shell

- сохранить старую ванильную версию как baseline;
- поднять Vite + React + TypeScript;
- подключить Router, Query client и Supabase layer;
- обернуть текущую UI/logic-версию в React как transitional module.

### Этап 2. Stabilize

- добиться рабочей сборки и повторяемого dev-flow;
- убедиться, что старые экраны и кнопки живы;
- продолжить использовать локальный smoke-аудит.

### Этап 3. Modularization

- выделить layout;
- выделить route-модули;
- вынести данные, экшены и формы в typed services/hooks;
- постепенно убирать string-render подход внутри transitional слоя.

### Этап 4. Supabase integration

- auth;
- profiles/settings;
- tasks/crm/messages/documents;
- local-first fallback и sync;
- realtime и permissions.

## Принципы

- не переписывать все одним большим куском;
- сначала сохранить рабочий интерфейс, затем улучшать архитектуру;
- использовать текущую ванильную версию как эталон для regressions.
