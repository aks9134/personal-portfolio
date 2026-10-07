// node scripts/lab/touch-laptop.mjs [url]  A wide touchscreen laptop: loads the page with touch on and no interaction,
// then reports what the browser says about its pointer and whether the console started on its own.
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3210/";
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 1440, height: 900 }, screen: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
console.log(await page.evaluate(() => ({ coarse: matchMedia("(pointer: coarse)").matches, status: document.querySelector(".lc-status")?.textContent?.trim(), tele: document.querySelector(".lc-tele dd")?.textContent })));
await page.screenshot({ path: "review-shots/touch-laptop.png" });
await browser.close();
