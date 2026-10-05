// node scripts/render-teardown.mjs <base-url> [shot names...] [--frames N] [--test]
// Renders the lab C image sequences from the real CAD through /lab/render (needs the dev or production server).
// Output: public/lab/teardown/<name>/<NNN>.webp plus manifest.json (frame count, size). --test renders 3 frames.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const base = args[0];
const test = args.includes("--test");
const fi = args.indexOf("--frames");
const FRAMES = fi > 0 ? +args[fi + 1] : 72;
const media = (slug) => JSON.parse(fs.readFileSync(`content/work/${slug}/media.generated.json`, "utf8"));
const drive = media("gravity-storage-drive");
const arm = media("robotic-arm");

// Shots: the camera turns while the parts come apart. Angles in degrees.
const SHOTS = {
  drive: { src: drive["geared-module"].src, finish: "anodized", size: 2.4, lift: 0.0, theta: [-30, 34], phi: [14, 24], dist: [5.2, 8.6], explode: [0, 1], look: 0.55 },
  hand: { src: arm["hand-model"].src, finish: "aluminium", size: 2.2, lift: 0.0, theta: [200, 335], phi: [18, 28], dist: [4.6, 6.0], explode: [0, 0.65], spread: 0.55, look: 0.55 },
  harmonic: { src: drive["harmonic-drive"].src, finish: "anodized", size: 1.9, lift: 0.12, theta: [20, 160], phi: [10, 22], dist: [5.6, 6.8], explode: [0, 0.55], spread: 0.45, look: 1.0 },
};
const names = args.slice(1).filter((a) => SHOTS[a]);
const [W, H] = [1600, 1000];

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const name of names.length ? names : Object.keys(SHOTS)) {
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.addInitScript(([shot, size]) => {
    window.__shot = shot;
    window.__size = size;
  }, [SHOTS[name], [W, H]]);
  await page.goto(`${base}/lab/render`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const dir = path.join("public/lab/teardown", name);
  fs.mkdirSync(dir, { recursive: true });
  const n = test ? 3 : FRAMES;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const url = await page.evaluate((t) => window.__frame(t), t);
    const buf = Buffer.from(url.split(",")[1], "base64");
    await sharp(buf).webp({ quality: 74, effort: 5 }).toFile(path.join(dir, `${String(i).padStart(3, "0")}.webp`));
    if (i % 12 === 0) console.log(name, i, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ frames: n, width: W, height: H }));
  await page.close();
}
await browser.close();
