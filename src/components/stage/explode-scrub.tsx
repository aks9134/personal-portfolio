"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";
import { createStage, type Finish, type Stage } from "./engine";

export type Readout = { p: number; mm: number; parts: number; ready: boolean; loaded: number };

type Ctx = Readout & { travel: number; slide: (v: number) => void; id: string };
const ExplodeContext = createContext<Ctx | null>(null);
export const useExplode = () => {
  const c = useContext(ExplodeContext);
  if (!c) throw new Error("useExplode outside <ExplodeScrub>");
  return c;
};

// The take-apart: a tall section pins the model while scrolling through it pulls the assembly apart and swings the
// camera around it. The Explode slider is the same control by hand: it scrolls the page to the matching point, so
// scroll and slider never disagree. Reduced motion: no pin and no camera swing, the slider alone moves the parts.
// The model starts loading when the section comes within a screen of view.
export function ExplodeScrub({
  m,
  finish = "cad",
  swing = [40, 110],
  tilt = [65, 55],
  length = 3.2,
  className = "",
  stageClassName = "",
  overlay,
  children,
}: {
  m: Media;
  finish?: Finish;
  swing?: [number, number]; // camera theta at 0 and 1, degrees
  tilt?: [number, number]; // camera phi at 0 and 1
  length?: number; // section height in viewport heights
  className?: string;
  stageClassName?: string;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [pinned, setPinned] = useState(true);
  const [r, setR] = useState<Readout>({ p: 0, mm: 0, parts: m.parts ?? 0, ready: false, loaded: 0 });
  const id = useId();
  const travel = m.explode ?? 0;

  // Reduced motion decides the layout: pinned scroll or a plain slider.
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setPinned(!q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  const apply = (p: number, swingIt: boolean) => {
    const s = stageRef.current;
    setR((x) => ({ ...x, p, mm: Math.round(p * travel) }));
    if (!s) return;
    s.setExplode(p);
    // Start close on the assembled drive and pull back as it spreads, so it fills the frame at both ends.
    s.setZoom(0.62 + 0.38 * Math.min(1, p * 1.4));
    if (swingIt) s.setAngles(swing[0] + (swing[1] - swing[0]) * p, tilt[0] + (tilt[1] - tilt[0]) * p);
  };
  const applyRef = useRef(apply);
  applyRef.current = apply;

  // Load when near.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || stageRef.current || !canvas.current) return;
        io.disconnect();
        try {
          const s = await createStage(canvas.current, {
            src: m.src,
            finish,
            theta: swing[0],
            phi: tilt[0],
            frameExploded: true,
            drag: true,
            onProgress: (l, t) => setR((x) => ({ ...x, loaded: t ? l / t : 0 })),
          });
          if (cancelled) return s.dispose();
          stageRef.current = s;
          setR((x) => ({ ...x, ready: true, parts: x.parts || s.parts }));
          applyRef.current(progressOf(el), window.matchMedia("(prefers-reduced-motion: no-preference)").matches);
        } catch {
          /* poster stays */
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      stageRef.current?.dispose();
      stageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.src, finish]);

  // Scroll drives the explode while pinned. rAF-throttled; reads layout once per frame.
  useEffect(() => {
    if (!pinned) return;
    const el = section.current!;
    let raf = 0;
    const tick = () => {
      raf = 0;
      applyRef.current(progressOf(el), true);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    on();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [pinned]);

  const onSlide = (v: number) => {
    const el = section.current!;
    if (pinned) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + v * (el.offsetHeight - window.innerHeight), behavior: "instant" });
    } else apply(v, false);
  };

  return (
    <ExplodeContext.Provider value={{ ...r, travel, slide: onSlide, id }}>
    <section ref={section} className={className} style={pinned ? { height: `${length * 100}dvh` } : undefined}>
      <div className={pinned ? "sticky top-0 h-dvh overflow-hidden" : "relative"}>
        <div className={`relative ${pinned ? "h-full" : "aspect-[16/10]"} ${stageClassName}`}>
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${m.alt}. ${m.parts} parts. Drag to turn it; the Explode slider takes it apart.`}
            className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-500 ease-(--ease-out) active:cursor-grabbing motion-reduce:transition-none ${r.ready ? "opacity-100" : "opacity-0"}`}
          />
          {m.poster && !r.ready && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.poster}
              srcSet={srcSet(m.poster, m.width)}
              sizes="100vw"
              width={m.width}
              height={m.height}
              alt=""
              loading="lazy"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
          )}
          {overlay}
        </div>
        {children}
      </div>
    </section>
    </ExplodeContext.Provider>
  );
}

// Leaf parts that read the explode state; place them anywhere inside <ExplodeScrub>.
export function ExplodeSlider({ className = "explode-control" }: { className?: string }) {
  const x = useExplode();
  return (
    <div className={className}>
      <label htmlFor={x.id}>Explode</label>
      <input
        id={x.id}
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(x.p * 1000)}
        aria-valuetext={`${x.mm} millimetres apart`}
        onChange={(e) => x.slide(Number(e.target.value) / 1000)}
      />
    </div>
  );
}

export function ExplodeValue({ kind, pad = 0, className }: { kind: "mm" | "pct" | "parts"; pad?: number; className?: string }) {
  const x = useExplode();
  const v = kind === "mm" ? x.mm : kind === "pct" ? Math.round(x.p * 100) : x.parts;
  return <span className={className}>{String(v).padStart(pad, "0")}</span>;
}

/** Shows its children only while the explode is inside [from, to). */
export function ExplodeBeat({ from, to, children, className = "" }: { from: number; to: number; children: ReactNode; className?: string }) {
  const { p } = useExplode();
  const on = p >= from && (p < to || to >= 1);
  return <div className={`${className} transition-opacity duration-300 ease-(--ease-out) motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`}>{children}</div>;
}

/** A dimension line whose length follows the explode: arrowheads, rule, value in the middle. */
export function ExplodeDimension({ max = 60 }: { max?: number }) {
  const { p, mm } = useExplode();
  return (
    <div className="flex items-center" style={{ width: `${Math.max(8, p * max)}%` }} aria-hidden>
      <span className="h-0 w-0 border-y-[5px] border-r-[10px] border-y-transparent border-r-(--accent)" />
      <span className="h-px flex-1 bg-(--accent)" />
      <span className="readout px-2 text-(--accent)">{mm} mm</span>
      <span className="h-px flex-1 bg-(--accent)" />
      <span className="h-0 w-0 border-y-[5px] border-l-[10px] border-y-transparent border-l-(--accent)" />
    </div>
  );
}

function progressOf(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const run = el.offsetHeight - window.innerHeight;
  return run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
}
