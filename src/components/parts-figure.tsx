"use client";
import { useState, type ReactNode } from "react";
import { sound } from "@/lib/sound";
import type { Media, Part } from "@/lib/work";
import { MediaImage } from "./media-image";

// Numbered exploded view with its parts legend, like a drawing's balloons and parts list. Hover or focus a part and
// an amber balloon rings it on the drawing. `children` render above the legend (result line, award).
export function PartsFigure({ m, parts, priority = false, children, vt }: { m: Media; parts: Part[]; priority?: boolean; children?: ReactNode; vt?: string }) {
  const [on, setOn] = useState<number | null>(null);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="relative">
        <MediaImage m={m} priority={priority} sizes="(min-width: 1024px) 68vw, 100vw" style={vt ? ({ viewTransitionName: vt } as React.CSSProperties) : undefined} />
        {parts.map((p) => (
          <span
            key={p.n}
            aria-hidden
            className={`pointer-events-none absolute size-14 rounded-full border-[3px] border-accent transition-[opacity,scale] duration-200 ease-(--ease-out) md:size-16 ${on === p.n ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, translate: "-50% -50%" }}
          />
        ))}
      </div>
      <div>
        {children}
        <ol aria-label="Parts" className={`border-t border-rule-strong ${children ? "mt-6" : ""}`}>
          {parts.map((p) => (
            <li key={p.n} className="border-b border-rule">
              <button
                type="button"
                onMouseEnter={() => {
                  setOn(p.n);
                  sound.tick();
                }}
                onMouseLeave={() => setOn(null)}
                onFocus={() => setOn(p.n)}
                onBlur={() => setOn(null)}
                className={`grid w-full grid-cols-[2rem_1fr] items-baseline gap-x-2 px-1 py-2.5 text-left transition-colors duration-150 ${on === p.n ? "bg-bg-2" : ""}`}
              >
                <span className="readout val">{String(p.n).padStart(2, "0")}</span>
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted">{p.note}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
