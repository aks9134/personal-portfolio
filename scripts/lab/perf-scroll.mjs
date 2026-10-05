// node scripts/lab/perf-scroll.mjs <url> [label]  Scrolls a page with real wheel steps (headed GPU Chromium) and
// reports frame intervals: median, p95, and frames over 33 ms (a visible hitch).
import { chromium } from "@playwright/test";

const [url, label = "run"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(6000);
await page.evaluate(() => {
  window.__frames = [];
  let last = performance.now();
  const loop = (t) => {
    window.__frames.push(t - last);
    last = t;
    if (window.__frames.length < 100000) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.mouse.move(720, 450);
for (let i = 0; i < 90; i++) {
  await page.mouse.wheel(0, 140);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(800);
const f = await page.evaluate(() => window.__frames.slice(2));
const s = [...f].sort((a, b) => a - b);
const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
console.log(`${label}: frames ${f.length}, median ${q(0.5).toFixed(1)} ms, p95 ${q(0.95).toFixed(1)} ms, max ${s[s.length - 1].toFixed(0)} ms, >33ms ${f.filter((x) => x > 33).length}`);
await browser.close();
