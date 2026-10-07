// npm run og -- [base]   (with the site running, default http://localhost:3210; after npm run media, whenever a hero
// image, a title or the design changes)
// Link-preview images, 1200x630 JPG (LinkedIn and others don't reliably show WebP), in the v5 Console look: the floor,
// corner ticks, the name and the file number as instrument labels, the project title in the wide display face, and the
// hero image resolved behind the orange scan line, set the way the site sets images (media-image.tsx): cut-outs on the
// floor, ink drawings inverted, "sheet" images on the dimmed plate, photos in a hairline frame. The home card carries
// the name and role beside the capstone's 3D render, on the bare floor. Cards are drawn by the site's own page (so its own fonts) in a
// headless browser. Names carry a content hash, because link previews cache by URL.
// Writes public/og/<name>.<hash>.jpg and src/lib/og.generated.json, which the page metadata reads.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3210";
const out = "public/og";
fs.mkdirSync(out, { recursive: true });
const field = (src, key) => new RegExp(`${key}:\\s*"([^"]+)"`).exec(src)?.[1];

async function workOf(slug) {
  const mdx = fs.readFileSync(path.join("content/work", slug, "index.mdx"), "utf8");
  const media = JSON.parse(fs.readFileSync(path.join("content/work", slug, "media.generated.json"), "utf8"));
  const m = media[field(mdx, "hero")];
  const still = { ...m, src: m.poster ?? m.src };
  return {
    slug,
    order: Number(/order:\s*(\d+)/.exec(mdx)[1]),
    title: field(mdx, "title"),
    eyebrow: `${field(mdx, "context")}, ${field(mdx, "year")}`,
    still: { ...still, cut: !(await sharp(path.join("public", still.src)).stats()).isOpaque }, // posters carry no alpha flag
  };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function cardHtml({ code, eyebrow, title, image, big }) {
  const ground = image.cut ? (image.ground === "sheet" ? "plate" : "") : "framed";
  return `
  <div class="og">
    <i class="t tl"></i><i class="t tr"></i><i class="t bl"></i><i class="t br"></i>
    <header><div><b>Allen Sun</b><span>Mechanical design engineer</span></div><p><em></em>${esc(code)}</p></header>
    <div class="text">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <h1 class="${big ? "big" : ""}">${esc(title)}</h1>
    </div>
    <figure class="${ground}"><img src="${esc(image.src)}" class="${image.cut && image.ground === "ink" ? "ink" : ""}" alt=""><i class="scan"></i></figure>
  </div>`;
}
const css = `
  html, body { margin: 0; background: #05070a; }
  .og { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #05070a; color: #d7e2ea;
        font-family: var(--lc-mono), monospace; display: grid; grid-template-columns: 500px 1fr; }
  .t { position: absolute; width: 22px; height: 22px; border: 0 solid rgba(215, 226, 234, 0.5); }
  .tl { left: 18px; top: 18px; border-left-width: 1px; border-top-width: 1px; }
  .tr { right: 18px; top: 18px; border-right-width: 1px; border-top-width: 1px; }
  .bl { left: 18px; bottom: 18px; border-left-width: 1px; border-bottom-width: 1px; }
  .br { right: 18px; bottom: 18px; border-right-width: 1px; border-bottom-width: 1px; }
  header { position: absolute; left: 48px; right: 48px; top: 40px; display: flex; justify-content: space-between; align-items: start; }
  header b { display: block; font-weight: 700; font-size: 17px; letter-spacing: 0.14em; text-transform: uppercase; font-variation-settings: "wdth" 112; }
  header span, header p, .eyebrow { color: #6c7d89; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
  header span { display: block; margin-top: 6px; }
  header p { margin: 0; display: flex; align-items: center; gap: 10px; }
  header em { width: 9px; height: 9px; background: #ff6a2b; box-shadow: 0 0 12px #ff6a2b; }
  .text { grid-column: 1; align-self: end; padding: 0 0 52px 48px; }
  .eyebrow { margin: 0 0 14px; }
  h1 { margin: 0; font-size: 54px; line-height: 1.02; font-weight: 800; text-transform: uppercase; font-variation-settings: "wdth" 118; text-wrap: balance; }
  h1.big { font-size: 76px; }
  figure { grid-column: 2; margin: 112px 56px 64px 24px; position: relative; display: flex; align-items: center; justify-content: center; min-height: 0; }
  figure img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  figure.framed img { border: 1px solid rgba(215, 226, 234, 0.14); }
  figure.plate img { background: #a3abb1; }
  .ink { filter: invert(1) hue-rotate(180deg); }
  .scan { position: absolute; left: -8px; right: -8px; bottom: -18px; height: 2px; background: #ff6a2b; box-shadow: 0 0 12px #ff6a2b; }
`;

const works = await Promise.all(fs.readdirSync("content/work").filter((s) => fs.existsSync(path.join("content/work", s, "index.mdx"))).map(workOf));
works.sort((a, b) => a.order - b.order);
const pad = (n) => String(n).padStart(2, "0");
const cards = works.map((w, i) => ({ name: w.slug, code: `File ${pad(i + 1)} / ${pad(works.length)}`, eyebrow: w.eyebrow, title: w.title, image: w.still }));
cards.push({ name: "home", code: `Link live, ${works.length} files`, eyebrow: "", title: "Allen Sun", image: works[0].still, big: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const map = {};
for (const c of cards) {
  // The site's own page first, so its fonts and their variables are loaded; then the card replaces its body.
  await page.goto(`${base}/privacy`, { waitUntil: "networkidle" });
  await page.evaluate(([html, style]) => {
    document.body.innerHTML = html;
    document.body.className = "";
    const s = document.createElement("style");
    s.textContent = style;
    document.head.append(s);
  }, [cardHtml(c), css]);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family).join(", ");
  });
  // A server serving a stale build hands out dead font URLs and the card silently falls back to a serif: stop instead.
  if (!/Martian/i.test(fonts) || !/Schibsted/i.test(fonts)) throw new Error(`site fonts did not load from ${base} (loaded: ${fonts || "none"}); restart the server on the current build`);
  const buf = await page.screenshot({ type: "jpeg", quality: 85, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  for (const f of fs.readdirSync(out)) if (f.startsWith(c.name + ".")) fs.rmSync(path.join(out, f));
  fs.writeFileSync(path.join(out, `${c.name}.${hash}.jpg`), buf);
  map[c.name] = `/og/${c.name}.${hash}.jpg`;
}
await browser.close();
fs.writeFileSync("src/lib/og.generated.json", JSON.stringify(map, null, 2) + "\n");
console.log(map);
