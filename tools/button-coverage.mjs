import http from "node:http";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const STORAGE_KEY = "orbit-workspace-state-v1";
const workspaceDir = process.cwd();
const buildDir = path.join(workspaceDir, "dist");
const rootDir = existsSync(buildDir) ? buildDir : workspaceDir;
const auditDir = path.join(workspaceDir, "docs", "button-coverage");
const reportPath = path.join(auditDir, "report.json");
const inventoryPath = path.join(auditDir, "inventory.json");
const serverOrigin = "http://127.0.0.1";
let baseUrl = serverOrigin;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const routes = [
  "messenger",
  "feed",
  "collabs",
  "calendar",
  "documents",
  "boards",
  "drive",
  "mail",
  "groups",
  "tasks",
  "crm",
  "marketing",
  "bi",
  "company",
  "automation",
  "market",
  "devops",
  "mcp",
  "telegram",
];

function makeRouteUrl(route = "messenger") {
  return route ? `${baseUrl}/${route}` : baseUrl;
}

function createStaticServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", serverOrigin);
      const requestPath = decodeURIComponent(url.pathname);
      const relativePath = requestPath === "/" ? "/index.html" : requestPath;
      const filePath = path.normalize(path.join(rootDir, relativePath));

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": contentType });
      res.end(body);
    } catch (error) {
      try {
        const fallback = await readFile(path.join(rootDir, "index.html"));
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(fallback);
      } catch (fallbackError) {
        res.writeHead(404);
        res.end("Not found");
      }
    }
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve dynamic server port"));
        return;
      }
      resolve(address.port);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function resetWorkspace(page, route = "messenger") {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
  await page.goto(makeRouteUrl(route), { waitUntil: "networkidle" });
  await page.waitForTimeout(120);
}

async function readState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), STORAGE_KEY);
}

async function collectButtons(page) {
  return page.evaluate(() => {
    function isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0
      );
    }

    return Array.from(document.querySelectorAll("button"))
      .filter((button) => isVisible(button))
      .map((button, index) => ({
        index,
        text: (button.innerText || button.textContent || "").trim().replace(/\s+/g, " "),
        className: button.className,
        type: button.getAttribute("type") || "button",
        action: button.dataset.action || null,
        route: button.dataset.route || null,
        target: button.dataset.target || null,
        chatTab: button.dataset.chatTab || null,
        selectorHint:
          button.dataset.action ||
          button.dataset.route ||
          button.dataset.target ||
          (button.innerText || button.textContent || "").trim(),
      }));
  });
}

async function goToRoute(page, route) {
  await page.goto(makeRouteUrl(route), { waitUntil: "networkidle" });
  await page.waitForTimeout(100);
}

async function expectPath(page, route) {
  await page.waitForTimeout(100);
  const pathname = new URL(page.url()).pathname;
  assert(pathname === `/${route}`, `Expected path /${route}, got ${pathname}`);
}

async function expectPaneHeading(page, text) {
  await page.locator(".pane-head h3", { hasText: text }).waitFor({ state: "visible" });
}

