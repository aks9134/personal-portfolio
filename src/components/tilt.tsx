"use client";
import { useRef, type ReactNode } from "react";

// Renders sit on the sheet like a part under a lamp: move the pointer and the drawing leans toward it.
// Mouse only (a finger would fight scrolling), off under reduced motion, and the transform is the only
// thing that changes, so it stays on the compositor.
export function Tilt({ children, className = "", max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  return (
    <div
      ref={ref}
      className={`[perspective:1400px] ${className}`}
      onPointerMove={(e) => {
        if (!allowed()) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
        el.style.setProperty("--lift", "1.015");
      }}
      onPointerLeave={() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--lift", "1");
      }}
    >
      <div className="transition-transform duration-300 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_scale(var(--lift,1))] motion-reduce:!transform-none">
        {children}
      </div>
    </div>
  );
}
