import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Blue ink stamp. Only for real status, the award, or the active part. Styles live in globals.css (.stamp).
// `still` skips the scroll-in landing, for a stamp that is already on the first screen.
export function Stamp({ children, tilt = -2, large = false, still = false, className }: { children: ReactNode; tilt?: number; large?: boolean; still?: boolean; className?: string }) {
  return (
    <span
      className={cn("stamp", still && "stamp-still", large ? "px-4 py-2 text-lg outline-solid outline-[1.5px] outline-offset-[3px] outline-stamp" : "text-xs", className)}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}

// Same tilt for the same text on every render, so stamps look hand-set but never jump.
export const tiltFor = (text: string) => ([...text].reduce((a, c) => a + c.charCodeAt(0), 0) % 7) - 3;
