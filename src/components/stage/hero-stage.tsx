"use client";

import { useEffect, useRef, useState } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";
import { createStage, type Finish, type Stage } from "./engine";

const motionOk = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

// A CAD model that loads by itself once the page is idle. The poster holds its place until the first frame is
// drawn, so nothing jumps. It follows the pointer a few degrees (springy, decorative) and turns with scroll while on
// screen; drag turns it for real. Reduced motion: it only moves when dragged.
export function HeroStage({
  m,
  finish = "cad",
  theta = 40,
  phi = 65,
  frame = 1,
  scrollTurn = 0.12,
  className = "",
  label,
}: {
  m: Media;
  finish?: Finish;
  theta?: number;
  phi?: number;
  frame?: number;
  scrollTurn?: number; // degrees per pixel scrolled
  className?: string;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stage: Stage | null = null;
    let cancelled = false;
    let raf = 0;
    const offs: (() => void)[] = [];
    const ric = (window as { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 1800 }) : window.setTimeout(cb, 600));

    idle(async () => {
      if (cancelled || !canvas.current) return;
      try {
        stage = await createStage(canvas.current, { src: m.src, finish, theta, phi, frame, drag: true, exposure: 1.1 });
      } catch {
        return; // the poster stays: a model that fails to load is not an error the visitor needs to see
      }
      if (cancelled) return stage.dispose();
      setReady(true);
      if (!motionOk()) return;

      // Pointer follow and scroll turn, eased toward their targets each frame (a critically damped chase).
      let target = { t: 0, p: 0 };
      let cur = { t: 0, p: 0 };
      let scrollBase = window.scrollY;
      let visible = true;
      const base = stage.angles();
      let dragged = { t: 0, p: 0 };
      const tick = () => {
        raf = 0;
        if (!stage) return;
        const scroll = (window.scrollY - scrollBase) * scrollTurn;
        cur.t += (target.t - scroll * -1 - cur.t) * 0.08;
        cur.p += (target.p - cur.p) * 0.08;
        stage.setAngles(base.theta + dragged.t + cur.t, base.phi + dragged.p + cur.p);
        if (Math.abs(target.t + scroll - cur.t) > 0.01 || Math.abs(target.p - cur.p) > 0.01) raf = requestAnimationFrame(tick);
      };
      const kick = () => {
        if (visible && !raf) raf = requestAnimationFrame(tick);
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.buttons) return;
        target = { t: (e.clientX / innerWidth - 0.5) * 16, p: (e.clientY / innerHeight - 0.5) * -8 };
        kick();
      };
      // A drag moves the camera itself; fold it into the base so the follow carries on from there.
      const onUp = () => {
        if (!stage) return;
        const a = stage.angles();
        dragged = { t: a.theta - base.theta - cur.t, p: a.phi - base.phi - cur.p };
      };
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(box.current!);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", kick, { passive: true });
      canvas.current?.addEventListener("pointerup", onUp);
      offs.push(() => {
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", kick);
        canvas.current?.removeEventListener("pointerup", onUp);
      });
      scrollBase = window.scrollY;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      offs.forEach((f) => f());
      stage?.dispose();
    };
  }, [m.src, finish, theta, phi, frame, scrollTurn]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={`${m.alt ?? label}. Drag to turn it.`}
        className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-500 ease-(--ease-out) active:cursor-grabbing motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {m.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.poster}
          srcSet={srcSet(m.poster, m.width)}
          sizes="(min-width: 768px) 50vw, 100vw"
          width={m.width}
          height={m.height}
          alt=""
          fetchPriority="high"
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-(--ease-out) motion-reduce:transition-none ${ready ? "opacity-0" : "opacity-100"}`}
        />
      )}
    </div>
  );
}
