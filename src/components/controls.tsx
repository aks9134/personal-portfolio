"use client";

import { type Pref, setPref, usePref } from "@/lib/prefs";
import { sound } from "@/lib/sound";

// The bay's switches: Lights (light sheet), Motion (site-wide off switch on top of the OS setting), Sound (opt-in).
// Each writes an attribute on <html> and remembers it (src/lib/prefs.ts).
const labels: Record<Pref, string> = { theme: "Lights", motion: "Motion", sound: "Sound" };

export function Switch({ k }: { k: Pref }) {
  const on = usePref(k);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        setPref(k, !on);
        if (k === "sound" && !on) sound.confirm();
        else sound.clunk();
      }}
      className={`readout-btn gap-1.5 ${on ? "text-fg" : ""}`}
    >
      <span aria-hidden className={`inline-block size-2 border ${on ? "border-accent bg-accent" : "border-current"}`} />
      {labels[k]}
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
