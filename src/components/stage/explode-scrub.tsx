"use client";

import { createContext, useContext, useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";
import { useMotionOk } from "@/lib/prefs";
import type { Media } from "@/lib/work";
import { parseOrbit, type Stage } from "./engine";
import { useStage } from "./use-stage";
import { ExplodeRange, StageCanvas, TurnButtons } from "./view";

type Ctx = { p: number; mm: number; parts: number; slide: (v: number) => void; stage: RefObject<Stage | null> };
const ExplodeContext = createContext<Ctx | null>(null);
const useExplode = () => {
  const c = useContext(ExplodeContext);
  if (!c) throw new Error("explode parts must sit inside <ExplodeScrub>");
  return c;
};

const SWING = 80; // degrees the camera travels around the model over the run
const RISE = -12; // degrees it rises over the run

// The take-apart. With motion allowed, a tall section (320 small-viewport heights, set in CSS as .explode-run) pins
// the model while scrolling through it pulls the assembly apart and swings the camera around it; the engine's
// framing follows the parts, so the drive fills the view at both ends. The Explode slider is the same control by
// hand: it scrolls the page to the matching point, so scroll and slider never disagree. With motion off (OS or site
// switch) the section is a normal figure and the slider alone moves the parts. Layout comes from CSS, so hydration
// never changes the page height. Overlay and children are server-rendered; the parts below (ExplodeValue,
// ExplodeSlider, ExplodeBeat, ExplodeTurn) read the state from context.
export function ExplodeScrub({ m, className = "", id, overlay, children }: { m: Media; className?: string; id?: string; overlay?: ReactNode; children?: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const pinned = useMotionOk();
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready } = useStage({ src: m.src, finish: "anodized", theta: o.theta, phi: o.phi, frame: 0.82, drag: true });
  const [p, setP] = useState(0);

  // Puts the model in the pose for progress v. Swinging the camera only happens on the scroll path.
  const apply = (v: number, swing: boolean) => {
    setP((prev) => (Math.abs(prev - v) < 0.0005 ? prev : v));
    const s = stage.current;
    if (!s) return;
    s.setExplode(v);
    if (swing) s.setAngles(o.theta + SWING * v, o.phi + RISE * v);
  };
  const pose = useEffectEvent(apply); // the same, for the effects below (always sees the latest render)

  // A freshly built stage takes the current pose.
  useEffect(() => {
    if (ready && section.current) pose(pinned ? progressOf(section.current) : p, pinned);
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
      pose(progressOf(el), true);
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
    } else apply(v, false);
  };

  return (
    <ExplodeContext.Provider value={{ p, mm: Math.round(p * (m.explode ?? 0)), parts: m.parts ?? 0, slide, stage }}>
      <section ref={section} id={id} className={`explode-run ${className}`}>
        <div className="explode-sticky">
          <div ref={box} className="explode-stage">
            <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="100vw" label={`${m.alt}, ${m.parts} parts`} />
            {overlay}
          </div>
          {children}
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

export function ExplodeSlider({ className }: { className?: string }) {
  const x = useExplode();
  return <ExplodeRange value={x.p} mm={x.mm} onChange={x.slide} className={className} />;
}

/** The Turn buttons for the model, placed wherever the page puts them. */
export function ExplodeTurn({ className = "" }: { className?: string }) {
  return <TurnButtons stage={useExplode().stage} className={className} />;
}

export function ExplodeValue({ kind, pad = 0 }: { kind: "mm" | "pct" | "parts"; pad?: number }) {
  const x = useExplode();
  const v = kind === "mm" ? x.mm : kind === "pct" ? Math.round(x.p * 100) : x.parts;
  return <>{String(v).padStart(pad, "0")}</>;
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
