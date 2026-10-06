// node scripts/lab/body-shots.mjs <base> <prefix> <w> <slug...>
// Scrolls each project file to the bottom (so lazy images load), then captures every figure in the write-up with
// the space around it, and logs each figure's box and the gap to its neighbours.
import { chromium } from "@playwright/test";

const [base, prefix, w, ...slugs] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: 900 } });
for (const slug of slugs) {
  await page.goto(`${base}/work/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
  for (let y = 0; y < 30; y++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  const figs = await page.evaluate(() =>
    [...document.querySelectorAll("article figure, .prose figure, main figure")].map((f) => {
      const r = f.getBoundingClientRect();
      const prev = f.previousElementSibling?.getBoundingClientRect();
      const next = f.nextElementSibling?.getBoundingClientRect();
      return { cls: f.className, y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), gapAbove: prev ? Math.round(r.top - prev.bottom) : null, gapBelow: next ? Math.round(next.top - r.bottom) : null };
    }),
  );
  console.log(slug, JSON.stringify(figs));
  for (const [k, f] of figs.entries()) {
    await page.evaluate((y) => scrollTo({ top: y - 200, behavior: "instant" }), f.y);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `review-shots/${prefix}-${slug}-fig${k}.png` });
  }
}
await browser.close();
