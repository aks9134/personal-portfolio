"use client";
import { useEffect, useRef, useState } from "react";

// A dimension line down the left margin, the way a drawing carries one: two witness ticks, a travelling
// marker, and a live read-out of the section you're in. Position is set from the scroll offset, not animated,
// so it behaves under reduced motion. Hidden on narrow screens and in print.
export function ScrollRail() {
  const rail = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        el.style.setProperty("--p", p.toFixed(4));
        el.style.setProperty("--pct", `${Math.round(p * 100)}`);
      });
    };

    const marks = [...document.querySelectorAll<HTMLElement>("[data-rail]")];
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting);
        const current = marks.find((m) => seen.get(m));
        if (current?.dataset.rail) setLabel(current.dataset.rail);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    marks.forEach((m) => io.observe(m));

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rail} aria-hidden className="rail hidden 2xl:block print:hidden">
      <div className="rail-marker">
        <span className="rail-label">{label}</span>
      </div>
    </div>
  );
}
