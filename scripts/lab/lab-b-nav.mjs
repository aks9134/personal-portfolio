// node scripts/lab/lab-b-nav.mjs <base>  Checks lab B's navigation: a clicked target lands on that target, solid, with
// no hitches; Index lands on the index without hitches; the geared module explode holds across scroll. Saves captures.
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3300";
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForFunction(() => document.querySelector(".lc-dot.is-on"), null, { timeout: 120000 });
await page.waitForTimeout(1500);
const watch = () =>
  page.evaluate(() => {
    window.__f = [];
    let last = performance.now();
    window.__stop = false;
    const loop = (t) => {
      window.__f.push(t - last);
      last = t;
      if (!window.__stop) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
const report = async (label) => {
  const f = await page.evaluate(() => ((window.__stop = true), window.__f.slice(2)));
  const hud = await page.evaluate(() => `${document.querySelector(".lc-title")?.textContent} / ${document.querySelector(".lc-scan span")?.textContent}`);
  console.log(`${label}: frames ${f.length}, worst ${Math.max(...f).toFixed(0)} ms, over 33 ms ${f.filter((x) => x > 33).length}; HUD: ${hud}`);
};

await watch();
await page.getByRole("button", { name: /Micro-vibration canceller/ }).click();
await page.waitForTimeout(2200);
await report("click target 03");
await page.screenshot({ path: "review-shots/lbn-target3.png" });

await watch();
await page.getByRole("button", { name: /Geared module/ }).click();
await page.waitForTimeout(2200);
await report("click target 02");

// Step through the Terrament segment with the wheel and sample the explode hold.
for (let k = 0; k < 8; k++) {
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(450);
  await page.screenshot({ path: `review-shots/lbn-drive-${k}.png` });
}

await watch();
await page.getByRole("link", { name: "Index" }).click();
await page.waitForTimeout(1200);
await report("click Index");
console.log("at index:", await page.evaluate(() => Math.abs(document.getElementById("index").getBoundingClientRect().top) < 4));
await browser.close();
