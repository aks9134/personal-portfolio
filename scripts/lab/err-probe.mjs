// node scripts/lab/err-probe.mjs <url> [angle]  Page errors with their stacks, with a chosen WebGL backend
// (angle: d3d11, swiftshader, gl, or none for the default).
import { chromium } from "@playwright/test";

const [url, angle = "none"] = process.argv.slice(2);
const args = angle === "none" ? [] : angle === "swiftshader" ? ["--use-gl=angle", "--use-angle=swiftshader"] : [`--use-angle=${angle}`];
const browser = await chromium.launch({ args, channel: process.env.CH || undefined });
const page = await browser.newPage({ viewport: { width: 800, height: 455 }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
const errs = [];
page.on("pageerror", (e) => errs.push(e.stack ?? e.message));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(6000);
console.log(angle, "errors:", errs.length);
if (errs[0]) console.log(errs[0].split("\n").slice(0, 8).join("\n"));
console.log(await page.evaluate(() => {
  const c = document.createElement("canvas").getContext("webgl2");
  return c ? `${c.getParameter(c.VERSION)} | ${c.getExtension("WEBGL_debug_renderer_info") ? c.getParameter(c.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL) : "?"}` : "no webgl2";
}));
await browser.close();
