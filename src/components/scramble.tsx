"use client";

import { useEffect, useRef } from "react";
import { motionOk } from "@/lib/prefs";

const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789/#+=<>";

// Text that decodes into place: each character cycles through glyphs and settles left to right (about 500 ms).
// Runs when it first scrolls into view and again on hover or focus of the nearest link. Screen readers get the
// real text; the flicker is aria-hidden. Nothing runs under reduced motion.
const MS = 520;

export function Scramble({ text }: { text: string }) {
  const out = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = out.current;
    if (!el) return;
    let raf = 0;
    const play = () => {
      cancelAnimationFrame(raf);
      if (!motionOk()) return;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = (now - t0) / MS;
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const settle = i / text.length;
          s += ch === " " || k > settle * 0.7 + 0.3 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = s;
        if (k < 1) raf = requestAnimationFrame(step);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        play();
        io.disconnect();
      }
    });
    io.observe(el);
    const host = el.closest("a, button") ?? el;
    host.addEventListener("pointerenter", play);
    host.addEventListener("focus", play);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", play);
      host.removeEventListener("focus", play);
    };
  }, [text]);

  return (
    <span>
      <span className="sr-only">{text}</span>
      {/* The invisible copy holds the final size, so the line doesn't jitter while glyphs change. */}
      <span aria-hidden className="inline-grid">
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span ref={out} className="col-start-1 row-start-1 overflow-hidden">
          {text}
        </span>
      </span>
    </span>
  );
}
