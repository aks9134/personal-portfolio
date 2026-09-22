"use client";
import { useEffect, useRef } from "react";

// The name is set in Archivo's variable width axis. It opens narrow and widens letter by letter, like a
// drawing being stretched to fit its title block, then tracks the pointer: letters near the cursor widen.
// Server-rendered wide and static, so without JS (or under reduced motion) it's just the heading.
const WIDE = 112;
const NARROW = 62;

export function KineticName({ name, className }: { name: string; className: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!motionOk.matches) return;

    const letters = [...el.querySelectorAll<HTMLElement>("[data-letter]")];
    let cancelled = false;
    let detach: (() => void) | undefined;

    (async () => {
      const { animate, stagger } = await import("animejs");
      if (cancelled) return;

      animate(letters, {
        "--wdth": [NARROW, WIDE],
        opacity: [0, 1],
        translateY: ["0.14em", "0em"],
        duration: 900,
        delay: stagger(38),
        ease: "outExpo",
      });

      if (!fine.matches) return;
      // Pointer tracking: each letter's width eases toward how close the cursor is to it.
      const onMove = (e: PointerEvent) => {
        for (const l of letters) {
          const r = l.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          const pull = Math.max(0, 1 - d / 240);
          l.style.setProperty("--wdth", String(WIDE + pull * 13));
        }
      };
      const onLeave = () => {
        animate(letters, { "--wdth": WIDE, duration: 420, ease: "outQuad" });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      detach = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    })();

    return () => {
      cancelled = true;
      detach?.();
    };
  }, []);

  return (
    <h1 ref={ref} className={className} aria-label={name}>
      {[...name].map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden
          data-letter
          className="inline-block [font-variation-settings:'wdth'_var(--wdth)] [will-change:font-variation-settings]"
          style={{ "--wdth": WIDE } as React.CSSProperties}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </h1>
  );
}
