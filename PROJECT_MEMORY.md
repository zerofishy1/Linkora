# Project Memory

Последнее обновление: 2026-04-10

## Цель

Собрать личную платформу в визуальной и продуктовой логике Bitrix24:

- темный космический shell;
- левое меню как в живом портале;
- рабочие модули для коммуникаций, задач, CRM, документов, AI, Telegram и автоматизации;
- каждая видимая основная кнопка должна выполнять действие;
- текст не должен ломать верстку;
- архитектура должна быть готова к backend-этапу на Supabase.

## Что уже изучено

Живой аудит Bitrix24 выполнен после авторизации в портал `c-community.bitrix24.ru`.

Артефакты аудита:

- `docs/bitrix-audit/manifest.json`
- `docs/bitrix-audit/click-map.json`
- `docs/bitrix-audit/html/`
- `docs/bitrix-audit/screenshots/`

Особенно полезные скрины:

- `docs/bitrix-audit/screenshots/messenger.png`
- `docs/bitrix-audit/screenshots/tasks.png`
- `docs/bitrix-audit/screenshots/documents.png`
- `docs/bitrix-audit/screenshots/mcp.png`
- `docs/bitrix-audit/screenshots/mail.png`
- `docs/bitrix-audit/screenshots/crm.png`

## Что удалось выяснить по рабочим направлениям компании

По артефактам портала и текстам в HTML основной контур компании выглядит так:

- консалтинг и внутренняя операционка;
- CRM и работа со сделками;
- документы, диск и коллаборативные пространства;
- Telegram и внешние каналы связи;
- AI/BitrixGPT/агенты;
- MCP и интеграции;
- маркетинг и BI-аналитика;
- разработка и технические подключения.

## Текущее состояние фронтенда

Главные файлы:

- `index.html`
- `styles.css`
- `app.js`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/legacy/LegacyWorkspace.tsx`
- `src/lib/supabase.ts`
- `src/providers/AppProviders.tsx`

Что реализовано:

- dark-space shell ближе к живому Bitrix;
- service bar с горизонтальной навигацией и utility-кнопками;
- правый quick rail;
- рабочие маршруты для `messenger`, `feed`, `collabs`, `calendar`, `documents`, `boards`, `drive`, `mail`, `groups`, `tasks`, `crm`, `marketing`, `bi`, `company`, `automation`, `market`, `devops`, `mcp`, `telegram`;
- рабочие действия верхней панели: создание, фокус полей, AI help, invite, quick note;
- документы получили launch-плитки и sheet-table;
- `mcp` получил sheet-table режим;
- состояние хранится в `localStorage`.

## Статус миграции на React

Миграция начата и уже доведена до рабочего transitional-слоя:

- приложение теперь запускается через `React + Vite + TypeScript`;
- маршрутизация идет через `React Router`;
- `TanStack Query` подключен как базовый data layer;
- `Supabase` подключен как readiness-layer через `src/lib/supabase.ts`;
- текущий UI и логика прошлой версии сохранены внутри `src/legacy/LegacyWorkspace.tsx`;
- старая ванильная версия сохранена в `legacy/` как baseline для regressions.

## Проверки

Синтаксис:

- `node --check app.js`

Локальный аудит фронтенда:

- `npm run audit:local`

Он пишет:

- `docs/local-audit/report.json`
- `docs/local-audit/screenshots/`

Последний результат локального аудита:

- 19 маршрутов проверено;
- `consoleErrors: 0`
- `pageErrors: 0`
- `routesWithOverflowSignals: 0`

Последний результат button coverage audit:

- `npm run audit:buttons` проходит успешно;
- 19 сценариев из 19 прошли;
- инвентарь собран в `docs/button-coverage/inventory.json`;
- по текущей выборке найдено `1143` desktop button instances, `225` уникальных desktop button signatures и `56` mobile button instances;
- по инвентарю `deadButtonCount: 0` (для desktop `button` без `data-action`).

## Последние исправления

- импортирована версия из архива `Bitrix 2.0 3.zip` в рабочую директорию (без `node_modules/dist`);
- восстановлена кликабельность topbar/service-nav/page-toolbar/quick-rail после переноса;
- возвращен полноценный интерактивный messenger (tab-row, выбор чатов, отправка сообщений, AI help);
- добавлены обработчики для ранее мертвых кнопок (`open-memory`, `Ещё`, `Расширить тариф`, quick rail переходы);
- в `tasks` добавлена быстрая форма создания задачи с рабочими `#taskTitle/#taskDescription` и submit;
- устранены оставшиеся некликабельные кнопки в `tasks` (toolbar/signal/actions получили реальные `data-action`);
- устранены overflow-сигналы по всем 19 маршрутам (исправлены ширины/переносы в topbar и messenger search row);
- заново выполнен live-аудит Bitrix24 под рабочей учеткой: обновлены скрины/HTML по всем разделам;
- добавлен `tools/bitrix-click-map.mjs` и собрана карта кликов `docs/bitrix-audit/click-map.json` (`947` кликабельных элементов, `416` переходов);
- добавлена межразделовая интерактивность в визуальные блоки:
  `feed` (типы публикаций, действия карточек), `calendar` (toolbar/view tabs/конвертация события в задачу),
  `docs` (поднавигация и действия строк), `groups`/`company` (кнопки коммуникации и постановки задач),
  `crm` (follow-up из карточек), `marketing`/`bi` (навигационные и create-действия),
  `automation`/`integrations` (toggle-состояния + создание задач контроля);
