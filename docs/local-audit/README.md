# Local Audit

Локальный smoke-аудит фронтенда.

Команда:

```bash
npm run audit:local
```

Что делает:

- поднимает локальный статический сервер;
- открывает приложение в Playwright;
- проходит по основным маршрутам;
- нажимает ключевые кнопки и формы;
- делает скриншоты;
- собирает отчет по console/page errors и сигналам overflow.

Артефакты:

- `docs/local-audit/report.json`
- `docs/local-audit/screenshots/`
