"use client";

// next/image loader (next.config.ts): no resizing service, just the right pre-made copy. `npm run media` writes
// <file>.w640.webp, .w828.webp and .w1200.webp next to every WebP (keep WIDTHS in sync with scripts/media/build.mjs);
// wider screens get the original, which the pipeline caps at 1600 px.
const WIDTHS = [640, 828, 1200];

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const w = src.endsWith(".webp") ? WIDTHS.find((x) => x >= width) : undefined;
  return w ? src.replace(/\.webp$/, `.w${w}.webp`) : src;
}
