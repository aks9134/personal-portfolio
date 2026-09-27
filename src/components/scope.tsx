"use client";

import { useEffect, useRef, useState } from "react";

// A scope face that replays the canceller's Test 2 from the numbers in the write-up: the beam held at 54 Hz with a
// 0.17 V peak on the piezo, and with the canceller driving, down to as low as 0.015 V for 40 to 50 ms before the
// fixed signal slipped out of phase. It is a reconstruction from those figures, labelled as one, not the recording.
// Runs only on screen, has a Run/Hold button (anything moving past 5 s needs one), and holds still under reduced motion.
const HZ = 54;
const PEAK = 0.17; // V
const FLOOR = 0.015; // V
const WINDOW = 0.045; // s the cancellation holds
const CYCLE = 0.32; // s between re-phasing (illustrative spacing, not from the test)
const SPAN = 0.2; // s across the screen (20 ms/div, 10 div)
const VDIV = 0.05; // V per division, 8 divisions tall

export function Scope({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);
  const [run, setRun] = useState(true);
  const state = useRef({ on: true, run: true });
  state.current = { on, run };

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let raf = 0;
    let t0 = performance.now();
    let held = 0;

    const amp = (t: number) => {
      if (!state.current.on) return PEAK;
      const k = t % CYCLE;
      if (k < WINDOW) return FLOOR + (PEAK - FLOOR) * 0.08 * Math.sin((k / WINDOW) * Math.PI); // the good window
      const drift = Math.min(1, (k - WINDOW) / (CYCLE - WINDOW - 0.04)); // phase slips back to full
      return FLOOR + (PEAK - FLOOR) * Math.sin((drift * Math.PI) / 2);
    };

    const draw = (now: number) => {
      raf = 0;
      const css = getComputedStyle(c);
      const ink = css.getPropertyValue("--scope-ink").trim() || "#ddd";
      const grid = css.getPropertyValue("--scope-grid").trim() || "#444";
      const ref = css.getPropertyValue("--scope-ref").trim() || "#888";
      const dpr = Math.min(devicePixelRatio, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Graticule: 10 x 8 divisions, centre lines ticked.
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) ctx.moveTo(Math.round((w * i) / 10) + 0.5, 0), ctx.lineTo(Math.round((w * i) / 10) + 0.5, h);
      for (let j = 0; j <= 8; j++) ctx.moveTo(0, Math.round((h * j) / 8) + 0.5), ctx.lineTo(w, Math.round((h * j) / 8) + 0.5);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const x = Math.round((w * i) / 50) + 0.5;
        ctx.moveTo(x, h / 2 - 3), ctx.lineTo(x, h / 2 + 3);
      }
      ctx.stroke();

      const elapsed = state.current.run && !reduce ? (now - t0) / 1000 : held;
      held = elapsed;
      const yOf = (v: number) => h / 2 - (v / (VDIV * 4)) * (h / 2);
      // The uncancelled envelope as a faint reference while the canceller runs.
      if (state.current.on) {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = ref;
        ctx.beginPath();
        ctx.moveTo(0, yOf(PEAK)), ctx.lineTo(w, yOf(PEAK));
        ctx.moveTo(0, yOf(-PEAK)), ctx.lineTo(w, yOf(-PEAK));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 1) {
        const t = elapsed + (x / w) * SPAN;
        const v = amp(t) * Math.sin(2 * Math.PI * HZ * t);
        if (x === 0) ctx.moveTo(x, yOf(v));
        else ctx.lineTo(x, yOf(v));
      }
      ctx.stroke();
      if (visible && state.current.run && !reduce) raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        t0 = performance.now() - held * 1000;
        kick();
      }
    });
    io.observe(c);
    const ro = new ResizeObserver(kick);
    ro.observe(c);
    (c as HTMLCanvasElement & { kick?: () => void }).kick = () => {
      t0 = performance.now() - held * 1000;
      kick();
    };
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    (canvas.current as (HTMLCanvasElement & { kick?: () => void }) | null)?.kick?.();
  }, [on, run]);

  return (
    <figure className={`scope ${className}`}>
      <div className="scope-screen">
        <canvas ref={canvas} className="h-full w-full" aria-hidden />
      </div>
      <div className="scope-controls">
        <button type="button" aria-pressed={on} onClick={() => setOn((x) => !x)} className="scope-btn">
          Canceller {on ? "on" : "off"}
        </button>
        <button type="button" aria-pressed={!run} onClick={() => setRun((x) => !x)} className="scope-btn">
          {run ? "Hold" : "Run"}
        </button>
        <p className="scope-scale">54 Hz, 20 ms/div, 50 mV/div</p>
      </div>
      <figcaption className="scope-cap">
        {on
          ? "Canceller driving: the piezo reads as low as 0.015 V for 40 to 50 ms, then the fixed signal slips out of phase."
          : "Canceller off: the beam at 54 Hz reads 0.17 V peak on the piezo."}{" "}
        Redrawn from the Test 2 figures, not the recorded trace.
      </figcaption>
    </figure>
  );
}
