// node scripts/lab/lab-b-index.mjs [base]  Lab B's Index link: a smooth glide (not a jump), never backwards, the
// scene held on its target the whole way, landing on the Index's top; a wheel turn mid-glide hands control back; under
// reduced motion it lands at once. Also captures the Console resume (1440, 390, print).
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3300";
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
let fails = 0;
const check = (ok, label) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) fails++;
};
const open = async (reducedMotion) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  const page = await ctx.newPage();
  await page.goto(`${base}/lab/b`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForFunction(() => document.querySelector(".lc-dot.is-on"), null, { timeout: 120000 });
  await page.waitForTimeout(1200);
  return page;
};
const record = (page) =>
  page.evaluate(() => {
    window.__s = [];
    const t0 = performance.now();
    const loop = () => {
      window.__s.push([performance.now() - t0, scrollY, document.querySelector(".lc-title .sr-only")?.textContent]);
      if (window.__s.length < 400) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
const atIndex = (page) => page.evaluate(() => Math.abs(document.getElementById("index").getBoundingClientRect().top) < 4);

const page = await open("no-preference");
await page.keyboard.press("2"); // start mid-run, on the geared module
await page.waitForTimeout(2300);
await record(page);
await page.evaluate(() => document.querySelector(".lc-top a[href=\"#index\"]").click()); // a direct click: the test tool would first scroll the link into view
await page.waitForTimeout(2200);
const s = await page.evaluate(() => window.__s);
const moving = s.filter((x, i) => i > 0 && x[1] !== s[i - 1][1]);
const span = moving.length ? moving.at(-1)[0] - moving[0][0] : 0;
const backs = s.map((x, i) => [i, x]).filter(([i, x]) => i > 0 && x[1] < s[i - 1][1] - 1);
if (backs.length) console.log("backward samples:", JSON.stringify(backs.slice(0, 5).map(([i, x]) => [i, Math.round(x[0]), Math.round(s[i - 1][1]), Math.round(x[1])])));
const back = backs.length > 0;
const titles = [...new Set(s.filter((x) => x[1] < s.at(-1)[1] - 2).map((x) => x[2]))];
check(span > 600, `glides rather than jumps (${Math.round(span)} ms of movement over ${moving.length} frames)`);
check(!back, "never moves backwards");
check(titles.length === 1, `scene held on one target during the glide (${titles.join(", ")})`);
check(await atIndex(page), "lands on the Index's top");

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(800);
await page.keyboard.press("2");
await page.waitForTimeout(2300);
await page.evaluate(() => document.querySelector(".lc-top a[href=\"#index\"]").click()); // a direct click: the test tool would first scroll the link into view
await page.waitForTimeout(250);
await page.mouse.move(720, 450);
await page.mouse.wheel(0, -400);
await page.waitForTimeout(1800);
check(!(await atIndex(page)), "a wheel turn mid-glide hands control back (did not finish at the Index)");

const reduced = await open("reduce");
await reduced.evaluate(() => document.querySelector(".lc-top a[href=\"#index\"]").click());
await reduced.waitForTimeout(150);
check(await atIndex(reduced), "reduced motion: lands on the Index at once");

const r = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  await r.setViewportSize({ width: w, height: h });
  await r.goto(`${base}/lab/b/resume`, { waitUntil: "networkidle" });
  await r.waitForTimeout(500);
  await r.screenshot({ path: `review-shots/resume-${w}.png`, fullPage: true });
}
await r.emulateMedia({ media: "print" });
await r.setViewportSize({ width: 816, height: 1056 });
await r.screenshot({ path: "review-shots/resume-print.png", fullPage: true });
const links = await r.evaluate(() => [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")));
for (const l of links) check((await r.request.get(base + l)).status() === 200, `resume link ${l} answers 200`);
await browser.close();
process.exit(fails ? 1 : 0);
