import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const LOGIN_URL =
  "https://auth2.bitrix24.net/authorization/?client_id=site.53889571c72cf8.19427820&_ym_uid=1773173185440239007";
const PORTAL_URL = "https://c-community.bitrix24.ru";

const OUTPUT_ROOT = path.resolve("docs/bitrix-audit");
const SCREEN_DIR = path.join(OUTPUT_ROOT, "screenshots");
const HTML_DIR = path.join(OUTPUT_ROOT, "html");

const ROUTES = [
  { id: "portal-list", url: "https://auth2.bitrix24.net/portal/list/", waitFor: "body" },
  { id: "messenger", url: `${PORTAL_URL}/online/`, waitFor: "#messenger-embedded-application" },
  { id: "feed", url: `${PORTAL_URL}/stream/`, waitFor: "body" },
  {
    id: "calendar",
    url: `${PORTAL_URL}/company/personal/user/19/calendar/`,
    waitFor: "body",
  },
  {
    id: "documents",
    url: `${PORTAL_URL}/company/personal/user/19/disk/documents/`,
    waitFor: "body",
  },
  {
    id: "boards",
    url: `${PORTAL_URL}/company/personal/user/19/disk/boards/`,
    waitFor: "body",
  },
  {
    id: "drive",
    url: `${PORTAL_URL}/company/personal/user/19/disk/path/`,
    waitFor: "body",
  },
  { id: "mail", url: `${PORTAL_URL}/mail/?source=left_menu`, waitFor: "body" },
  { id: "groups", url: `${PORTAL_URL}/workgroups/`, waitFor: "body" },
  {
    id: "tasks",
    url: `${PORTAL_URL}/company/personal/user/19/tasks/?ta_sec=left_menu`,
    waitFor: "body",
  },
  { id: "crm", url: `${PORTAL_URL}/crm/deal/?redirect_to`, waitFor: "body" },
  { id: "marketing", url: `${PORTAL_URL}/marketing/`, waitFor: "body" },
  { id: "bi", url: `${PORTAL_URL}/bi/dashboard`, waitFor: "body" },
  { id: "company", url: `${PORTAL_URL}/company/`, waitFor: "body" },
  { id: "automation", url: `${PORTAL_URL}/rpa/`, waitFor: "body" },
  { id: "market", url: `${PORTAL_URL}/market/`, waitFor: "body" },
  { id: "devops", url: `${PORTAL_URL}/devops/`, waitFor: "body" },
  { id: "mcp", url: `${PORTAL_URL}/mcp/`, waitFor: "body" },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

async function ensureDirs() {
  await fs.mkdir(SCREEN_DIR, { recursive: true });
  await fs.mkdir(HTML_DIR, { recursive: true });
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function logInThroughBrowser(page, login, password) {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.waitForFunction(() => {
    return Boolean(window.BX?.B24network?.Security?.runAction);
  });

  const result = await page.evaluate(
    async ({ userLogin, userPassword }) => {
      const response = await window.BX.B24network.Security.runAction(
        "b24network.authorize.check",
        {
          login: userLogin,
          password: userPassword,
          remember: "1",
        },
      );

      return response;
    },
    { userLogin: login, userPassword: password },
  );

  if (!result?.data?.result) {
    throw new Error(`Bitrix auth failed: ${JSON.stringify(result)}`);
  }
}

async function enterPortal(page) {
  await page.goto("https://auth2.bitrix24.net/portal/list/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  await page.goto(`${PORTAL_URL}/?current_fieldset=SOCSERV`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForURL(/c-community\.bitrix24\.ru/, { timeout: 30_000 });
  await page.waitForTimeout(3500);
}

async function collectRoute(page, route) {
  await page.goto(route.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  if (route.waitFor) {
    try {
      await page.locator(route.waitFor).first().waitFor({ timeout: 15_000 });
    } catch (error) {
      console.warn(`waitFor failed for ${route.id}:`, error.message);
    }
  }

  await page.waitForTimeout(1200);

  const screenshotPath = path.join(SCREEN_DIR, `${route.id}.png`);
  const htmlPath = path.join(HTML_DIR, `${route.id}.html`);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const html = await page.content();
  await fs.writeFile(htmlPath, html, "utf8");

  const info = await page.evaluate(() => {
    const title = document.title;
    const leftMenu = Array.from(
      document.querySelectorAll(
        ".menu-item-link-text, .main-buttons-item-text-box, .menu-item-link-text",
      ),
    )
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .slice(0, 40);

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .slice(0, 12);

    return {
      title,
      currentUrl: location.href,
      headings,
      leftMenu,
      bodyText: document.body?.innerText?.slice(0, 5000) || "",
    };
  });

  return {
    id: route.id,
    ...info,
    screenshotPath,
    htmlPath,
  };
}

async function main() {
  const login = requireEnv("BITRIX_LOGIN");
  const password = requireEnv("BITRIX_PASSWORD");

  await ensureDirs();

  const browser = await chromium.launch({
    headless: true,
    viewport: {
      width: 1600,
      height: 1100,
    },
  });

  const context = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 1600, height: 1100 },
    colorScheme: "light",
  });

  const page = await context.newPage();
  const results = [];

  try {
    await logInThroughBrowser(page, login, password);
    await enterPortal(page);

    for (const route of ROUTES) {
      console.log(`Collecting ${route.id} -> ${route.url}`);
      const result = await collectRoute(page, route);
      results.push(result);
    }

    await writeJson(path.join(OUTPUT_ROOT, "manifest.json"), {
      generatedAt: new Date().toISOString(),
      portalUrl: PORTAL_URL,
      routes: results,
    });

  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
