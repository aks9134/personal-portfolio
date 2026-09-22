// The one file to edit per project: every route a visitor can reach.
export const routes: string[] = [
  '/',
  '/work/micro-vibration-canceller',
  '/work/gravity-storage-drive',
  '/work/robotic-arm',
  '/work/tpu-weld-rig',
  '/work/buggy-analysis',
  '/work/touchdesigner',
  '/work/motorized-couch',
  '/work/bolted-flange',
  '/about',
  '/resume',
];

// Widths checked for layout breakage. 320 is the WCAG reflow floor.
export const widths = [320, 390, 768, 1024, 1440] as const;
