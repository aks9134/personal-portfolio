"use client";

import { useSyncExternalStore } from "react";

// The page's switches live as attributes on <html> (data-motion, data-sound), applied before paint by
// the layout's inline script and changed by the Lights / Motion / Sound switches. This is the one place that
// watches them: components subscribe here instead of each keeping its own MutationObserver.
// v5 is dark only: the v4 Lights switch (data-theme) is gone, and a saved light preference is ignored.
export type Pref = "motion" | "sound";

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;
const reducedQuery = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

export function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!observer && typeof document !== "undefined") {
    observer = new MutationObserver(() => listeners.forEach((l) => l()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion", "data-sound"] });
    reducedQuery?.addEventListener("change", () => listeners.forEach((l) => l()));
  }
  return () => {
    listeners.delete(cb);
  };
}

// Sound is off unless switched on; motion is on unless switched off.
export function prefOn(k: Pref): boolean {
  const v = document.documentElement.dataset[k];
  return k === "motion" ? v !== "off" : v === "on";
}

export function setPref(k: Pref, on: boolean) {
  const v = on ? "on" : "off";
  document.documentElement.dataset[k] = v;
  try {
    localStorage.setItem(`pref-${k}`, v);
  } catch {
    /* private mode: the switch still works for this page */
  }
}

export const togglePref = (k: Pref) => setPref(k, !prefOn(k));

/** Motion allowed: the OS doesn't ask for reduced motion and the site's Motion switch isn't off. */
export function motionOk(): boolean {
  return typeof window !== "undefined" && !reducedQuery?.matches && prefOn("motion");
}

export function usePref(k: Pref): boolean {
  return useSyncExternalStore(subscribe, () => prefOn(k), () => k === "motion");
}

/** Live motionOk(); false during server render, so the static HTML is the still version. */
export function useMotionOk(): boolean {
  return useSyncExternalStore(subscribe, motionOk, () => false);
}