async function runScenario(name, fn) {
  try {
    await fn();
    return { name, status: "passed" };
  } catch (error) {
    return {
      name,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  await mkdir(auditDir, { recursive: true });

  const server = createStaticServer();
  const port = await listen(server);
  baseUrl = `${serverOrigin}:${port}`;

  const browser = await chromium.launch({ headless: true });

  try {
    const inventoryContext = await browser.newContext({
      viewport: { width: 1440, height: 980 },
    });
    const inventoryPage = await inventoryContext.newPage();
    const inventory = {
      generatedAt: new Date().toISOString(),
      desktop: {},
      mobile: {},
    };

    await resetWorkspace(inventoryPage, "messenger");
    for (const route of routes) {
      await goToRoute(inventoryPage, route);
      inventory.desktop[route] = await collectButtons(inventoryPage);
    }

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const mobilePage = await mobileContext.newPage();
    await resetWorkspace(mobilePage, "messenger");
    inventory.mobile.messenger = await collectButtons(mobilePage);
    await mobilePage.close();
    await mobileContext.close();
    await writeFile(inventoryPath, JSON.stringify(inventory, null, 2));
    await inventoryContext.close();

    const results = [];

    async function withFreshPage(viewport, callback) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      try {
        await resetWorkspace(page, "messenger");
        return await callback(page);
      } finally {
        await context.close();
      }
    }

    results.push(
      await runScenario("root_redirects_to_messenger", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          const pathname = new URL(page.url()).pathname;
          assert(pathname === "/messenger", `Expected /messenger redirect, got ${pathname}`);
        });
      }),
    );

    results.push(
      await runScenario("sidebar_group_toggles_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          for (const group of ["teamwork", "core", "apps"]) {
            const groupLocator = page.locator(`.nav-group-toggle[data-group="${group}"]`).first();
            await groupLocator.click();
            await page.waitForTimeout(80);
            const collapsed = await groupLocator.evaluate(
              (node) => node.parentElement?.classList.contains("is-collapsed") ?? false,
            );
            assert(collapsed, `Group ${group} did not collapse`);
            await groupLocator.click();
            await page.waitForTimeout(80);
            const expanded = await groupLocator.evaluate(
              (node) => !(node.parentElement?.classList.contains("is-collapsed") ?? true),
            );
            assert(expanded, `Group ${group} did not expand`);
          }
        });
      }),
    );

    results.push(
      await runScenario("sidebar_navigation_covers_all_routes", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          for (const route of routes) {
            await page.locator(`.sidebar [data-route="${route}"]`).first().click();
            await expectPath(page, route);
          }
        });
      }),
    );

    results.push(
      await runScenario("service_nav_buttons_cover_sections", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "messenger");
          for (const route of ["messenger", "feed", "collabs", "calendar", "documents", "boards", "drive", "mail", "groups"]) {
            await page.locator(`.topbar-service [data-route="${route}"]`).first().click();
            await expectPath(page, route);
          }

          await goToRoute(page, "tasks");
          for (const route of ["tasks", "crm", "marketing", "bi", "company", "automation"]) {
            await page.locator(`.topbar-service [data-route="${route}"]`).first().click();
            await expectPath(page, route);
          }

          await goToRoute(page, "market");
          for (const route of ["market", "devops", "mcp", "telegram"]) {
            await page.locator(`.topbar-service [data-route="${route}"]`).first().click();
            await expectPath(page, route);
          }
        });
      }),
    );

    results.push(
      await runScenario("utility_buttons_invite_market_help_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          const initialPeople = (await readState(page)).people.length;
          await page.locator('.service-actions [data-action="route-create"][data-target="person"]').click();
          await expectPath(page, "company");
          const peopleState = await readState(page);
          assert(peopleState.people.length === initialPeople + 1, "Invite did not add person");

          await goToRoute(page, "messenger");
          await page.locator('.service-actions [data-route="market"]').click();
          await expectPath(page, "market");

          await page.locator('.service-actions [data-action="open-assistant"]').click();
          await expectPath(page, "messenger");
          const heading = await page.locator(".pane-head h3").textContent();
          assert(heading?.includes("Orbit AI Studio"), "Help button did not open AI chat");
        });
      }),
    );

    results.push(
      await runScenario("quick_rail_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          for (const route of ["messenger", "tasks", "crm", "automation", "mcp"]) {
            await page.locator(`.quick-rail [data-route="${route}"]`).click();
            await expectPath(page, route);
          }

          await page.locator('.quick-rail [data-action="open-assistant"]').click();
          await expectPath(page, "messenger");
          const heading = await page.locator(".pane-head h3").textContent();
          assert(heading?.includes("Orbit AI Studio"), "Quick rail AI did not open assistant");
        });
      }),
    );

    results.push(
      await runScenario("memory_button_opens_project_memory", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          const popupPromise = page.waitForEvent("popup");
          await page.locator('[data-action="open-path"]').click();
          const popup = await popupPromise;
          await popup.waitForLoadState("domcontentloaded");
          assert(
            popup.url().endsWith("/PROJECT_MEMORY.md"),
            `Unexpected memory popup url: ${popup.url()}`,
          );
          const bodyText = await popup.locator("body").textContent();
          assert(bodyText?.includes("Project Memory"), "Memory popup content missing");
          await popup.close();
        });
      }),
    );

    results.push(
      await runScenario("mobile_sidebar_toggle_and_overlay_work", async () => {
        await withFreshPage({ width: 390, height: 844 }, async (page) => {
          await page.locator(".mobile-toggle").click();
          const sidebarOpen = await page.evaluate(() => document.body.classList.contains("sidebar-open"));
          assert(sidebarOpen, "Mobile toggle did not open sidebar");
          await page.locator('.overlay[data-action="close-sidebar"]').click({
            position: { x: 360, y: 120 },
          });
          const sidebarClosed = await page.evaluate(() => !document.body.classList.contains("sidebar-open"));
          assert(sidebarClosed, "Overlay did not close sidebar");
        });
      }),
    );

    results.push(
      await runScenario("quick_capture_button_adds_feed_note", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          const before = (await readState(page)).feed.length;
          await page.locator('.page-toolbar [data-action="quick-capture"]').click();
          const after = (await readState(page)).feed.length;
          assert(after === before + 1, "Quick capture did not append feed item");
        });
      }),
    );

    results.push(
      await runScenario("messenger_tabs_all_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "messenger");

          await page.locator('.tab-row [data-chat-tab="task"]').click();
          await expectPaneHeading(page, "Task sync");

          await page.locator('.tab-row [data-chat-tab="copilot"]').click();
          await expectPaneHeading(page, "Orbit AI Studio");

          await page.locator('.tab-row [data-route="collabs"]').filter({ hasText: "Коллабы" }).click();
          await expectPath(page, "collabs");
          await expectPaneHeading(page, "Growth lab sprint");

          await page.locator('.tab-row [data-route="messenger"][data-chat-tab="channel"]').click();
          await expectPath(page, "messenger");
          await expectPaneHeading(page, "Signal channel");

          await page.locator('.tab-row [data-route="messenger"][data-chat-tab="notification"]').click();
          await expectPaneHeading(page, "Уведомления");

          await page.locator('.tab-row [data-route="messenger"][data-chat-tab="call"]').click();
          await expectPaneHeading(page, "Call center");

          await page.locator('.tab-row [data-route="market"]').filter({ hasText: "Маркет" }).click();
          await expectPath(page, "market");

          await goToRoute(page, "messenger");
          await page.locator('.tab-row [data-route="messenger"][data-chat-tab="settings"]').click();
          await expectPaneHeading(page, "Настройки мессенджера");
        });
      }),
    );

    results.push(
      await runScenario("messenger_primary_button_creates_dialog", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          const before = (await readState(page)).chats.length;
          await page.locator('.page-toolbar .primary-button[data-target="chat"]').click();
          const afterState = await readState(page);
          assert(afterState.chats.length === before + 1, "New dialog button did not add chat");
          assert(
            (await page.locator(".pane-head h3").textContent())?.includes("Новый диалог"),
            "New dialog did not open created chat",
          );
        });
      }),
    );

    results.push(
      await runScenario("messenger_send_message_button_works", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await page.fill("textarea[name='message']", "Button coverage message");
          const before = (await readState(page)).chats.find((chat) => chat.id === "chat-core").messages.length;
          await page.locator(".message-form .primary-button").click();
          const after = (await readState(page)).chats.find((chat) => chat.id === "chat-core").messages.length;
          assert(after === before + 1, "Send message button did not append message");
        });
      }),
    );

    results.push(
      await runScenario("feed_form_submit_button_works", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "feed");
          await page.fill("#feedTitle", "Coverage post");
          await page.fill("#feedBody", "Проверка submit-кнопки ленты.");
          const before = (await readState(page)).feed.length;
          await page.locator("form[data-form='add-feed'] .primary-button").click();
          const after = (await readState(page)).feed.length;
          assert(after === before + 1, "Feed submit did not add post");
        });
      }),
    );

    results.push(
      await runScenario("calendar_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "calendar");
          await page.locator(".page-toolbar .primary-button").click();
          const focusedId = await page.evaluate(() => document.activeElement?.id || null);
          assert(focusedId === "eventTitle", "Calendar primary button did not focus title field");

          const before = (await readState(page)).events.length;
          await page.fill("#eventTitle", "Coverage event");
          await page.fill("#eventDate", "12 апр");
          await page.fill("#eventTime", "15:15");
          await page.locator("form[data-form='add-event'] .primary-button").click();
          const after = (await readState(page)).events.length;
          assert(after === before + 1, "Calendar submit did not add event");
        });
      }),
    );

    results.push(
      await runScenario("documents_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "documents");

          for (const route of ["documents", "boards", "drive"]) {
            await page.locator(`.tab-row [data-route="${route}"]`).first().click();
            await expectPath(page, route === "drive" ? "drive" : route);
          }

          await goToRoute(page, "documents");
          const beforeDocs = (await readState(page)).docs.documents.length;
          await page.locator(".doc-launch-card").filter({ hasText: "Документ" }).click();
          let state = await readState(page);
          assert(state.docs.documents.length === beforeDocs + 1, "Document launcher failed");

          await page.locator(".doc-launch-card").filter({ hasText: "Таблица" }).click();
          state = await readState(page);
          assert(state.docs.documents.length === beforeDocs + 2, "Table launcher failed");

          await page.locator(".doc-launch-card").filter({ hasText: "Презентация" }).click();
          state = await readState(page);
          assert(state.docs.documents.length === beforeDocs + 3, "Presentation launcher failed");

          await page.locator(".doc-launch-card").filter({ hasText: "Доска" }).click();
          await expectPath(page, "boards");

          await goToRoute(page, "documents");
          await page.locator(".doc-launch-card").filter({ hasText: "Загрузка" }).click();
          await expectPath(page, "drive");

          await goToRoute(page, "documents");
          await page.locator(".doc-launch-card").filter({ hasText: "Подключение" }).click();
          await expectPath(page, "mcp");
        });
      }),
    );

    results.push(
      await runScenario("mail_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "mail");
          const before = (await readState(page)).mail.length;
          await page.locator('.page-toolbar .primary-button[data-target="mail"]').click();
          let state = await readState(page);
          assert(state.mail.length === before + 1, "Mail primary button did not add mailbox draft");

          await page.locator(".mail-item").nth(1).click();
          const selectedHeading = await page.locator(".mail-preview .page-head h2").textContent();
          assert(Boolean(selectedHeading), "Mail item click did not open preview");

          await page.locator('.mail-preview [data-route="crm"]').click();
          await expectPath(page, "crm");

          await goToRoute(page, "mail");
          await page.locator('.mail-preview [data-route="tasks"]').click();
          await expectPath(page, "tasks");
        });
      }),
    );

    results.push(
      await runScenario("tasks_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "tasks");
          await page.locator(".page-toolbar .primary-button").click();
          const focusedId = await page.evaluate(() => document.activeElement?.id || null);
          assert(focusedId === "taskTitle", "Tasks primary button did not focus title field");

          const before = (await readState(page)).tasks.length;
          await page.fill("#taskTitle", "Coverage task");
          await page.fill("#taskDescription", "Проверка submit-кнопки задач.");
          await page.fill("#taskDeadline", "13 апр");
          await page.locator("form[data-form='add-task'] .primary-button").click();
          const after = (await readState(page)).tasks.length;
          assert(after === before + 1, "Task submit did not add task");
        });
      }),
    );

    results.push(
      await runScenario("crm_buttons_work", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          await goToRoute(page, "crm");
          await page.locator(".page-toolbar .primary-button").click();
          const focusedId = await page.evaluate(() => document.activeElement?.id || null);
          assert(focusedId === "dealTitle", "CRM primary button did not focus title field");

          const before = (await readState(page)).deals.length;
          await page.fill("#dealTitle", "Coverage deal");
          await page.fill("#dealCompany", "Coverage company");
          await page.fill("#dealAmount", "230000");
          await page.fill("#dealNextStep", "Провести demo");
          await page.locator("form[data-form='add-deal'] .primary-button").click();
          const after = (await readState(page)).deals.length;
          assert(after === before + 1, "CRM submit did not add deal");
        });
      }),
    );

    results.push(
      await runScenario("route_create_buttons_work_across_modules", async () => {
        await withFreshPage({ width: 1440, height: 980 }, async (page) => {
          const checks = [
            {
              route: "collabs",
              read: (state) => state.chats.filter((chat) => chat.tab === "collab").length,
            },
            {
              route: "groups",
              read: (state) => state.groups.length,
            },
            {
              route: "marketing",
              read: (state) => state.feed.length,
            },
            {
              route: "bi",
              read: (state) => state.docs.documents.length,
            },
            {
              route: "company",
              read: (state) => state.people.length,
            },
            {
              route: "automation",
              read: (state) => state.automations.length,
            },
            {
              route: "market",
              read: (state) => state.integrations.length,
            },
            {
              route: "devops",
              read: (state) => state.integrations.length,
            },
            {
              route: "mcp",
              read: (state) => state.integrations.length,
            },
            {
              route: "telegram",
              read: (state) => state.integrations.length,
            },
            {
              route: "documents",
              read: (state) => state.docs.documents.length,
            },
            {
              route: "boards",
              read: (state) => state.docs.boards.length,
            },
            {
              route: "drive",
              read: (state) => state.docs.files.length,
            },
          ];

          for (const item of checks) {
            await goToRoute(page, item.route);
            const before = item.read(await readState(page));
            await page.locator(".page-toolbar .primary-button").click();
            const after = item.read(await readState(page));
            assert(after === before + 1, `Primary button failed on route ${item.route}`);
          }
        });
      }),
    );

    const failed = results.filter((item) => item.status === "failed");
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      routes,
      totalScenarios: results.length,
      passedScenarios: results.filter((item) => item.status === "passed").length,
      failedScenarios: failed.length,
      results,
      inventoryPath,
    };

    await writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(
      JSON.stringify(
        {
          reportPath,
          inventoryPath,
          totalScenarios: report.totalScenarios,
          passedScenarios: report.passedScenarios,
          failedScenarios: report.failedScenarios,
        },
        null,
        2,
      ),
    );

    if (failed.length) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await close(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
