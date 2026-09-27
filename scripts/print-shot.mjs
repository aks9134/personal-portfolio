// node scripts/print-shot.mjs [route=/resume]  Renders a page in print media to review-shots/print-<route>.png,
// from the production build (starts its own next start on 3108), so the resume PDF can be looked at as an image.
import { execSync, spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const route = process.argv[2] ?? "/resume";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3108"], { stdio: "ignore" });
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch("http://localhost:3108" + route)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
  await page.emulateMedia({ media: "print" });
  await page.goto("http://localhost:3108" + route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const file = `review-shots/print${route.replaceAll("/", "-")}.png`;
  await page.screenshot({ path: file, fullPage: true });
  await browser.close();
  console.log(file);
} finally {
  execSync(process.platform === "win32" ? `taskkill /PID ${server.pid} /T /F` : `kill ${server.pid}`, { stdio: "ignore" });
}
