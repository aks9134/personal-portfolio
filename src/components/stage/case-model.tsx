"use client";

import { useEffect, useId, useState } from "react";
import { sound } from "@/lib/sound";
import type { Media } from "@/lib/work";
import { cssColor, parseOrbit, type Mode } from "./engine";
import { useStage } from "./use-stage";
import { StageCanvas, TurnButtons } from "./view";

const BIG = 1.5e6; // bytes: above this, or with the browser's data saver on, the model waits to be asked for
const size = (bytes = 0) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);
const modes: [Mode, string][] = [
  ["solid", "Solid"],
  ["edges", "Edges"],
  ["xray", "X-ray"],
];

// A design generation in a case study, live: drag or arrow keys turn it, Solid / Edges / X-ray change how it is
// drawn, and a model that carries an exploded view gets the Explode slider with the farthest part's travel in mm.
// Small models build when scrolled near; big ones (and any on a data-saving connection) show their poster and a
// Load button with the download size.
export function CaseModel({ m }: { m: Media }) {
  const [asked, setAsked] = useState(false);
  const [auto, setAuto] = useState(false);
  const [mode, setMode] = useState<Mode>("solid");
  const [apart, setApart] = useState(0);
  const id = useId();
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready, loaded } = useStage(
    { src: m.src, finish: m.explode ? "anodized" : "aluminium", theta: o.theta, phi: o.phi, frameExploded: Boolean(m.explode), drag: true, exposure: 1.1 },
    { enabled: auto || asked },
  );

  useEffect(() => {
    const saver = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    setAuto(!saver && (m.bytes ?? 0) <= BIG);
  }, [m.bytes]);

  useEffect(() => {
    const el = box.current;
    const s = stage.current;
    if (!ready || !el || !s) return;
    s.setMode(mode, cssColor(el, "--fg"));
    const mo = new MutationObserver(() => s.setMode(mode, cssColor(el, "--fg")));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [mode, ready, gen, box, stage]);

  useEffect(() => {
    const s = stage.current;
    if (!ready || !s || !m.explode) return;
    s.setExplode(apart);
    s.setZoom(0.7 + 0.3 * Math.min(1, apart * 1.4));
  }, [apart, ready, gen, stage, m.explode]);

  const waiting = !auto && !asked;
  const mm = Math.round(apart * (m.explode ?? 0));
  return (
    <div>
      <div ref={box} className="relative w-full bg-bg-2" style={{ aspectRatio: `${m.width} / ${m.height}` }}>
        <StageCanvas m={m} canvas={canvas} gen={gen} ready={ready} sizes="(min-width: 900px) 860px, 100vw" />
        {waiting && (
          <button
            type="button"
            onClick={() => {
              sound.clunk();
              setAsked(true);
            }}
            className="btn absolute bottom-3 left-3 bg-bg"
          >
            Load 3D model ({size(m.bytes)})<span className="sr-only">: {m.alt}</span>
          </button>
        )}
        {asked && !ready && (
          <p role="status" className="readout absolute bottom-3 left-3 bg-bg px-2 py-1">
            Loading <span className="val">{Math.round(loaded * 100)} %</span>
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label="Render mode" className="flex gap-2">
          {modes.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={mode === k} disabled={!ready} onClick={() => setMode(k)} className="btn disabled:opacity-40">
              {label}
            </button>
          ))}
        </div>
        <TurnButtons stage={stage} />
      </div>
      {m.explode ? (
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6">
          <div className="explode-control">
            <label htmlFor={id}>Explode</label>
            <input
              id={id}
              type="range"
              min={0}
              max={1000}
              value={Math.round(apart * 1000)}
              disabled={!ready}
              aria-valuetext={`${mm} millimetres apart`}
              onChange={(e) => setApart(Number(e.target.value) / 1000)}
            />
          </div>
          <p className="readout text-muted">
            <span className="val">{m.parts}</span> parts, <span className="val">{String(mm).padStart(3, "0")}</span> mm apart
          </p>
        </div>
      ) : (
        <p className="readout mt-2 text-muted">
          <span className="val">{m.parts}</span> {m.parts === 1 ? "part" : "parts"}, <span className="val">{size(m.bytes)}</span>
        </p>
      )}
    </div>
  );
}
