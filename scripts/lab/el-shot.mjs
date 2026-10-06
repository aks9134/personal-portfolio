// node scripts/lab/el-shot.mjs <url> <css selector> <out.png> [w] [h]  Captures one element (scrolled into view).
import { chromium } from "@playwright/test";

const [url, sel, out, w = "1440", h = "900"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
const el = page.locator(sel).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await el.screenshot({ path: out });
await browser.close();
