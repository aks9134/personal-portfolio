// node scripts/lab/err-probe2.mjs <url>  Loads a page in a 1x1 window, waits, then opens it to 800x455 (a pane that
// starts hidden), and reports page errors with stacks.
import { chromium } from "@playwright/test";

const [url] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: 1, height: 1 }, deviceScaleFactor: 1.25 });
const errs = [];
page.on("pageerror", (e) => errs.push(e.stack ?? e.message));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
console.log("errors while tiny:", errs.length);
await page.setViewportSize({ width: 800, height: 455 });
await page.waitForTimeout(5000);
console.log("errors after opening:", errs.length);
if (errs[0]) console.log(errs[0].split("\n").slice(0, 6).join("\n"));
await browser.close();
