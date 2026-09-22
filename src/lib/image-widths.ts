// Width copies `npm run media` writes next to every WebP: <file>.w640.webp and so on (scripts/media/build.mjs WIDTHS).
export const WIDTHS = [640, 828, 1200];

export const widthCopy = (src: string, w: number) => src.replace(/\.webp$/, `.w${w}.webp`);

// A truthful srcset: only the copies narrower than the original, each labelled with its real width, then the original.
// (next/image labels copies from its own size list, e.g. a 1080 px original as "3840w", which made browsers on
// high-density screens shrink images to a third of their size.)
export function srcSet(src: string, width: number) {
  const ws = src.endsWith(".webp") ? WIDTHS.filter((w) => w < width) : [];
  return ws.length ? [...ws.map((w) => `${widthCopy(src, w)} ${w}w`), `${src} ${width}w`].join(", ") : undefined;
}
