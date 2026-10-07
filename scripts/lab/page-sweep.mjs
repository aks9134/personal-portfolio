// node scripts/lab/page-sweep.mjs <base> <outDir> [w=1440] [h=900] [paths...]
// Every page, screen by screen: the opener (top and partway into a pinned run), then the rest of the page in steps
// of 85% of a screen. Writes captures and one metrics file per page: text blocks (font, size, line height, measure in
// characters), media (shown vs natural size, upscaling, cut off), and the vertical gap between neighbouring blocks.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [base, out, w = "1440", h = "900", ...only] = process.argv.slice(2);
const slugs = fs.readdirSync("content/work").filter((s) => fs.existsSync(`content/work/${s}/index.mdx`));
const paths = only.length ? only : ["/", "/about", "/privacy", "/resume", "/no-such-page", ...slugs.map((s) => `/work/${s}`)];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, hasTouch: +w < 600, isMobile: +w < 600, deviceScaleFactor: 1 });
for (const path of paths) {
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1500);
  const name = (path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_")) + `-${w}`;
  // Load lazy media: walk the page once.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) await page.evaluate((t) => scrollTo({ top: t, behavior: "instant" }), y);
  await page.waitForTimeout(800);
  const run = await page.evaluate(() => {
    const el = document.querySelector(".lcs-run") ?? document.querySelector("main > div");
    if (!el || el.offsetHeight < innerHeight * 1.5) return null;
    return { top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight };
  });
  const stops = [0];
  let y = 0;
  if (run) {
    stops.push(Math.round(run.top + (run.h - +h) * 0.45));
    y = run.top + run.h - +h;
  }
  for (y += Math.round(+h * 0.85); y < height; y += Math.round(+h * 0.85)) stops.push(y);
  for (const [k, t] of stops.entries()) {
    await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), t);
    await page.waitForTimeout(k === 1 && run ? 1600 : 350);
    await page.screenshot({ path: `${out}/${name}-${String(k).padStart(2, "0")}.png` });
  }
  const metrics = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const text = [...document.querySelectorAll("main p, main li, main h1, main h2, main h3, main figcaption, main dd, main dt, footer p")]
      .filter((e) => e.offsetParent && e.textContent.trim().length > 20)
      .map((e) => {
        const s = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const fs = parseFloat(s.fontSize);
        return { tag: e.tagName, cls: e.className?.toString().slice(0, 60), text: e.textContent.trim().slice(0, 50), font: s.fontFamily.split(",")[0], size: fs, lh: +(parseFloat(s.lineHeight) / fs).toFixed(2), width: Math.round(r.width), measure: Math.round(r.width / (fs * 0.5)), left: Math.round(r.left) };
      });
    const media = [...document.querySelectorAll("main img, main video")]
      .filter((e) => e.offsetParent)
      .map((e) => {
        const r = e.getBoundingClientRect();
        const nw = e.naturalWidth || e.videoWidth || 0;
        return { src: (e.currentSrc || e.getAttribute("src") || "").split("/").slice(-2).join("/"), shown: [Math.round(r.width), Math.round(r.height)], natural: nw, upscale: nw ? +(r.width * devicePixelRatio / nw).toFixed(2) : null, left: Math.round(r.left), cut: r.right > vw + 1 };
      });
    const blocks = [...document.querySelectorAll("main article > *, main .prose > *, main section > *")].filter((e) => e.offsetParent);
    const gaps = blocks.slice(1).map((e, i) => {
      const a = blocks[i].getBoundingClientRect();
      const b = e.getBoundingClientRect();
      return { from: blocks[i].tagName + "." + (blocks[i].className?.toString().split(" ")[0] ?? ""), to: e.tagName + "." + (e.className?.toString().split(" ")[0] ?? ""), gap: Math.round(b.top - a.bottom) };
    }).filter((g) => g.gap > -1 && g.gap < 400);
    return { vw, overflow: document.documentElement.scrollWidth - vw, text, media, gaps };
  });
  fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(metrics, null, 1));
  console.log(name, stops.length, "captures, overflow", metrics.overflow);
  await page.close();
}
await browser.close();
