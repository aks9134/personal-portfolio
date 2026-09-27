"use client";

import { useSyncExternalStore } from "react";

// Motion is allowed when the OS doesn't ask for reduced motion AND the site's Motion switch isn't off
// (html[data-motion="off"], set by the header control and applied before paint by the layout's script).
// Every script-driven animation checks this, so the site switch reaches canvas and WebGL motion too.
export function motionOk(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches && document.documentElement.dataset.motion !== "off";
}

function subscribe(cb: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    q.removeEventListener("change", cb);
    mo.disconnect();
  };
}

/** Live value of motionOk(); false during server render, so the static HTML is the still version. */
export function useMotionOk(): boolean {
  return useSyncExternalStore(subscribe, motionOk, () => false);
}

/** Calls cb whenever motion is switched on or off. */
export function onMotionChange(cb: (ok: boolean) => void) {
  return subscribe(() => cb(motionOk()));
}
