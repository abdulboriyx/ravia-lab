import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright";

const outDir = resolve("out");
const port = Number(process.env.SPATIAL_RAVIA_SMOKE_PORT ?? 4177);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;

const routes = [
  {
    name: "Transcription",
    prompt: "Show transcription.",
    selector: ".dnaForkCanvas svg",
    expectedTitle: "Eukaryotic transcription"
  },
  {
    name: "Two-body orbit",
    prompt: "Show Earth orbit.",
    selector: ".orbitSpatialView canvas",
    expectedTitle: "Two-body orbit"
  }
];

const viewports = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 }
];

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", baseUrl);
  const filePath = pathForRequest(url.pathname);

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(contents);
  } catch {
    const fallback = join(outDir, "404.html");
    try {
      const contents = await readFile(fallback);
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end(contents);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }
});

server.listen(port, host, async () => {
  const browser = await chromium.launch();
  const failures: string[] = [];

  try {
    for (const viewport of viewports) {
      for (const route of routes) {
        const page = await browser.newPage({ viewport });
        const consoleErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") {
            consoleErrors.push(message.text());
          }
        });

        await page.goto(`${baseUrl}/code/spatial-ravia/`, { waitUntil: "networkidle" });
        await page.locator("#initial-science-prompt").fill(route.prompt);
        await page.locator(".primaryAction").click();
        await page.waitForSelector(route.selector, { timeout: 15_000 });
        await page.waitForTimeout(500);

        const metrics = await page.evaluate((selector) => {
          const primary = document.querySelector(selector);
          const box = primary?.getBoundingClientRect();
          const toolbar = document.querySelector(".canvasToolbar")?.getBoundingClientRect();
          const title = document.querySelector(".workspaceTop h1")?.textContent ?? "";

          return {
            title,
            primary: box
              ? {
                  width: box.width,
                  height: box.height,
                  left: box.left,
                  right: box.right
                }
              : null,
            noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
            controlsReachable: Boolean(toolbar && toolbar.top < window.innerHeight && toolbar.bottom > 0)
          };
        }, route.selector);

        if (consoleErrors.length > 0) {
          failures.push(`${route.name} ${viewport.width}x${viewport.height} console errors: ${consoleErrors.join("; ")}`);
        }

        if (metrics.title !== route.expectedTitle) {
          failures.push(`${route.name} ${viewport.width}x${viewport.height} title was "${metrics.title}".`);
        }

        if (!metrics.primary || metrics.primary.width < 360 || metrics.primary.height < 420) {
          failures.push(`${route.name} ${viewport.width}x${viewport.height} primary scene is too small.`);
        }

        if (!metrics.noHorizontalOverflow) {
          failures.push(`${route.name} ${viewport.width}x${viewport.height} has horizontal overflow.`);
        }

        if (!metrics.controlsReachable) {
          failures.push(`${route.name} ${viewport.width}x${viewport.height} controls were not reachable.`);
        }

        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Spatial RAVIA static smoke checks passed.");
});

function pathForRequest(pathname: string) {
  const normalizedPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(outDir, normalizedPath);

  if (pathname.endsWith("/")) {
    return join(candidate, "index.html");
  }

  if (!extname(candidate)) {
    return join(candidate, "index.html");
  }

  return candidate;
}

function contentType(filePath: string) {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}
