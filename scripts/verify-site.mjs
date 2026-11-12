import { chromium } from "../tools/three-export/node_modules/playwright-core/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = process.env.PORT || "3015";
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.resolve("tools/_verify_screenshots");

fs.mkdirSync(OUT_DIR, { recursive: true });

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server did not respond on ${url} within ${timeoutMs}ms`);
}

async function sampleCanvasNonEmpty(page, selector) {
  const loc = page.locator(selector).first();
  const box = await loc.boundingBox();
  if (!box || box.width === 0 || box.height === 0) {
    return { ok: false, reason: "zero-bounding-box" };
  }
  const pngBuffer = await page.screenshot({ clip: box });
  return { ok: pngBuffer.byteLength > 2000, bytes: pngBuffer.byteLength, box };
}

async function run() {
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", PORT],
    { stdio: "ignore" }
  );

  let browser;
  try {
    console.log("Waiting for Next.js production server...");
    await waitForServer(BASE_URL);
    console.log("Server ready on", BASE_URL);

    browser = await chromium.launch({
      headless: true,
      executablePath: findChromeExecutable(),
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
      ],
    });

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const glbRequests = [];

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      const url = res.url();
      if (url.endsWith(".glb")) glbRequests.push({ url, status: res.status() });
      if (res.status() >= 400 && !url.includes("favicon.ico")) {
        failedRequests.push({ url, status: res.status() });
      }
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('[data-testid="hero-3d-canvas"] canvas', { timeout: 20000 });
    await page.waitForTimeout(2600);

    const desktopMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const heroCanvasCheck = await sampleCanvasNonEmpty(
      page,
      '[data-testid="hero-3d-canvas"] canvas'
    );
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-hero.png") });
    console.log("Captured desktop-hero.png");

    await page.evaluate(() => {
      const el = document.getElementById("dum-craft");
      if (el) el.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-editorial.png") });

    const assemblyStartTop = await page.evaluate(() => {
      const el = document.getElementById("assembly");
      const rect = el ? el.getBoundingClientRect() : null;
      return window.scrollY + (rect ? rect.top : 0);
    });

    const stepSnapshots = [];
    for (const offset of [150, 960, 1600, 2240, 3120]) {
      await page.evaluate((y) => window.scrollTo(0, y), assemblyStartTop + offset);
      await page.waitForTimeout(750);
      const stepText = await page.locator("#assembly").innerText();
      const match = stepText.match(/STAGE\s+(\d+)\s+\/\s+05/);
      stepSnapshots.push({ offset, stage: match ? match[1] : "unknown" });
      if (offset === 1600) {
        await page.screenshot({ path: path.join(OUT_DIR, "desktop-assembly-mid.png") });
        console.log("Captured desktop-assembly-mid.png");
      }
      if (offset === 3120) {
        await page.screenshot({ path: path.join(OUT_DIR, "desktop-assembly-complete.png") });
        console.log("Captured desktop-assembly-complete.png");
      }
    }

    const assemblyCanvasCheck = await sampleCanvasNonEmpty(
      page,
      '[data-testid="assembly-3d-canvas"] canvas'
    );

    await page.evaluate(() => {
      document.getElementById("menu")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-menu.png") });

    await page.evaluate(() => {
      document.getElementById("philosophy")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-story.png") });

    await page.evaluate(() => {
      document.getElementById("community")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-community-top.png") });

    await page.evaluate(() => {
      document.getElementById("on-point")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-community-point.png") });

    await page.evaluate(() => {
      document.getElementById("tribe")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-community-tribe.png") });

    await page.evaluate(() => {
      document.getElementById("occasions")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-community-occasions.png") });

    await page.evaluate(() => {
      document.getElementById("welcome")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-community-welcome.png") });

    await page.evaluate(() => {
      document.getElementById("hours")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT_DIR, "desktop-footer.png") });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const tabletOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    await page.screenshot({ path: path.join(OUT_DIR, "mobile-hero.png") });
    console.log("Captured mobile-hero.png");

    await context.close();

    // Reduced-motion check
    const reducedCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedCtx.newPage();
    await reducedPage.goto(`${BASE_URL}#assembly`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await reducedPage.waitForSelector("#assembly", { timeout: 10000 });
    await reducedPage.waitForTimeout(1600);
    const reducedLabel = await reducedPage.locator("#assembly").innerText();
    const reducedMotionObserved = reducedLabel.includes("REDUCED MOTION");
    await reducedCtx.close();

    const summary = {
      desktopMetrics,
      tabletOverflow,
      mobileOverflow,
      heroCanvasCheck,
      assemblyCanvasCheck,
      stepSnapshots,
      reducedMotionObserved,
      glbRequestsCount: glbRequests.length,
      glbUrlsLoaded: [...new Set(glbRequests.map((g) => new URL(g.url).pathname))].sort(),
      failedRequests,
      consoleErrors,
      pageErrors,
    };
    console.log(JSON.stringify(summary, null, 2));

    if (
      desktopMetrics.scrollWidth > desktopMetrics.clientWidth ||
      tabletOverflow.scrollWidth > tabletOverflow.clientWidth ||
      mobileOverflow.scrollWidth > mobileOverflow.clientWidth ||
      !heroCanvasCheck.ok ||
      !assemblyCanvasCheck.ok ||
      !reducedMotionObserved ||
      failedRequests.length > 0 ||
      pageErrors.length > 0 ||
      consoleErrors.length > 0
    ) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
