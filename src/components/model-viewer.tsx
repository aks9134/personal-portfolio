"use client";

import { useEffect, useRef, useState } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        alt?: string;
        "camera-controls"?: string;
        "camera-orbit"?: string;
        "disable-zoom"?: string;
        "disable-pan"?: string;
        "interaction-prompt"?: string;
        "touch-action"?: string;
        "auto-rotate"?: string;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        exposure?: string;
        loading?: string;
        reveal?: string;
        orientation?: string;
        "animation-name"?: string;
        "field-of-view"?: string;
        "max-field-of-view"?: string;
      };
    }
  }
}

const size = (bytes = 0) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);

type MV = HTMLElement & {
  currentTime: number;
  pause: () => void;
  cameraOrbit: string;
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  jumpCameraToGoal: () => void;
};
const FIGURE_SPACE = "\u2007"; // as wide as a digit, so "5 mm apart" and "60 mm apart" line up
const easeOut = (t: number) => 1 - (1 - t) ** 4; // strong ease-out: the parts move at once, then settle
const DEMO = 60; // % apart the one-time demo settles at

// A 3D model that costs nothing until asked for: poster and a load button first, then <model-viewer>
// (self-hosted, meshopt decoder from /vendor). Rotate only: zoom and pan are off so the page scroll is never trapped.
// `explode`: the GLB carries a one-second "explode" animation (scripts/media/build.mjs), and a slider scrubs it,
// so the assembly comes apart like an exploded drawing. The readout gives the farthest part's travel in CAD
// millimetres. model-viewer only redraws when the time changes. The frame takes the poster's shape (16:9 for
// long assemblies), so poster and live model line up.
export function ModelViewer({ m, explode = Boolean(m.explode) }: { m: Media; explode?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [apart, setApart] = useState(0);
  const viewer = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const demo = useRef(0);
  const focusSlider = useRef(false);
  const viaKeyboard = useRef(false);

  async function load(e: React.MouseEvent) {
    if (state === "loading") return; // aria-disabled, not disabled, so keyboard focus stays on the button while it loads
    viaKeyboard.current = e.detail === 0; // Enter or Space on a button fires a click with no pointer detail
    setState("loading");
    const w = window as unknown as { ModelViewerElement?: { meshoptDecoderLocation?: string } };
    w.ModelViewerElement = { ...w.ModelViewerElement, meshoptDecoderLocation: "/vendor/meshopt_decoder.js" };
    try {
      await import("@google/model-viewer");
    } catch {
      setState("error");
    }
  }

  // model-viewer fires poster-dismissed the moment it reveals the model: fade our poster out on the same frame.
  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const ready = () => {
      setState("ready");
      if (explode) {
        (el as MV).pause();
        // Keyboard and screen-reader users land on the slider, the one control that does something new here.
        // It renders with the "ready" state, so the focus move waits for it (effect below). Same rule as the model:
        // only if focus is still on this viewer.
        const at = document.activeElement;
        focusSlider.current = !at || at === document.body || Boolean(frame.current?.contains(at));
        // Once, just after a pointer load: the assembly comes apart to 60% in a second, slider and readout moving
        // with it, so the slider's job is obvious. Any touch stops it where it is. Skipped under reduced motion, and
        // for a keyboard load: that visitor is already on the slider, and a moving value would be read out.
        if (!viaKeyboard.current && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
          const t0 = performance.now();
          const step = (now: number) => {
            const k = Math.min(1, (now - t0) / 1000);
            const v = easeOut(k) * DEMO;
            (el as MV).currentTime = (v / 100) * 0.999;
            setApart(Math.round(v));
            demo.current = k < 1 ? requestAnimationFrame(step) : 0;
          };
          demo.current = requestAnimationFrame(step);
        }
        return;
      }
      // The load button is about to go, so keep its keyboard user on the model (its focusable part lives in the
      // shadow root). Only if focus is still here: someone who tabbed on while it loaded stays where they are.
      const at = document.activeElement;
      if (!at || at === document.body || frame.current?.contains(at)) {
        el.shadowRoot?.querySelector<HTMLElement>(".userInput")?.focus({ preventScroll: true });
      }
    };
    const failed = () => setState("error");
    // A long exploded assembly is framed by model-viewer for its full explode, so the camera is pulled in by the
    // same factor the poster was rendered with (m.frame), before the model is revealed.
    const framed = () => {
      if (!m.frame || m.frame === 1) return;
      const mv = el as MV;
      const o = mv.getCameraOrbit();
      mv.setAttribute("min-camera-orbit", "auto auto 0m");
      mv.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius * m.frame}m`;
      mv.jumpCameraToGoal();
    };
    el.addEventListener("load", framed);
    el.addEventListener("poster-dismissed", ready);
    el.addEventListener("error", failed);
    return () => {
      el.removeEventListener("load", framed);
      el.removeEventListener("poster-dismissed", ready);
      el.removeEventListener("error", failed);
    };
  }, [state, explode, m.frame]);

  useEffect(() => {
    if (state === "ready" && focusSlider.current) {
      focusSlider.current = false;
      slider.current?.focus({ preventScroll: true });
    }
  }, [state]);

  // Stopping leaves the slider where the model is, so the next nudge carries on from there.
  const stopDemo = () => {
    if (!demo.current) return;
    cancelAnimationFrame(demo.current);
    demo.current = 0;
    const el = viewer.current as MV | null;
    if (el) setApart(Math.round((el.currentTime / 0.999) * 100));
  };
  useEffect(() => stopDemo, []);

  // The slider sets the animation time directly; the end of the clip is nudged back a hair, because at exactly
  // one second the animation wraps to the start.
  useEffect(() => {
    const el = viewer.current as MV | null;
    if (explode && state === "ready" && el && !demo.current) el.currentTime = (apart / 100) * 0.999;
  }, [apart, state, explode]);

  const live = state === "loading" || state === "ready";
  const mm = Math.round((apart / 100) * (m.explode ?? 0));
  return (
    <div>
      <div ref={frame} className="plate relative w-full border-[1.5px] border-ink" style={{ aspectRatio: `${m.width} / ${m.height}` }}>
        {live && (
          <model-viewer
            ref={viewer}
            src={m.src}
            alt={m.alt}
            camera-controls=""
            disable-zoom=""
            disable-pan=""
            interaction-prompt="none"
            touch-action="pan-y"
            {...(m.orbit && { "camera-orbit": m.orbit })}
            {...(explode && { "animation-name": "explode" })}
            onPointerDown={stopDemo}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <div slot="progress-bar" />
          </model-viewer>
        )}
        {m.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.poster}
            srcSet={srcSet(m.poster, m.width)}
            sizes="(min-width: 800px) 768px, 100vw"
            width={m.width}
            height={m.height}
            alt=""
            decoding="async"
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ease-(--ease-out) motion-reduce:transition-none ${state === "ready" ? "opacity-0" : ""}`}
          />
        )}
        {state !== "ready" && (
          <button
            type="button"
            onClick={load}
            aria-disabled={state === "loading"}
            className="group absolute inset-0 flex items-end p-3 text-left aria-disabled:cursor-progress"
          >
            <span className="border-[1.5px] border-ink bg-stock px-3 py-1.5 text-sm font-bold transition-transform duration-150 ease-(--ease-out) group-hover:bg-ink group-hover:text-stock group-active:scale-[0.97] group-aria-disabled:bg-stock group-aria-disabled:text-ink">
              {state === "loading" ? "Loading 3D model…" : state === "error" ? "The model didn't load. Try again" : explode ? `Take it apart (${size(m.bytes)})` : `Load 3D model (${size(m.bytes)})`}
            </span>
            {/* The three buttons on a page would otherwise sound alike to a screen reader. */}
            <span className="sr-only">: {m.alt}</span>
          </button>
        )}
      </div>
      {explode && state === "ready" && (
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <label htmlFor={`${m.src}-apart`} className="text-sm font-bold">Explode</label>
          <input
            ref={slider}
            id={`${m.src}-apart`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={apart}
            aria-valuetext={`${mm} millimetres apart`}
            onChange={(e) => {
              stopDemo();
              setApart(Number(e.target.value));
            }}
            className="explode-range"
          />
          {/* aria-live off: the slider already speaks its value, so the readout would say every step twice. */}
          <output htmlFor={`${m.src}-apart`} aria-live="off" className="col-span-2 font-mono text-sm tabular-nums sm:col-span-1">
            {m.parts} parts, {String(mm).padStart(String(m.explode ?? 0).length, FIGURE_SPACE)} mm apart
          </output>
        </div>
      )}
      <p role="status" className="mt-2 text-sm text-ink-2">
        {state === "ready" ? (explode ? "Drag to rotate. The slider pulls the parts apart along the shaft." : "Drag to rotate, or use the arrow keys.") : state === "loading" ? <span className="sr-only">Loading the 3D model.</span> : state === "error" ? <span className="sr-only">The 3D model didn't load.</span> : null}
      </p>
    </div>
  );
}
