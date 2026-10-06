// node scripts/lab/arrival-probe.mjs <url> <prefix> [w=1440] [h=900]
// Captures a page with a scene at fixed times after load, then after a scroll down and a scroll back to the top,
// and logs when the scene's status went live and the worst frame in the first seconds.
import { chromium } from "@playwright/test";

const [url, prefix, w = "1440", h = "900"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.addInitScript(() => {
  window.__f = [];
  let last = performance.now();
  const loop = (t) => (window.__f.push([Math.round(t), Math.round(t - last)]), (last = t), requestAnimationFrame(loop));
  requestAnimationFrame(loop);
});
const t0 = Date.now();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
for (const ms of [300, 900, 1600, 2600, 4000]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
  await page.screenshot({ path: `review-shots/${prefix}-t${ms}.png` });
}
const f = await page.evaluate(() => window.__f.filter(([, d]) => d > 50));
console.log(`${prefix}: frames over 50 ms in the first 4 s:`, JSON.stringify(f));
await page.mouse.move(+w / 2, +h / 2);
for (let k = 0; k < 6; k++) {
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
}
await page.waitForTimeout(800);
await page.screenshot({ path: `review-shots/${prefix}-down.png` });
for (let k = 0; k < 10; k++) {
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(150);
}
await page.waitForTimeout(1500);
console.log("scrollY after return:", await page.evaluate(() => scrollY));
await page.screenshot({ path: `review-shots/${prefix}-back.png` });
await browser.close();
