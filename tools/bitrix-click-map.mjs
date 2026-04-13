import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const AUDIT_ROOT = path.resolve("docs/bitrix-audit");
const HTML_DIR = path.join(AUDIT_ROOT, "html");
const MANIFEST_PATH = path.join(AUDIT_ROOT, "manifest.json");
const OUTPUT_PATH = path.join(AUDIT_ROOT, "click-map.json");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function classifyTarget(url, knownRoutes) {
  if (!url) {
    return null;
  }

  for (const route of knownRoutes) {
    if (url.startsWith(route.currentUrl)) {
      return route.id;
    }
  }

  return null;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  const routeMap = new Map(manifest.routes.map((route) => [route.id, route]));
  const files = (await fs.readdir(HTML_DIR))
    .filter((file) => file.endsWith(".html"))
    .sort((a, b) => a.localeCompare(b));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    locale: "ru-RU",
  });
  const page = await context.newPage();

  const results = [];

  try {
    for (const file of files) {
      const routeId = file.replace(/\.html$/i, "");
      const routeInfo = routeMap.get(routeId);
      if (!routeInfo) {
        continue;
      }

      const fullPath = path.join(HTML_DIR, file);
      const localUrl = `file://${fullPath}`;
      await page.goto(localUrl, { waitUntil: "domcontentloaded" });

      const clickables = await page.evaluate(() => {
        const selectors = [
          "a[href]",
          "button",
          "[role='button']",
          "input[type='button']",
          "input[type='submit']",
          ".ui-btn",
          ".main-buttons-item-link",
          ".menu-item-link",
        ];

        function isVisible(node) {
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        }

        function nodeText(node) {
          const text =
            node.getAttribute("aria-label") ||
            node.getAttribute("title") ||
            node.textContent ||
            "";
          return text.replace(/\s+/g, " ").trim();
        }

        const nodes = Array.from(document.querySelectorAll(selectors.join(",")));
        return nodes
          .filter((node) => isVisible(node))
          .map((node) => {
            const text = nodeText(node);
            const href = node.getAttribute("href");
            const dataset = node.dataset ? { ...node.dataset } : {};
            return {
              text,
              href: href || null,
              role: node.getAttribute("role") || null,
              className: node.className || "",
              tag: node.tagName.toLowerCase(),
              dataset,
            };
          })
          .filter((item) => item.text || item.href);
      });

      const dedup = new Map();
      for (const item of clickables) {
        const normalized = normalizeText(item.text);
        const key = [
          normalized,
          item.href || "",
          item.tag,
          item.className,
          JSON.stringify(item.dataset || {}),
        ].join("|");
        if (!dedup.has(key)) {
          dedup.set(key, { ...item, text: normalized });
        }
      }

      const clickList = Array.from(dedup.values()).slice(0, 400);
      const edges = clickList
        .map((item) => {
          const absoluteUrl = item.href
            ? new URL(item.href, routeInfo.currentUrl).toString()
            : null;
          return {
            source: routeId,
            label: item.text,
            url: absoluteUrl,
            targetRoute: classifyTarget(absoluteUrl, manifest.routes),
          };
        })
        .filter((edge) => edge.url);

      results.push({
        routeId,
        routeUrl: routeInfo.currentUrl,
        title: routeInfo.title,
        clickableCount: clickList.length,
        clickables: clickList,
        edges,
      });
    }

    await fs.writeFile(
      OUTPUT_PATH,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          sourceManifest: MANIFEST_PATH,
          routes: results,
        },
        null,
        2,
      ),
      "utf8",
    );
  } finally {
    await browser.close();
  }

  console.log(
    JSON.stringify(
      {
        outputPath: OUTPUT_PATH,
        routes: results.length,
        totalClickables: results.reduce((sum, item) => sum + item.clickableCount, 0),
        totalEdges: results.reduce((sum, item) => sum + item.edges.length, 0),
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
