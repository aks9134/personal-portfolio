"use client";

import { useEffect, useRef } from "react";
import { cssVars, fitCanvas } from "@/lib/canvas";
import { motionOk, subscribe } from "@/lib/prefs";

// A trace that answers the page: scrolling excites it (amplitude follows scroll speed), and it rings down like a
// damped beam when you stop, then the loop goes idle. It only runs while on screen. With motion off it is a flat
// line drawn once.
export function Waveform({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let amp = 0.08;
    let phase = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let visible = false;
    let ink = cssVars(c, { accent: "--accent" }).accent;

    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const moving = motionOk();
      if (moving) {
        phase += dt * 9;
        amp *= Math.exp(-dt * 2.2); // ring-down
      }
      const { w, h } = fitCanvas(c, ctx);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const a = moving ? Math.max(amp, 0.04) : 0;
      for (let x = 0; x <= w; x += 2) {
        // Two modes of a beam, the second one faster and weaker, so the trace reads as vibration and not a sine.
        const k = x / w;
        const y = Math.sin(k * Math.PI * 14 - phase) + 0.35 * Math.sin(k * Math.PI * 37 - phase * 2.7);
        const env = Math.sin(k * Math.PI); // pinned at both ends, like a beam fixed on its posts
        const py = h / 2 + y * env * a * (h / 2.6);
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
      if (moving && visible && amp > 0.045) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    const onScroll = () => {
      const y = window.scrollY;
      amp = Math.min(1, amp + Math.abs(y - lastY) / 900);
      lastY = y;
      if (visible && motionOk()) kick();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(c);
    const ro = new ResizeObserver(kick);
    ro.observe(c);
    const off = subscribe(() => {
      ink = cssVars(c, { accent: "--accent" }).accent;
      kick();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      ro.disconnect();
      off();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className={className} />;
}
