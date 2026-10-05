"use client";

import { useEffect, useRef } from "react";
import type { Shot } from "@/components/lab/teardown/studio";

// Offline render target for scripts/render-teardown.mjs: the script sets window.__shot, and this page exposes
// window.__frame(t) returning one finished frame as a PNG data URL. Not linked from anywhere.
export default function RenderPage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const w = window as unknown as { __shot?: Shot; __size?: [number, number]; __frame?: (t: number) => string; __ready?: boolean };
    (async () => {
      const { createStudio } = await import("@/components/lab/teardown/studio");
      const [W, H] = w.__size ?? [1600, 1000];
      const studio = await createStudio(canvas.current!, w.__shot!, W, H);
      w.__frame = (t: number) => studio.frame(t);
      w.__ready = true;
    })();
  }, []);
  return <canvas ref={canvas} style={{ position: "fixed", left: 0, top: 0, width: 400, height: 250 }} />;
}
