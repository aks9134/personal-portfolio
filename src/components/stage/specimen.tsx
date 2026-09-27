"use client";

import { useEffect } from "react";
import { motionOk } from "@/lib/motion";
import type { Media } from "@/lib/work";
import { cssColor, parseOrbit, type Finish, type Mode } from "./engine";
import { useStage } from "./use-stage";
import { StageCanvas, TurnButtons } from "./view";

// A small live model on a shelf of several. It builds when it comes within a screen of view and frees its GPU
// context two screens away. Drag, arrow keys or the Turn buttons turn it; while a mouse rests on it (motion allowed)
// it turns slowly by itself and stops when the mouse leaves. `mode` switches solid / edges / x-ray, drawn in the
// theme's ink colour.
export function Specimen({ m, mode = "solid", finish = "aluminium", className = "" }: { m: Media; mode?: Mode; finish?: Finish; className?: string }) {
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready } = useStage({ src: m.src, finish, theta: o.theta, phi: o.phi, drag: true, exposure: 1.1 });

  // Mode and ink colour, now and whenever the lights change.
  useEffect(() => {
    const el = box.current;
    if (!ready || !el) return;
    const apply = () => stage.current?.setMode(mode, cssColor(el, "--fg"));
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [mode, ready, gen, box, stage]);

  // Slow turn while a mouse rests on it.
  useEffect(() => {
    const el = box.current;
    if (!ready || !el) return;
    let raf = 0;
    const spin = () => {
      const s = stage.current;
      if (!s || !motionOk()) return void (raf = 0);
      const a = s.angles();
      s.setAngles(a.theta + 0.35, a.phi);
      raf = requestAnimationFrame(spin);
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !raf && motionOk()) raf = requestAnimationFrame(spin);
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
  }, [ready, gen, box, stage]);

  return (
    <div className={className}>
      <div ref={box} className="relative aspect-[4/3] w-full">
        <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="(min-width: 1024px) 30vw, 90vw" />
      </div>
      <TurnButtons stage={stage} className="mt-1 justify-end" />
    </div>
  );
}
