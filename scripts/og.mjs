// npm run og   (after npm run media, whenever a hero image changes)
// Link-preview images, 1200x630 JPG (LinkedIn and others don't reliably show WebP): each project's hero on the
// goldenrod stock, and the home page's exploded view. Names carry a content hash, because link previews cache by URL.
// Writes public/og/<name>.<hash>.jpg and src/lib/og.generated.json, which the page metadata reads.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);
const W = 1200, H = 630, PAD = 60;
const STOCK = { r: 244, g: 227, b: 168 }; // --stock, sampled from a render of the site
const INK = { r: 29, g: 23, b: 14 };
const out = 'public/og';
fs.mkdirSync(out, { recursive: true });

function heroOf(slug) {
  const mdx = fs.readFileSync(path.join('content/work', slug, 'index.mdx'), 'utf8');
  const media = JSON.parse(fs.readFileSync(path.join('content/work', slug, 'media.generated.json'), 'utf8'));
  const order = Number(/order:\s*(\d+)/.exec(mdx)[1]);
  const figure = /figure:\s*\{\s*name:\s*"([^"]+)"/.exec(mdx)?.[1];
  const m = media[/hero:\s*"([^"]+)"/.exec(mdx)[1]];
  return { order, figure: figure && media[figure], still: { ...m, src: m.poster ?? m.src } };
}

async function card(name, m) {
  const file = path.join('public', m.src);
  const frame = m.alpha ? 0 : 3; // see-through images sit on the stock; opaque ones get an ink frame, as on the site
  const img = await sharp(file).resize(W - 2 * PAD - 2 * frame, H - 2 * PAD - 2 * frame, { fit: 'inside' })
    .extend({ top: frame, bottom: frame, left: frame, right: frame, background: INK }).toBuffer();
  const buf = await sharp({ create: { width: W, height: H, channels: 3, background: STOCK } })
    .composite([{ input: img, gravity: 'center' }]).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
  for (const f of fs.readdirSync(out)) if (f.startsWith(name + '.')) fs.rmSync(path.join(out, f));
  fs.writeFileSync(path.join(out, `${name}.${hash}.jpg`), buf);
  return `/og/${name}.${hash}.jpg`;
}

const map = {};
let lead;
for (const slug of fs.readdirSync('content/work')) {
  if (!fs.existsSync(path.join('content/work', slug, 'index.mdx'))) continue;
  const h = heroOf(slug);
  map[slug] = await card(slug, h.still);
  if (!lead || h.order < lead.order) lead = h;
}
map.home = await card('home', lead.figure ?? lead.still);
fs.writeFileSync('src/lib/og.generated.json', JSON.stringify(map, null, 2) + '\n');
console.log(map);
