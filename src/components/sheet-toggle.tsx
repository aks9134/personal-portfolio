"use client";

import { useEffect, useState } from "react";

// Day sheet or night sheet. The choice sticks in this browser; with no choice made, the system decides.
// Flipping wipes the new sheet in from the button, using a view transition where one is available.
type Sheet = "light" | "dark";

export function SheetToggle() {
  const [sheet, setSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem("sheet") as Sheet | null;
      } catch {
        return null;
      }
    })();
    setSheet(saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  const flip = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Sheet = sheet === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const r = e.currentTarget.getBoundingClientRect();
    root.style.setProperty("--flip-x", `${((r.left + r.width / 2) / window.innerWidth) * 100}%`);
    root.style.setProperty("--flip-y", `${((r.top + r.height / 2) / window.innerHeight) * 100}%`);

    const apply = () => {
      root.dataset.theme = next;
      setSheet(next);
      try {
        localStorage.setItem("sheet", next);
      } catch {
        /* private windows: the choice just won't stick */
      }
    };

    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }
    root.dataset.flipping = "";
    doc.startViewTransition(apply).finished.finally(() => delete root.dataset.flipping);
  };

  return (
    <button
      type="button"
      onClick={flip}
      className="font-semibold hover:underline"
      aria-pressed={sheet === "dark"}
      // Rendered empty on the server: the right label isn't known until the browser says which sheet it's on.
      suppressHydrationWarning
    >
      {sheet === null ? <span className="inline-block w-[4.5ch]" /> : sheet === "dark" ? "Day" : "Night"}
      <span className="sr-only"> sheet</span>
    </button>
  );
}
