"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motionOk, useMotionOk } from "@/lib/motion";
import type { Media } from "@/lib/work";
import { type Finish, parseOrbit } from "./engine";
import { useStage } from "./use-stage";
import { StageCanvas, TurnButtons } from "./view";

type Readout = { p: number; mm: number; parts: number; ready: boolean };
type Ctx = Readout & { slide: (v: number) => void; id: string };
const ExplodeContext = createContext<Ctx | null>(null);
const useExplode = () => {
  const c = useContext(ExplodeContext);
  if (!c) throw new Error("explode parts must sit inside <ExplodeScrub>");
  return c;
};

// The take-apart. With motion allowed, a tall section pins the model while scrolling through it pulls the assembly
// apart, swings the camera around it and pulls back so it stays in frame. The Explode slider is the same control by
// hand: it scrolls the page to the matching point, so scroll and slider never disagree. With motion off (OS or site
// switch) the section is a normal figure and the slider alone moves the parts. Layout comes from CSS (.explode-run),
// so hydration never changes the page height. Overlay and children are server-rendered; the readout parts below
// (ExplodeValue, ExplodeSlider, ExplodeBeat, ExplodeDimension) read the state from context.
export function ExplodeScrub({
  m,
  finish = "cad",
  swing = 80,
  tilt = -12,
  length = 3.2,
  className = "",
  id: anchor,
  overlay,
  children,
}: {
  m: Media;
  finish?: Finish;
  swing?: number; // degrees the camera travels around the model over the run
  tilt?: number; // degrees it rises (negative) or falls over the run
  length?: number; // section height in small-viewport heights
  className?: string;
  id?: string;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const section = useRef<HTMLElement>(null);
  const pinned = useMotionOk();
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready } = useStage({ src: m.src, finish, theta: o.theta, phi: o.phi, frameExploded: true, drag: true });
  const [p, setP] = useState(0);
  const id = useId();
  const travel = m.explode ?? 0;

  // Puts the model in the pose for progress v. Swinging the camera only happens on the scroll path.
  const pose = (v: number, swingIt: boolean) => {
    const s = stage.current;
    setP((prev) => (Math.abs(prev - v) < 0.0005 ? prev : v));
    if (!s) return;
    s.setExplode(v);
    // Start close on the assembled drive and pull back as it spreads, so it fills the frame at both ends.
    s.setZoom(0.62 + 0.38 * Math.min(1, v * 1.4));
    if (swingIt) s.setAngles(o.theta + swing * v, o.phi + tilt * v);
  };
  const poseRef = useRef(pose);
  poseRef.current = pose;

  // A freshly built stage takes the current pose.
  useEffect(() => {
    if (ready && section.current) poseRef.current(pinned ? progressOf(section.current) : p, pinned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, gen]);

  // Scroll drives the explode while pinned: one layout read per frame, only while the section is near.
  useEffect(() => {
    if (!pinned) return;
    const el = section.current!;
    let raf = 0;
    let near = false;
    const tick = () => {
      raf = 0;
      if (motionOk()) poseRef.current(progressOf(el), true);
    };
    const on = () => {
      if (near && !raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting;
      on();
    }, { rootMargin: "50% 0px" });
    io.observe(el);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [pinned]);

  const slide = (v: number) => {
    const el = section.current!;
    if (pinned) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + v * (el.offsetHeight - window.innerHeight), behavior: "instant" });
    } else pose(v, false);
  };

  const r: Ctx = { p, mm: Math.round(p * travel), parts: m.parts ?? 0, ready, slide, id };
  return (
    <ExplodeContext.Provider value={r}>
      <section ref={section} id={anchor} className={`explode-run ${className}`} style={{ ["--run" as string]: `${length * 100}svh` }}>
        <div className="explode-sticky">
          <div ref={box} className="explode-stage">
            <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="100vw" label={`${m.alt}, ${m.parts} parts`} />
            {overlay}
          </div>
          {children}
          <TurnButtons stage={stage} className="absolute right-4 bottom-6 md:right-8" />
        </div>
      </section>
    </ExplodeContext.Provider>
  );
}

function progressOf(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const run = el.offsetHeight - window.innerHeight;
  return run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
}

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

/** Shows its children only while the explode is inside [from, to); hidden beats are inert, so nothing reads or focuses them. */
export function ExplodeBeat({ from, to, children, className = "" }: { from: number; to: number; children: ReactNode; className?: string }) {
  const { p } = useExplode();
  const on = p >= from && (p < to || to >= 1);
  return (
    <div inert={!on} className={`${className} transition-opacity duration-300 ease-(--ease-out) ${on ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

/** A dimension line whose length follows the explode: arrowheads, rule, value in the middle. */
export function ExplodeDimension({ max = 60 }: { max?: number }) {
  const { p, mm } = useExplode();
  return (
    <div className="flex items-center" style={{ width: `${Math.max(10, p * max)}%` }} aria-hidden>
      <span className="h-0 w-0 border-y-[5px] border-r-[10px] border-y-transparent border-r-accent" />
      <span className="h-px flex-1 bg-accent" />
      <span className="readout px-2 text-accent">{mm} mm</span>
      <span className="h-px flex-1 bg-accent" />
      <span className="h-0 w-0 border-y-[5px] border-l-[10px] border-y-transparent border-l-accent" />
    </div>
  );
}
