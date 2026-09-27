"use client";

import type { RefObject } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";
import type { Stage } from "./engine";

// The pieces every 3D view shares: the poster that holds the space (and comes back if the GPU drops the model), the
// canvas (focusable: arrow keys turn it), and Turn buttons, the single-pointer alternative to dragging (WCAG 2.5.7).
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

export function TurnButtons({ stage, className = "" }: { stage: RefObject<Stage | null>; className?: string }) {
  const turn = (d: number) => stage.current?.turnBy(d);
  return (
    <div role="group" aria-label="Turn the model" className={`flex gap-1 ${className}`}>
      <button type="button" onClick={() => turn(30)} className="readout min-h-6 px-1.5 text-muted transition-colors duration-150 hover:text-fg">
        Turn left
      </button>
      <button type="button" onClick={() => turn(-30)} className="readout min-h-6 px-1.5 text-muted transition-colors duration-150 hover:text-fg">
        Turn right
      </button>
    </div>
  );
}
