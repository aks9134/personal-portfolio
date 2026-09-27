"use client";

import { useId, type RefObject } from "react";
import { srcSet } from "@/lib/image-widths";
import { sound } from "@/lib/sound";
import type { Media } from "@/lib/work";
import type { Mode, Stage } from "./engine";

// The pieces every 3D view shares: the poster that holds the space (and comes back if the GPU drops the model), the
// canvas (focusable: arrow keys turn it), Turn buttons (the single-pointer alternative to dragging, WCAG 2.5.7), the
// render-mode switch, the Explode slider and the parts/size readout.
export function StageCanvas({
  m,
  canvas,
  gen,
  ready,
  sizes,
  priority = false,
  label,
}: {
  m: Media;
  canvas: RefObject<HTMLCanvasElement | null>;
  gen: number;
  ready: boolean;
  sizes: string;
  priority?: boolean;
  label?: string;
}) {
  return (
    <>
      <canvas
        key={gen}
        ref={canvas}
        role="img"
        tabIndex={0}
        aria-label={`${label ?? m.alt ?? "3D model"}. Drag, or use the arrow keys, to turn it.`}
        className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-300 ease-(--ease-out) active:cursor-grabbing ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {m.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.poster}
          srcSet={srcSet(m.poster, m.width)}
          sizes={sizes}
          width={m.width}
          height={m.height}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-(--ease-out) ${ready ? "opacity-0" : "opacity-100"}`}
        />
      )}
    </>
  );
}

const turns: [string, number][] = [
  ["Turn left", 30],
  ["Turn right", -30],
];

export function TurnButtons({ stage, className = "" }: { stage: RefObject<Stage | null>; className?: string }) {
  return (
    <div role="group" aria-label="Turn the model" className={`flex gap-1 ${className}`}>
      {turns.map(([label, d]) => (
        <button key={label} type="button" onClick={() => stage.current?.turnBy(d)} className="readout-btn">
          {label}
        </button>
      ))}
    </div>
  );
}

const modes: [Mode, string][] = [
  ["solid", "Solid"],
  ["edges", "Edges"],
  ["xray", "X-ray"],
];

export function ModeButtons({ mode, onChange, disabled = false }: { mode: Mode; onChange: (m: Mode) => void; disabled?: boolean }) {
  return (
    <div role="group" aria-label="Render mode" className="flex flex-wrap gap-2">
      {modes.map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={mode === k}
          disabled={disabled}
          onClick={() => {
            sound.clunk();
            onChange(k);
          }}
          className="btn disabled:opacity-40"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** The Explode slider: 0 to 1 in thousandths, read out to a screen reader as millimetres apart. */
export function ExplodeRange({ value, mm, onChange, disabled = false, className = "explode-control" }: { value: number; mm: number; onChange: (v: number) => void; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id}>Explode</label>
      <input
        id={id}
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(value * 1000)}
        disabled={disabled}
        aria-valuetext={`${mm} millimetres apart`}
        onChange={(e) => onChange(Number(e.target.value) / 1000)}
      />
    </div>
  );
}

export const sizeLabel = (bytes = 0) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);

/** "248 parts, 3.2 MB" as an instrument readout. */
export function PartsReadout({ m, className = "" }: { m: Media; className?: string }) {
  return (
    <p className={`readout text-muted ${className}`}>
      <span className="val">{m.parts}</span> {m.parts === 1 ? "part" : "parts"}, <span className="val">{sizeLabel(m.bytes)}</span>
    </p>
  );
}
