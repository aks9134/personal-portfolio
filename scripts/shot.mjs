// node scripts/shot.mjs <url> <selector|top> <out.png> [width] [height] [motion|reduce] [dark]
// One viewport capture with an element scrolled to the upper third, after scroll-driven motion settles.
// Review aid only; captures go to review-shots/ (gitignored).
import { chromium } from "@playwright/test";

const [url, sel = "top", out, w = "1440", h = "900", motion = "motion", scheme = "light"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
  colorScheme: scheme === "dark" ? "dark" : "light",
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 700) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 40));
  }
});
if (sel === "top") await page.evaluate(() => window.scrollTo(0, 0));
else await page.locator(sel).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.12));
await page.waitForTimeout(1600);
await page.evaluate(() => Promise.all([...document.images].map((i) => Promise.race([i.decode().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]))));
await page.screenshot({ path: out });
await browser.close();
console.log(out);
