// node scripts/lab/print-measure.mjs [url]  Height of the resume under print media at letter content width (7.4 in)
// against one page's content height (10.1 in), in CSS px at 96 dpi. Also saves a print-media capture.
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3300/resume";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(7.4 * 96), height: Math.round(10.1 * 96) } });
await page.emulateMedia({ media: "print" });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const h = await page.evaluate(() => document.querySelector("main").getBoundingClientRect().height);
console.log(`content ${Math.round(h)} px, page ${Math.round(10.1 * 96)} px, ${(h / (10.1 * 96)).toFixed(2)} pages`);
await page.screenshot({ path: "review-shots/resume-print.png", fullPage: true });
await browser.close();
