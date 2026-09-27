"use client";

import { useSyncExternalStore } from "react";
import { sound } from "@/lib/sound";

// The bay's switches: Lights (light sheet), Motion (site-wide off switch on top of the OS setting), Sound (opt-in).
// Each writes an attribute on <html> and remembers it; the layout's inline script re-applies them before paint.
type Key = "theme" | "motion" | "sound";
const store: Record<Key, { attr: string; on: string; off: string; label: string }> = {
  theme: { attr: "theme", on: "light", off: "dark", label: "Lights" },
  motion: { attr: "motion", on: "on", off: "off", label: "Motion" },
  sound: { attr: "sound", on: "on", off: "off", label: "Sound" },
};

const read = (k: Key) => () => {
  const v = document.documentElement.dataset[store[k].attr];
  // Motion is on unless switched off; lights and sound are off unless switched on.
  return k === "motion" ? v !== "off" : v === store[k].on;
};
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-motion", "data-sound"] });
  return () => mo.disconnect();
};

export function setPref(k: Key, value: boolean) {
  const s = store[k];
  const v = value ? s.on : s.off;
  document.documentElement.dataset[s.attr] = v;
  try {
    localStorage.setItem(`pref-${k}`, v);
  } catch {
    /* private mode: the switch still works for this page */
  }
}

export function Switch({ k, className = "" }: { k: Key; className?: string }) {
  const value = useSyncExternalStore(subscribe, read(k), () => k === "motion");
  return (
    <button
      type="button"
      aria-pressed={value}
      onClick={() => {
        setPref(k, !value);
        if (k === "sound" && !value) sound.confirm();
        else sound.clunk();
      }}
      className={`readout inline-flex min-h-6 items-center gap-1.5 px-1 transition-colors duration-150 ${value ? "text-fg" : "text-muted"} hover:text-fg ${className}`}
    >
      <span aria-hidden className={`inline-block size-2 border border-current ${value ? "bg-accent border-accent" : ""}`} />
      {store[k].label}
    </button>
  );
}

export function Switches({ className = "" }: { className?: string }) {
  return (
    <div role="group" aria-label="Page settings" className={`flex items-center gap-3 ${className}`}>
      <Switch k="theme" />
      <Switch k="motion" />
      <Switch k="sound" />
    </div>
  );
}
