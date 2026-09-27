// node scripts/sheet.mjs <out.png> <img> [img...]  Lays images out in a 2-column contact sheet at 720 px wide each.
import sharp from "sharp";

const [out, ...files] = process.argv.slice(2);
const W = 720;
const tiles = await Promise.all(
  files.map(async (f) => {
    const img = sharp(f).resize({ width: W });
    const buf = await img.png().toBuffer();
    const { height } = await sharp(buf).metadata();
    return { buf, height };
  }),
);
const rows = [];
for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
const heights = rows.map((r) => Math.max(...r.map((t) => t.height)));
const composite = [];
let y = 0;
rows.forEach((r, i) => {
  r.forEach((t, j) => composite.push({ input: t.buf, left: j * (W + 8), top: y }));
  y += heights[i] + 8;
});
await sharp({ create: { width: W * 2 + 8, height: y, channels: 3, background: "#808080" } }).composite(composite).png().toFile(out);
console.log(out);
