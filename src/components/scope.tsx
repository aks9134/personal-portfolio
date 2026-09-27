"use client";

import { useEffect, useRef, useState } from "react";
import { motionOk, useMotionOk } from "@/lib/motion";
import { sound } from "@/lib/sound";

// A scope face that replays the canceller's Test 2 from the numbers in the write-up: the beam held at 54 Hz with a
// 0.17 V peak on the piezo, and with the canceller driving, down to as low as 0.015 V for 40 to 50 ms before the
// fixed signal slipped out of phase. It is redrawn from those figures and says so; it is not the recording.
// It runs only while on screen and has a Hold button (anything moving past 5 s needs a pause). With motion off it
// shows one still frame and no Hold button.
const HZ = 54;
const PEAK = 0.17; // V
const FLOOR = 0.015; // V
const WINDOW = 0.045; // s the cancellation holds (40 to 50 ms)
const CYCLE = 0.32; // s between re-phasing: illustrative spacing, not from the test
const SPAN = 0.2; // s across the screen (20 ms/div, 10 div)
const VDIV = 0.05; // V per division, 8 divisions tall

export function Scope({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);
  const [held, setHeld] = useState(false);
  const moving = useMotionOk();
  const state = useRef({ on, held });
  state.current = { on, held };
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let visible = false;
    let raf = 0;
    let t0 = performance.now();
    let at = 0.05; // seconds into the replay: a frame inside a good window, for the still view

    const amp = (t: number) => {
      if (!state.current.on) return PEAK;
      const k = t % CYCLE;
      if (k < WINDOW) return FLOOR; // the good window
      const drift = Math.min(1, (k - WINDOW) / (CYCLE - WINDOW - 0.04)); // phase slips back toward full amplitude
      return FLOOR + (PEAK - FLOOR) * Math.sin((drift * Math.PI) / 2);
    };

    const draw = (now: number) => {
      raf = 0;
      const running = motionOk() && !state.current.held;
      if (running) at = (now - t0) / 1000;
      const css = getComputedStyle(c);
      const ink = css.getPropertyValue("--scope-ink").trim() || "#ddd";
      const grid = css.getPropertyValue("--scope-grid").trim() || "#444";
      const ref = css.getPropertyValue("--scope-ref").trim() || "#888";
      const dpr = Math.min(devicePixelRatio, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
      }
      ctx.setTransform(c.width / w, 0, 0, c.height / h, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Graticule: 10 x 8 divisions, with ticks along the centre line.
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) ctx.moveTo(Math.round((w * i) / 10) + 0.5, 0), ctx.lineTo(Math.round((w * i) / 10) + 0.5, h);
      for (let j = 0; j <= 8; j++) ctx.moveTo(0, Math.round((h * j) / 8) + 0.5), ctx.lineTo(w, Math.round((h * j) / 8) + 0.5);
      for (let i = 0; i <= 50; i++) {
        const x = Math.round((w * i) / 50) + 0.5;
        ctx.moveTo(x, h / 2 - 3), ctx.lineTo(x, h / 2 + 3);
      }
      ctx.stroke();

      const yOf = (v: number) => h / 2 - (v / (VDIV * 4)) * (h / 2);
      if (state.current.on) {
        // The uncancelled peak, dashed, for comparison.
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
        const t = at + (x / w) * SPAN;
        const y = yOf(amp(t) * Math.sin(2 * Math.PI * HZ * t));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (visible && running) raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    redraw.current = () => {
      t0 = performance.now() - at * 1000; // resume where it was held
      kick();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) redraw.current();
    });
    io.observe(c);
    const ro = new ResizeObserver(kick);
    ro.observe(c);
    const mo = new MutationObserver(kick); // lights: redraw in the new colours even while held
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-motion"] });
    return () => {
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => redraw.current(), [on, held, moving]);

  return (
    <figure className={`scope ${className}`}>
      <div className="scope-screen">
        <canvas ref={canvas} className="h-full w-full" aria-hidden />
      </div>
      <div className="scope-controls">
        <button
          type="button"
          aria-pressed={on}
          onClick={() => {
            sound.clunk();
            setOn((x) => !x);
          }}
          className="btn"
        >
          Canceller
        </button>
        {moving && (
          <button
            type="button"
            aria-pressed={held}
            onClick={() => {
              sound.tick();
              setHeld((x) => !x);
            }}
            className="btn"
          >
            Hold
          </button>
        )}
        <p className="scope-scale">54 Hz, 20 ms/div, 50 mV/div</p>
      </div>
      <figcaption className="scope-cap">
        <span role="status">
          {on
            ? "Canceller driving: the piezo reads as low as 0.015 V for 40 to 50 ms, then the fixed signal slips out of phase."
            : "Canceller off: the beam at 54 Hz reads 0.17 V peak on the piezo."}
        </span>{" "}
        Redrawn from the Test 2 figures, not the recorded trace.
      </figcaption>
    </figure>
  );
}
