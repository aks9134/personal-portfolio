// node scripts/lab/lab-b-extras.mjs [base]  Lab B extras: keys 1-4 land on their target; typing in the palette does
// not jump; the Apart readout climbs through the geared module; with reduced motion the canvas holds still while the
// same page with motion allowed keeps moving (the positive twin).
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3300";
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const open = async (reducedMotion) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForFunction(() => document.querySelector(".lc-dot.is-on"), null, { timeout: 120000 });
  await page.waitForTimeout(1200);
  return page;
};
const title = (page) => page.evaluate(() => document.querySelector(".lc-title .sr-only")?.textContent);
let fails = 0;
const check = (ok, label) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) fails++;
};

const page = await open("no-preference");
for (const [key, name] of [["3", "Micro-vibration canceller"], ["4", "Linear harmonic drive"], ["1", "Robotic hand"], ["2", "Geared module"]]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(2300);
  const t = await title(page);
  check(t === name, `key ${key} lands on ${name} (HUD: ${t})`);
}
const apart = [];
await page.mouse.move(720, 450);
for (let k = 0; k < 8; k++) {
  await page.mouse.wheel(0, 220);
  await page.waitForTimeout(450);
  apart.push(await page.evaluate(() => document.querySelector(".lc-apart b")?.textContent ?? ""));
}
// Readings in mm while the geared module is on screen (a "%" reading means the next target, the canceller, took over).
const mm = apart.filter((s) => s.endsWith("mm")).map((s) => parseInt(s, 10));
check(mm.length >= 3 && mm.every((n, i) => i === 0 || n >= mm[i - 1]) && Math.max(...mm) >= 150 && Math.max(...mm) <= 213, `Apart climbs through the geared module: ${apart.join(", ")}`);
const before = await title(page);
await page.keyboard.press("Control+k");
await page.waitForTimeout(400);
const dialog = await page.evaluate(() => !!document.querySelector("dialog[open]"));
await page.keyboard.type("1");
await page.waitForTimeout(1500);
check(dialog && (await title(page)) === before, `typing 1 in the open palette does not jump (palette open: ${dialog}, stayed on ${before})`);
await page.keyboard.press("Escape");

const still = async (p) => {
  await p.mouse.move(300, 300);
  const a = await p.screenshot();
  await p.mouse.move(1100, 600);
  await p.waitForTimeout(1200);
  const b = await p.screenshot();
  return a.equals(b);
};
check(!(await still(page)), "motion allowed: the canvas moves on its own (twin)");
const reduced = await open("reduce");
check(await still(reduced), "reduced motion: the canvas holds still");
// The geared module's project file rests assembled under reduced motion, and comes apart with scroll when allowed.
const apartOn = async (p) => {
  await p.goto(`${base}/work/gravity-storage-drive`, { waitUntil: "networkidle", timeout: 120000 });
  await p.waitForTimeout(3500);
  await p.mouse.move(720, 450);
  for (let k = 0; k < 6; k++) {
    await p.mouse.wheel(0, 300);
    await p.waitForTimeout(250);
  }
  await p.waitForTimeout(1500);
  return p.evaluate(() => document.querySelector(".lc-apart b")?.textContent);
};
const restRed = await apartOn(reduced);
check(restRed === "000 mm", `reduced motion: the project file's geared module rests assembled (${restRed})`);
const restOn = await apartOn(page);
check(parseInt(restOn, 10) > 0, `motion allowed: scrolling the project file takes it apart (${restOn}) (twin)`);
await browser.close();
process.exit(fails ? 1 : 0);
