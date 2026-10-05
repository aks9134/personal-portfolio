// node scripts/lab/perf-hitch.mjs <url>  Like perf-scroll, but lists each hitch (frame over 33 ms) with the scroll
// fraction at that moment and any long tasks (main-thread work over 50 ms) around it.
import { chromium } from "@playwright/test";

const [url] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(6000);
await page.evaluate(() => {
  window.__hitch = [];
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: false });
  let last = performance.now();
  const loop = (t) => {
    const d = t - last;
    last = t;
    if (d > 33) window.__hitch.push([Math.round(t), Math.round(d), +(scrollY / (document.documentElement.scrollHeight - innerHeight)).toFixed(3)]);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.mouse.move(720, 450);
for (let i = 0; i < 90; i++) {
  await page.mouse.wheel(0, 140);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(800);
console.log("hitches [t, ms, scroll]:", JSON.stringify(await page.evaluate(() => window.__hitch)));
console.log("long tasks [t, ms]:", JSON.stringify(await page.evaluate(() => window.__long)));
await browser.close();
