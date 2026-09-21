// node scripts/review-shots.mjs <baseUrl> <route> [route...]
// Review captures that show what a visitor actually sees: scrolls first so lazy images load,
// settles motion, then writes full pages and 1440x1600 slices to test-results/review/pages/.
import fs from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [base, ...routes] = process.argv.slice(2);
const out = "test-results/review/pages";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

for (const [width, height] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    const name = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
    const file = `${out}/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    if (width === 1440) {
      const { height: h } = await sharp(file).metadata();
      for (let i = 0, top = 0; top < h; i++, top += 1600) {
        await sharp(file).extract({ left: 0, top, width, height: Math.min(1600, h - top) }).toFile(`${out}/${name}-${width}-part${i + 1}.png`);
      }
    }
    console.log(file);
  }
  await page.close();
}
await browser.close();
