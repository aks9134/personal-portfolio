// node scripts/shoot.mjs <url> <name> [width=1440] [height=900] [scroll fractions, comma list, default 0]
// Viewport captures of a live WebGL page at given scroll positions (motion allowed), into review-shots/.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const [url, name, w = "1440", h = "900", at = "0", scheme = "dark"] = process.argv.slice(2);
fs.mkdirSync("review-shots", { recursive: true });
const gl = process.env.GL ?? "d3d11";
const browser = await chromium.launch({ args: [`--use-angle=${gl}`, "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, colorScheme: scheme });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
for (const f of at.split(",").map(Number)) {
  await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f);
  await page.waitForTimeout(1600);
  const file = `review-shots/${name}-${w}-${String(f).replace(".", "_")}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
