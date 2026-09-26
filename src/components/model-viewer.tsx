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

type MV = HTMLElement & { currentTime: number; pause: () => void };
const FIGURE_SPACE = " "; // as wide as a digit, so "5% apart" and "60% apart" line up
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2); // ease-in-out: on-screen movement

// A 3D model that costs nothing until asked for: poster and a load button first, then <model-viewer>
// (self-hosted, meshopt decoder from /vendor). Rotate only: zoom and pan are off so the page scroll is never trapped.
// `explode`: the GLB carries a one-second "explode" animation (scripts/media/build.mjs), and a slider scrubs it,
// so the assembly comes apart like an exploded drawing. model-viewer only redraws when the time changes.
export function ModelViewer({ m, explode = Boolean(m.explode) }: { m: Media; explode?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [apart, setApart] = useState(0);
  const viewer = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const demo = useRef(0);

  async function load() {
    if (state === "loading") return; // aria-disabled, not disabled, so keyboard focus stays on the button while it loads
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
        slider.current?.focus({ preventScroll: true });
        // Once, just after loading: the drive comes apart to 60% and settles, so the slider's job is obvious.
        // Only the model moves (the slider value is set once at the end), any touch stops it, reduced motion skips it.
        if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
          const t0 = performance.now();
          const step = (now: number) => {
            const k = Math.min(1, (now - t0) / 1400);
            (el as MV).currentTime = ease(k) * 0.6 * 0.999;
            demo.current = k < 1 ? requestAnimationFrame(step) : 0;
            if (k === 1) setApart(60);
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
    el.addEventListener("poster-dismissed", ready);
    el.addEventListener("error", failed);
    return () => {
      el.removeEventListener("poster-dismissed", ready);
      el.removeEventListener("error", failed);
    };
  }, [state, explode]);

  const stopDemo = () => {
    if (demo.current) cancelAnimationFrame(demo.current);
    demo.current = 0;
  };
  useEffect(() => stopDemo, []);

  // The slider sets the animation time directly; the end of the clip is nudged back a hair, because at exactly
  // one second the animation wraps to the start.
  useEffect(() => {
    const el = viewer.current as MV | null;
    if (explode && state === "ready" && el && !demo.current) el.currentTime = (apart / 100) * 0.999;
  }, [apart, state, explode]);

  const live = state === "loading" || state === "ready";
  return (
    <div>
      <div ref={frame} className="plate relative aspect-[4/3] w-full border-[1.5px] border-ink">
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
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4">
          <label htmlFor={`${m.src}-apart`} className="text-sm font-bold">Explode</label>
          <input
            ref={slider}
            id={`${m.src}-apart`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={apart}
            aria-valuetext={`${apart}% apart`}
            onChange={(e) => {
              stopDemo();
              setApart(Number(e.target.value));
            }}
            className="explode-range"
          />
          <output htmlFor={`${m.src}-apart`} className="font-mono text-sm tabular-nums">
            {m.parts} parts, {String(apart).padStart(3, FIGURE_SPACE)}% apart
          </output>
        </div>
      )}
      <p role="status" className="mt-2 text-sm text-ink-2">
        {state === "ready" ? (explode ? "Drag to rotate. The slider pulls the parts apart along the shaft." : "Drag to rotate, or use the arrow keys.") : state === "loading" ? <span className="sr-only">Loading the 3D model.</span> : state === "error" ? <span className="sr-only">The 3D model didn't load.</span> : null}
      </p>
    </div>
  );
}
