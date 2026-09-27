"use client";

import { useEffect, useRef, useState } from "react";
import { srcSet } from "@/lib/image-widths";
import { motionOk, useMotionOk } from "@/lib/motion";
import { sound } from "@/lib/sound";
import type { Media } from "@/lib/work";
import { Scramble } from "./scramble";

export type IndexRow = { slug: string; title: string; context: string; year: string; status: string; line: string; still: Media };

// The case studies as a list set large. With a mouse, the project's picture rides beside the pointer while a row is
// hovered (it never covers the row's text, and it isn't needed: every row says what it is). Touch and keyboard
// visitors get the same rows without it, and so does anyone with motion off.
export function WorkIndex({ rows }: { rows: IndexRow[] }) {
  const [on, setOn] = useState<number | null>(null);
  const plate = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(false);
  const moving = useMotionOk();

  useEffect(() => {
    const q = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setFine(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (!fine) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          const el = plate.current;
          if (el && motionOk()) el.style.transform = `translate3d(${x + 28}px, ${y - el.offsetHeight / 2}px, 0)`;
        });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [fine]);

  return (
    <div onPointerLeave={() => setOn(null)}>
      <ol>
        {rows.map((r, i) => (
          <li key={r.slug} className="border-t border-rule">
            <a
              href={`/work/${r.slug}`}
              onPointerEnter={() => {
                setOn(i);
                sound.tick();
              }}
              onFocus={() => setOn(null)}
              className="group grid gap-x-8 gap-y-2 py-6 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,22rem)] md:items-baseline"
            >
              <span className="readout text-muted">{r.year}</span>
              <span>
                <span className="display block text-[clamp(2.5rem,6vw,5rem)] transition-colors duration-150 group-hover:text-accent" style={{ viewTransitionName: `t-${r.slug}` }}>
                  <Scramble text={r.title} />
                </span>
                <span className="mt-2 block max-w-[60ch] text-muted">{r.line}</span>
              </span>
              <span className="readout text-muted md:text-right">
                {r.context}
                <span className="val block">{r.status}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      {fine && moving && (
        // A viewport-sized clip layer, so the picture can never widen the page.
        <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        <div
          ref={plate}
          className={`absolute top-0 left-0 w-[22rem] border border-rule bg-bg-2 p-3 transition-opacity duration-200 ${on === null ? "opacity-0" : "opacity-100"}`}
        >
          {rows.map((r, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={r.slug}
              src={r.still.src}
              srcSet={srcSet(r.still.src, r.still.width)}
              sizes="22rem"
              width={r.still.width}
              height={r.still.height}
              alt=""
              loading="lazy"
              decoding="async"
              className={`mx-auto max-h-64 w-auto object-contain ${on === i ? "block" : "hidden"}`}
            />
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
