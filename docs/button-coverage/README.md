# Button Coverage

Полный аудит кнопок и основных интерактивных контролов.

Команда:

```bash
npm run audit:buttons
```

Что делает:

- собирает inventory видимых кнопок по маршрутам;
- проверяет desktop и mobile shell;
- проходит по глобальным и route-specific кнопкам;
- проверяет навигацию, create actions, формы, AI/help, memory popup и mobile sidebar;
- пишет отчет по pass/fail сценариям.

Артефакты:

- `docs/button-coverage/report.json`
- `docs/button-coverage/inventory.json`
