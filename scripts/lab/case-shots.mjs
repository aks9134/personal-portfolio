// node scripts/lab/case-shots.mjs [base] [w] [h] [slugs...]  Lab B project files: captures the opener (top and mid-run),
// the write-up and the end of each page; reports console errors and internal links that do not answer 200.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [base = "http://localhost:3300", w = "1440", h = "900", ...only] = process.argv.slice(2);
const slugs = only.length ? only : fs.readdirSync("content/work").filter((s) => fs.existsSync(`content/work/${s}/index.mdx`));
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
const checked = new Map();
for (const slug of slugs) {
  errors.length = 0;
  await page.goto(`${base}/work/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);
  const tag = `case-${w}-${slug}`;
  await page.screenshot({ path: `review-shots/${tag}-0.png` });
  const run = await page.evaluate(() => document.querySelector(".lcs-run")?.offsetHeight ?? 0);
  if (run > +h) {
    for (const [k, frac] of [[1, 0.35], [2, 0.75]]) {
      await page.mouse.wheel(0, (run - +h) * frac - (await page.evaluate(() => scrollY)));
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `review-shots/${tag}-${k}.png` });
    }
  }
  await page.evaluate(() => document.querySelector(".lcc-wrap")?.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `review-shots/${tag}-3.png` });
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `review-shots/${tag}-4.png` });
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
  const bad = [];
  for (const href of links) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.split("#")[0] || `/work/${slug}`;
    if (!checked.has(path)) checked.set(path, (await page.request.get(base + path)).status());
    if (checked.get(path) !== 200) bad.push(`${href} ${checked.get(path)}`);
    const id = href.split("#")[1];
    if (id && path === `/work/${slug}` && !(await page.evaluate((i) => !!document.getElementById(i), id))) bad.push(`${href} (no #${id})`);
  }
  console.log(`${slug}: errors ${errors.length}${errors.length ? ` [${errors.slice(0, 2).join(" | ")}]` : ""}; bad links ${bad.length}${bad.length ? ` [${bad.join(", ")}]` : ""}`);
}
await browser.close();