- выполнен parity-pass для `tasks/crm/documents`:
  `tasks` — модульные вкладки, role/scope фильтры, stateful режимы списка/сроков/плана/календаря/ганта;
  `crm` — entity tabs, фильтры, канбан/список, привязка follow-up к задачам;
  `documents` — режимы список/сетка/плитка, блок открытия из внешних источников, табличные массовые действия;
- после parity-pass подтверждено:
  `npm run audit:buttons` = `19/19`, `npm run audit:local` = `0` console/page errors, `0` overflow signals;
- обновленный button inventory:
  `1211` desktop button instances, `264` уникальных desktop signatures, `56` mobile button instances, `deadButtonCount: 0`.
- 13 апреля 2026 выполнен повторный live-аудит Bitrix24 именно по разделу `Группы`;
- добавлено отдельное ТЗ по разделу:
  `docs/bitrix-audit/groups-tz.md`;
- сохранены свежие live-скриншоты раздела:
  `docs/bitrix-audit/screenshots/groups-list-live-2026-04-13.png`,
  `docs/bitrix-audit/screenshots/groups-create-slider-live-2026-04-13.png`,
  `docs/bitrix-audit/screenshots/groups-open-project-live-2026-04-13.png`,
  `docs/bitrix-audit/screenshots/groups-member-project-live-2026-04-13.png`;
- подтверждено ключевое поведение раздела `Группы`:
  список работает как фон, а `Создать` и открытие группы идут через side-slider с iframe и сменой URL;
- подтверждено, что landing у группы не фиксирован:
  разные группы открываются сразу в `Ленту`, `Задачи` или `Диск`;
- подтверждены разные access-state сценарии:
  open non-member, closed non-member и member project.

- `Открыть` в блоке памяти проекта теперь реально открывает `PROJECT_MEMORY.md` из `public/`;
- добавлен sync markdown-доков в `public/` перед сборкой;
- messenger tabs доведены до полноценного stateful-поведения;
- добавлен отдельный чат для `Настройки мессенджера`;
- mobile sidebar перестал перехватывать клики в закрытом состоянии;
- добавлен отдельный аудит полного button coverage.
- исправлена критическая ошибка разметки messenger: неверный закрывающий тег в `src/legacy/LegacyWorkspace.tsx` ломал DOM и клики по чатам;
- подтверждена целевая раскладка messenger: список чатов слева, область переписки справа (`.bitrix-messenger-shell` + `.bitrix-message-pane.panel`);
- добавлен usability-pass в `styles.css`: упрощен фон, снижена визуальная шумность, стабилизированы высоты/скролл контейнеров в messenger.

Последний результат React-сборки:

- `npm run build` проходит успешно;
- Vite production build собирается без ошибок.

Последняя проверка после фикса messenger/layout:

- `npm run audit:buttons` = `19/19` passed;
- `npm run audit:local` = `19` маршрутов, `0` console errors, `0` page errors, `0` overflow signals.

## Правила продолжения

- не хранить секреты, пароли, cookie и access tokens в репозитории;
- Bitrix-учетку не дублировать в памяти проекта;
- когда начнется реальный backend-этап на Supabase, сначала запросить у пользователя логин/пароль или project credentials;
- память проекта поддерживать в этом файле и в `BACKEND_PLAN.md`.

## Следующие шаги

- довести наиболее сложные экраны до еще более близкого сходства: задачи, CRM, почта;
- после smoke-аудита поправить найденные overflow/spacing issues;
- перейти к backend-фазе на Supabase после получения учетных данных;
- связать frontend state с реальными таблицами, auth и realtime.
