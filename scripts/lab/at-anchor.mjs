// node scripts/lab/at-anchor.mjs <base> <prefix> <path#anchor> <WxH...>
// Captures one spot of a page (scrolled to an element id) at each screen size, and logs the gap between the reading
// column's right edge and the section index, plus the outer margins.
import { chromium } from "@playwright/test";

const [base, prefix, target, ...sizes] = process.argv.slice(2);
const [path, anchor] = target.split("#");
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(base + path, { waitUntil: "networkidle" });
  if (anchor) await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" }), anchor);
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const art = document.querySelector(".case-body, .lc-pg, .lcr-wrap");
    const p = document.querySelector(".case-body > p, .lcr-text, .lc-prose p");
    const nav = document.querySelector('nav[aria-label="Sections"]');
    const r = (e) => (e ? e.getBoundingClientRect() : null);
    const a = r(art), t = r(p), n = r(nav);
    return { left: a && Math.round(a.left), textRight: t && Math.round(t.right), navLeft: n && n.width ? Math.round(n.left) : null, rightMargin: Math.round(innerWidth - (n && n.width ? n.right : a.right)) };
  });
  console.log(size, JSON.stringify(m), m.navLeft ? `gap text-to-index ${m.navLeft - m.textRight}px` : "");
  await page.screenshot({ path: `review-shots/${prefix}-${w}.png` });
  await page.close();
}
await browser.close();
