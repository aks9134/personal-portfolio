"use client";

import { useEffect } from "react";
import { useMotionOk } from "@/lib/prefs";
import type { Media } from "@/lib/work";
import { parseOrbit, type Mode } from "./engine";
import { useInk, useStage } from "./use-stage";
import { StageCanvas, TurnButtons } from "./view";

// A small live model on a shelf of several. It builds when it comes within a screen of view and frees its GPU
// context two screens away. Drag, arrow keys or the Turn buttons turn it; while a mouse rests on it (motion allowed)
// it turns slowly by itself and stops when the mouse leaves. `mode` switches solid / edges / x-ray.
export function Specimen({ m, mode = "solid", className = "" }: { m: Media; mode?: Mode; className?: string }) {
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready } = useStage({ src: m.src, theta: o.theta, phi: o.phi, drag: true, exposure: 1.1 });
  const moving = useMotionOk();
  useInk(stage, box, mode, ready, gen);

  // Slow turn while a mouse rests on it.
  useEffect(() => {
    const el = box.current;
    if (!ready || !moving || !el) return;
    let raf = 0;
    const spin = () => {
      const s = stage.current;
      if (!s) return void (raf = 0);
      const a = s.angles();
      s.setAngles(a.theta + 0.35, a.phi);
      raf = requestAnimationFrame(spin);
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !raf) raf = requestAnimationFrame(spin);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", stop);
    el.addEventListener("pointerdown", stop);
    return () => {
      stop();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, [ready, gen, moving, box, stage]);

  return (
    <div className={className}>
      <div ref={box} className="relative aspect-[4/3] w-full">
        <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="(min-width: 1024px) 30vw, 90vw" />
      </div>
      <TurnButtons stage={stage} className="mt-1 justify-end" />
    </div>
  );
}
