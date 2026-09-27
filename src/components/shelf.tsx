"use client";

import { useState } from "react";
import type { Media } from "@/lib/work";
import type { Mode } from "./stage/engine";
import { Specimen } from "./stage/specimen";
import { ModeButtons, PartsReadout } from "./stage/view";

export type ShelfItem = { m: Media; name: string; note: string; href: string };

// Several live CAD models side by side, with one switch for all of them: solid shading, feature edges with hidden
// lines removed (a drawing), or see-through.
export function Shelf({ items }: { items: ShelfItem[] }) {
  const [mode, setMode] = useState<Mode>("solid");
  return (
    <div>
      <ModeButtons mode={mode} onChange={setMode} />
      <ul className="mt-8 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {items.map((i) => (
          <li key={i.m.src}>
            <Specimen m={i.m} mode={mode} className="bg-bg-2" />
            <h3 className="mt-3 text-lg font-semibold leading-snug">
              <a href={i.href} className="link">{i.name}</a>
            </h3>
            <p className="mt-1 text-muted">{i.note}</p>
            <PartsReadout m={i.m} className="mt-2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
