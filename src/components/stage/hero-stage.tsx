"use client";

import { useEffect } from "react";
import { motionOk, onMotionChange } from "@/lib/motion";
import type { Media } from "@/lib/work";
import { type Finish, parseOrbit } from "./engine";
import { useStage } from "./use-stage";
import { StageCanvas, TurnButtons } from "./view";

// The hero model. It loads once the page has finished and gone quiet (on phones, after the first touch), with its
// poster holding the space until then. It leans a few degrees toward the pointer and turns as the page scrolls past
// it; drag, arrow keys or the Turn buttons turn it for real. With motion off it only moves when asked.
export function HeroStage({
  m,
  finish = "aluminium",
  frame = 1,
  scrollTurn = 0.12,
  className = "",
  label,
}: {
  m: Media;
  finish?: Finish;
  frame?: number;
  scrollTurn?: number; // degrees per pixel scrolled
  className?: string;
  label?: string;
}) {
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready } = useStage({ src: m.src, finish, theta: o.theta, phi: o.phi, frame, drag: true, exposure: 1.1 }, { idle: true });

  useEffect(() => {
    if (!ready) return;
    const s = stage.current;
    const cv = canvas.current;
    const el = box.current;
    if (!s || !cv || !el) return;
    const base = s.angles();
    let offset = { t: 0, p: 0 }; // turns made by drag, keys or buttons
    let target = { t: 0, p: 0 };
    let cur = { t: 0, p: 0 };
    let scrollBase = window.scrollY;
    let visible = true;
    let raf = 0;
    let own = false; // true while this effect is the one moving the camera

    const tick = () => {
      raf = 0;
      if (!motionOk()) return;
      const goal = { t: target.t - (window.scrollY - scrollBase) * scrollTurn, p: target.p };
      cur = { t: cur.t + (goal.t - cur.t) * 0.08, p: cur.p + (goal.p - cur.p) * 0.08 };
      own = true;
      s.setAngles(base.theta + offset.t + cur.t, base.phi + offset.p + cur.p);
      own = false;
      if (Math.abs(goal.t - cur.t) > 0.02 || Math.abs(goal.p - cur.p) > 0.02) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (visible && !raf && motionOk()) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons) return;
      target = { t: (e.clientX / innerWidth - 0.5) * 16, p: (e.clientY / innerHeight - 0.5) * -8 };
      kick();
    };
    // A turn by hand becomes the new base, so the lean and scroll carry on from where the visitor left it.
    const onTurn = () => {
      if (own) return;
      const a = s.angles();
      offset = { t: a.theta - base.theta - cur.t, p: a.phi - base.phi - cur.p };
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    cv.addEventListener("stage:turn", onTurn);
    // Motion switched back on: keep the current view and count scroll from here, so nothing jumps.
    const offMotion = onMotionChange((ok) => {
      if (!ok) return;
      const a = s.angles();
      offset = { t: a.theta - base.theta, p: a.phi - base.phi };
      cur = { t: 0, p: 0 };
      target = { t: 0, p: 0 };
      scrollBase = window.scrollY;
    });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      cv.removeEventListener("stage:turn", onTurn);
      offMotion();
      cancelAnimationFrame(raf);
    };
  }, [ready, gen, scrollTurn, stage, canvas, box]);

  return (
    <div className={className}>
      <div ref={box} className="relative h-full w-full">
        <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="(min-width: 768px) 50vw, 100vw" priority label={label} />
      </div>
      <TurnButtons stage={stage} className="mt-2 justify-end" />
    </div>
  );
}
