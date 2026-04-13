import http from "node:http";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const workspaceDir = process.cwd();
const buildDir = path.join(workspaceDir, "dist");
const rootDir = existsSync(buildDir) ? buildDir : workspaceDir;
const auditDir = path.join(workspaceDir, "docs", "local-audit");
const screenshotDir = path.join(auditDir, "screenshots");
const reportPath = path.join(auditDir, "report.json");
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
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

function createStaticServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", baseUrl);
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
    server.listen(port, "127.0.0.1", resolve);
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

async function checkOverflow(page) {
  return page.evaluate(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const allowHorizontalEscape =
      bodyStyle.overflowX !== "hidden" && bodyStyle.overflowX !== "clip";
    const pageOverflow =
      !allowHorizontalEscape
        ? 0
        : Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const offenders = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const el = element;
        if (el.closest(".service-nav")) {
          return false;
        }

        if (el.closest(".tab-row")) {
          return false;
        }

        if (
          el.matches("#app > div, .app-shell, .content-shell, .workspace, .workspace-body, .page-head")
        ) {
          return false;
        }

        if (el.tagName === "DIV" && !el.className) {
          return false;
        }

        const style = window.getComputedStyle(el);
        if (style.overflowX === "auto" || style.overflowX === "scroll") {
          return false;
        }

        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return false;
        }

        const text = (el.innerText || el.textContent || "").trim();
        if (!text) {
          return false;
        }

        const horizontalEscape = rect.right - window.innerWidth > 1;
        const clippedText = el.scrollWidth - el.clientWidth > 8 && el.clientWidth > 40;
        return clippedText || (horizontalEscape && allowHorizontalEscape);
      })
      .slice(0, 20)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        className: el.className,
        text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
        overflowDelta: Math.max(0, el.scrollWidth - el.clientWidth),
      }));

    return {
      pageOverflow,
      offenders,
    };
  });
}

async function clickIfVisible(page, selector) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) {
    return false;
  }

  await locator.click();
  return true;
}

async function fillIfVisible(page, selector, value) {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) {
    return false;
  }

  await locator.fill(value);
  return true;
}

async function exerciseRoute(page, route) {
  const bySidebar = page.locator(`.sidebar [data-route="${route}"]`).first();
  if ((await bySidebar.count()) > 0) {
    await bySidebar.click();
  } else {
    await page.goto(`${baseUrl}/#/${route}`, { waitUntil: "networkidle" });
  }

  await page.waitForTimeout(150);

  switch (route) {
    case "messenger":
    case "collabs":
      await clickIfVisible(page, ".chat-thread-card");
      await fillIfVisible(page, "textarea[name='message']", `Smoke test for ${route}`);
      await clickIfVisible(page, ".message-form .primary-button");
      break;
    case "feed":
      await fillIfVisible(page, "#feedTitle", "Smoke post");
      await fillIfVisible(page, "#feedBody", "Проверка формы ленты в локальном аудите.");
      await clickIfVisible(page, ".feed-composer .primary-button");
      break;
    case "calendar":
      await fillIfVisible(page, "#eventTitle", "Smoke review");
      await fillIfVisible(page, "#eventDate", "10 апр");
      await fillIfVisible(page, "#eventTime", "12:30");
      await clickIfVisible(page, "form[data-form='add-event'] .primary-button");
      break;
    case "documents":
    case "boards":
    case "drive":
      await clickIfVisible(page, ".doc-launch-card");
      break;
    case "tasks":
      await fillIfVisible(page, "#taskTitle", "Smoke task");
      await fillIfVisible(page, "#taskDescription", "Проверка формы задач.");
      await fillIfVisible(page, "#taskDeadline", "11 апр");
      await clickIfVisible(page, "form[data-form='add-task'] .primary-button");
      break;
    case "crm":
      await fillIfVisible(page, "#dealTitle", "Smoke deal");
      await fillIfVisible(page, "#dealCompany", "Smoke client");
      await fillIfVisible(page, "#dealAmount", "150000");
      await fillIfVisible(page, "#dealNextStep", "Созвон");
      await clickIfVisible(page, "form[data-form='add-deal'] .primary-button");
      break;
    default:
      await clickIfVisible(page, ".page-toolbar .primary-button");
      break;
  }

  await page.waitForTimeout(150);
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });

  const server = createStaticServer();
  await listen(server);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes: [],
    consoleErrors,
    pageErrors,
  };

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    for (const route of routes) {
      await exerciseRoute(page, route);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(60);

      const overflow = await checkOverflow(page);
      const pageTitle = await page.title();

      await page.screenshot({
        path: path.join(screenshotDir, `${route}.png`),
        fullPage: false,
      });

      report.routes.push({
        route,
        pageTitle,
        url: page.url(),
        overflow,
      });
    }

    await clickIfVisible(page, ".quick-rail [data-route='messenger']");
    await clickIfVisible(page, ".quick-rail [data-route='tasks']");
    await clickIfVisible(page, ".quick-rail [data-route='crm']");
    await clickIfVisible(page, ".topbar-service .utility-button");
  } finally {
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    await browser.close();
    await close(server);
  }

  const overflowCount = report.routes.reduce(
    (sum, item) => sum + (item.overflow.pageOverflow > 0 || item.overflow.offenders.length > 0 ? 1 : 0),
    0,
  );

  console.log(
    JSON.stringify(
      {
        reportPath,
        screenshots: screenshotDir,
        routesChecked: report.routes.length,
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        routesWithOverflowSignals: overflowCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
