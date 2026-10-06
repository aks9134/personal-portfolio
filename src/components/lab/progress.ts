// Scroll and easing helpers with no three.js in them, so the pages that only need these (the console's HTML, the
// project openers) don't pull the 3D library into their first load. load.ts re-exports them for the scene code.
export const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Overall scroll progress (0-1) of a tall section through the viewport. */
export function sectionProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const run = el.offsetHeight - window.innerHeight;
  return run > 0 ? clamp01(-r.top / run) : 0;
}
