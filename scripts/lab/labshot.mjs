// node scripts/lab/labshot.mjs <url> <name> <fractions comma list> [w=1440] [h=900] [wait ms=1800]
// Live WebGL captures of a lab page at scroll fractions of the whole document, with console errors.
import { chromium } from "@playwright/test";

const [url, name, at = "0", w = "1440", h = "900", wait = "1800"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror " + e.message));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(m.type() + " " + m.text().slice(0, 300)));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(4000);
for (const f of at.split(",").map(Number)) {
  await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f);
  await page.waitForTimeout(+wait);
  const file = `review-shots/${name}-${String(f).replace(".", "_")}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].join("\n"));
await browser.close();
