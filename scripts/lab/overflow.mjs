// node scripts/lab/overflow.mjs <url> [width]  Lists the deepest elements that stick out past the right edge.
import { chromium } from "@playwright/test";

const [url, w = "320"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
const out = await page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  return [...document.querySelectorAll("body *")]
    .filter((el) => el.getBoundingClientRect().right > W + 1 && ![...el.children].some((c) => c.getBoundingClientRect().right > W + 1))
    .slice(0, 12)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(el.getBoundingClientRect().right)} "${(el.textContent ?? "").trim().slice(0, 40)}"`);
});
console.log(out.join("\n") || "none");
await browser.close();
