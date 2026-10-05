// The console's scroll timeline, shared by the scene (what to draw) and the page (where a target's button scrolls).
// Each model gets a segment of the run in proportion to its weight. Within a segment: 0-MORPH the cloud re-forms,
// MORPH-SCAN the scan resolves it, then it is solid; an assembly comes apart between EXPLODE[0] and EXPLODE[1] of the
// solid part, then holds apart.
export const MORPH = 0.22;
export const SCAN = 0.48;
export const EXPLODE = [0.1, 0.42] as const;

export function segments(weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  const starts = weights.map((_, k) => weights.slice(0, k).reduce((a, b) => a + b, 0));
  /** Overall progress (0-1) to segment index and local position (0-1). */
  const at = (p: number) => {
    const x = Math.min(0.99999, Math.max(0, p)) * total;
    let i = weights.length - 1;
    while (i > 0 && x < starts[i]) i--;
    return { i, f: (x - starts[i]) / weights[i] };
  };
  return Object.assign(at, {
    /** Overall progress at local position f of segment i. */
    to: (i: number, f: number) => (starts[i] + weights[i] * f) / total,
    total,
  });
}
