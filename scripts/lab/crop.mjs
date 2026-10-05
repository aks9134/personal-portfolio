// node scripts/lab/crop.mjs <out> <left> <top> <width> <height> <img...>  The same crop of several captures, side by side.
import sharp from "sharp";

const [out, l, t, w, h, ...files] = process.argv.slice(2);
const tiles = await Promise.all(files.map((f) => sharp(f).extract({ left: +l, top: +t, width: +w, height: +h }).toBuffer()));
await sharp({ create: { width: +w * tiles.length, height: +h, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: i * +w, top: 0 })))
  .png()
  .toFile(out);
