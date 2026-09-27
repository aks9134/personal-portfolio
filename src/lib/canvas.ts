// Shared by the 2D canvases (scope, waveform): a crisp backing store at the screen's pixel ratio (capped at 2), and
// theme colours read from CSS custom properties. Callers read colours once and again when the lights change,
// never per frame.
export function fitCanvas(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = c.clientWidth;
  const h = c.clientHeight;
  if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
  }
  ctx.setTransform(c.width / Math.max(1, w), 0, 0, c.height / Math.max(1, h), 0, 0);
  return { w, h };
}

export function cssVars<K extends string>(el: Element, names: Record<K, string>): Record<K, string> {
  const css = getComputedStyle(el);
  return Object.fromEntries(Object.entries<string>(names).map(([k, v]) => [k, css.getPropertyValue(v).trim()])) as Record<K, string>;
}
