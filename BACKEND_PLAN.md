# Backend Plan

Последнее обновление: 2026-04-03

## Платформа

Базовая backend-платформа: Supabase.

Причины выбора:

- быстрый старт для auth, Postgres, storage и realtime;
- удобно связать личный workspace с агентами и MCP;
- легко масштабировать от одиночного пользователя к командной версии;
- SQL-схема подходит под задачи, CRM, сообщения, события, документы и automation logs.

## Когда стартуем backend

Перед реальным подключением Supabase нужно запросить у пользователя:

- логин и пароль от Supabase, либо
- доступ к существующему проекту: `project url`, `anon key`, `service role key`, если он уже создан.

Секреты нельзя сохранять в репозитории или в `PROJECT_MEMORY.md`.

## Фазы

### Фаза 1. База и auth

- создать проект Supabase;
- включить email auth;
- создать таблицы `profiles`, `settings`, `workspace_memory`;
- настроить RLS для одиночного владельца.

### Фаза 2. Операционные модули

- `tasks`
- `events`
- `feed_posts`
- `mail_threads`
- `chat_threads`
- `chat_messages`
- `deals`
- `groups`
- `people`

### Фаза 3. Контент и интеграции

- `documents`
- `boards`
- `files_index`
- `automations`
- `integrations`
- `mcp_connections`
- `telegram_channels`

### Фаза 4. Логи и AI-контекст

- `activity_log`
- `memory_entries`
- `ai_sessions`
- `sync_jobs`

### Фаза 5. Realtime и automation layer

- realtime для сообщений, сделок и уведомлений;
- edge functions для webhook-ов;
- cron/queues для дайджестов, Telegram, MCP и follow-up сценариев.

## Предварительная схема сущностей

### Пользователь и профиль

- `profiles(id, email, full_name, role, avatar_url, timezone, created_at, updated_at)`
- `settings(user_id, theme, locale, sidebar_state, default_route, created_at, updated_at)`

### Работа и коммуникации

- `chat_threads(id, owner_id, kind, title, counterpart, focus, updated_at)`
- `chat_messages(id, thread_id, author_id, author_name, body, is_mine, created_at)`
- `mail_threads(id, owner_id, source, subject, preview, body, unread, received_at)`
- `feed_posts(id, owner_id, title, body, tag, created_at)`

### Планирование и CRM

- `tasks(id, owner_id, title, description, status, priority, deadline, owner_name, created_at, updated_at)`
- `events(id, owner_id, title, date_value, time_value, kind, created_at)`
- `deals(id, owner_id, title, company, stage, amount, next_step, created_at, updated_at)`

### Знания и контент

- `documents(id, owner_id, kind, title, summary, meta, created_at, updated_at)`
- `files_index(id, owner_id, path, title, summary, meta, created_at)`

### Автоматизация

- `automations(id, owner_id, title, description, status, config_json, created_at, updated_at)`
- `integrations(id, owner_id, title, description, state, config_json, created_at, updated_at)`

## Технический подход на фронте

Frontend уже переведен на `React + Vite + TypeScript`, при этом transitional UI-слой пока сохраняет поведение прошлой версии. На backend-фазе:

- вынести storage layer в отдельный модуль `data/` или `services/`;
- использовать `TanStack Query` для data fetching/cache;
- сначала сделать dual mode: `localStorage` fallback + Supabase sync;
- затем поэтапно перевести формы и списки на реальную БД;
- сохранить текущий UI shell и только заменить источник данных.

## Definition of Done для backend MVP

- авторизация в приложении;
- данные пользователя хранятся в Supabase;
- задачи, события, сделки, сообщения и документы переживают перезагрузку и другое устройство;
- RLS закрывает данные от чужих пользователей;
- есть миграции и `README` по развертыванию.
