"use client";

import { useState } from "react";
import { sound } from "@/lib/sound";
import type { Media } from "@/lib/work";
import type { Mode } from "./stage/engine";
import { Specimen } from "./stage/specimen";

export type ShelfItem = { m: Media; name: string; note: string; href: string };

const size = (bytes = 0) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);
const modes: [Mode, string][] = [
  ["solid", "Solid"],
  ["edges", "Edges"],
  ["xray", "X-ray"],
];

// Several live CAD models side by side, with one switch for all of them: solid shading, feature edges with hidden
// lines removed (a drawing), or see-through.
export function Shelf({ items }: { items: ShelfItem[] }) {
  const [mode, setMode] = useState<Mode>("solid");
  return (
    <div>
      <div role="group" aria-label="Render mode" className="flex flex-wrap gap-2">
        {modes.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={mode === k}
            onClick={() => {
              sound.clunk();
              setMode(k);
            }}
            className="btn"
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {items.map((i) => (
          <li key={i.m.src}>
            <Specimen m={i.m} mode={mode} className="bg-bg-2" />
            <h3 className="mt-3 text-lg font-semibold leading-snug">
              <a href={i.href} className="link">{i.name}</a>
            </h3>
            <p className="mt-1 text-muted">{i.note}</p>
            <p className="readout mt-2 text-muted">
              <span className="val">{i.m.parts}</span> {i.m.parts === 1 ? "part" : "parts"}, <span className="val">{size(i.m.bytes)}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
