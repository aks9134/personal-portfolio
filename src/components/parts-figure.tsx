"use client";
import { useState, type ReactNode } from "react";
import type { Media, Part } from "@/lib/work";
import { MediaImage } from "./media-image";
import { Tilt } from "./tilt";

// Numbered exploded view with its parts legend. Hover or focus a part name and it's ringed on the drawing.
// `children` render above the legend (result line, award), so they're on the first screen.
export function PartsFigure({ m, parts, priority = false, children, vt }: { m: Media; parts: Part[]; priority?: boolean; children?: ReactNode; vt?: string }) {
  const [on, setOn] = useState<number | null>(null);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_19rem] lg:items-start">
      <Tilt className="relative" max={4}>
        <MediaImage
          m={m}
          priority={priority}
          sizes="(min-width: 1024px) 68vw, 100vw"
          style={vt ? ({ viewTransitionName: vt } as React.CSSProperties) : undefined}
        />
        {parts.map((p) => (
          <span
            key={p.n}
            aria-hidden
            className={`pointer-events-none absolute size-14 rounded-full border-[3px] border-stamp transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none md:size-16 ${on === p.n ? "scale-100 opacity-100" : "scale-60 opacity-0"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, translate: "-50% -50%" }}
          />
        ))}
      </Tilt>
      <div>
        {children}
        <ol aria-label="Parts" className={`border-t-[1.5px] border-ink ${children ? "mt-6" : ""}`}>
          {parts.map((p) => (
            <li key={p.n} className="border-b border-rule-soft">
              <button
                type="button"
                onMouseEnter={() => setOn(p.n)}
                onMouseLeave={() => setOn(null)}
                onFocus={() => setOn(p.n)}
                onBlur={() => setOn(null)}
                className="grid w-full grid-cols-[1.75rem_1fr] items-baseline gap-x-2 py-2 text-left hover:bg-stock-2 focus-visible:bg-stock-2"
              >
                <span className="font-bold tabular-nums">{p.n}</span>
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-sm text-ink-2">{p.note}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
