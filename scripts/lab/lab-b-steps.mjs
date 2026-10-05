// node scripts/lab/lab-b-steps.mjs <target name> <prefix> [steps=10] [px=200] [w=1440] [h=900]
// LAB_URL overrides the page (default http://localhost:3300/lab/b).
// Clicks a target, then wheels through its segment, capturing each step and logging frame hitches.
import { chromium } from "@playwright/test";

const [name, prefix, steps = "10", px = "200", w = "1440", h = "900"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(process.env.LAB_URL ?? "http://localhost:3300/lab/b", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForFunction(() => document.querySelector(".lc-dot.is-on"), null, { timeout: 120000 });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  window.__f = [];
  let last = performance.now();
  const loop = (t) => (window.__f.push(t - last), (last = t), requestAnimationFrame(loop));
  requestAnimationFrame(loop);
});
const target = page.locator(".lc-targets button", { hasText: name });
if (await target.isVisible()) await target.click();
else await page.evaluate((n) => [...document.querySelectorAll(".lc-targets button")].find((b) => b.textContent.includes(n))?.click(), name);
await page.waitForTimeout(1900);
await page.mouse.move(+w / 2, +h / 2);
for (let k = 0; k < +steps; k++) {
  await page.screenshot({ path: `review-shots/${prefix}-${k}.png` });
  await page.mouse.wheel(0, +px);
  await page.waitForTimeout(500);
}
const f = await page.evaluate(() => window.__f.slice(2));
console.log(`${prefix}: worst ${Math.max(...f).toFixed(0)} ms, over 33 ms ${f.filter((x) => x > 33).length} of ${f.length}`);
await browser.close();
