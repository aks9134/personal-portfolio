// node scripts/lab/overflow2.mjs <url>  The smoke test's sequence (widths 320 to 1440 in one page), overflow per width,
// and at any overflowing width the elements that stick out (right edge past the viewport, or wider than it).
import { chromium } from "@playwright/test";

const [url] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const w of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(url);
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const over = document.documentElement.scrollWidth - W;
    const els = over > 1 ? [...document.querySelectorAll("body *")].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === "visible" || el.getBoundingClientRect().right > W + 1).slice(-6).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} r=${Math.round(el.getBoundingClientRect().right)} sw=${el.scrollWidth} cw=${el.clientWidth}`) : [];
    return { over, els };
  });
  console.log(w, r.over, r.els.join(" | "));
}
await browser.close();
