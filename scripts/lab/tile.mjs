// node scripts/lab/tile.mjs <out-prefix> <cols> <tileWidth> <perSheet> <img...>  Labelled contact sheets of frames.
import path from "node:path";
import sharp from "sharp";

const [prefix, cols, w, per, ...files] = process.argv.slice(2);
const C = +cols, W = +w, N = +per;
for (let s = 0; s * N < files.length; s++) {
  const batch = files.slice(s * N, s * N + N);
  const tiles = await Promise.all(batch.map(async (f) => {
    const buf = await sharp(f).resize({ width: W }).png().toBuffer();
    const { height } = await sharp(buf).metadata();
    const label = Buffer.from(`<svg width="${W}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="6" y="16" font-size="14" font-family="monospace" fill="#ff0">${path.basename(f)}</text></svg>`);
    return { buf, height, label };
  }));
  const H = Math.max(...tiles.map((t) => t.height)) + 22;
  const rows = Math.ceil(tiles.length / C);
  const comp = [];
  tiles.forEach((t, i) => {
    const x = (i % C) * (W + 6), y = Math.floor(i / C) * (H + 6);
    comp.push({ input: t.label, left: x, top: y }, { input: t.buf, left: x, top: y + 22 });
  });
  const out = `${prefix}-${s + 1}.png`;
  await sharp({ create: { width: C * (W + 6), height: rows * (H + 6), channels: 3, background: "#555" } }).composite(comp).png().toFile(out);
  console.log(out);
}
