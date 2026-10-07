"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { sound } from "@/lib/sound";
import type { Media } from "@/lib/work";
import { parseOrbit, type Mode } from "./engine";
import { useInk, useStage } from "./use-stage";
import { ExplodeRange, ModeButtons, PartsReadout, sizeLabel, StageCanvas, TurnButtons } from "./view";

const BIG = 1.5e6; // bytes: above this, or with the browser's data saver on, the model waits to be asked for
const noSubscribe = () => () => {};
const saveData = () => Boolean((navigator as { connection?: { saveData?: boolean } }).connection?.saveData);

// A design generation in a case study, live: drag or arrow keys turn it, Solid / Edges / X-ray change how it is
// drawn, and a model that carries an exploded view gets the Explode slider with the farthest part's travel in mm.
// Small models build when scrolled near; big ones (and any on a data-saving connection) show their poster and a
// Load button with the download size.
export function CaseModel({ m }: { m: Media }) {
  const [asked, setAsked] = useState(false);
  const [mode, setMode] = useState<Mode>("solid");
  const [apart, setApart] = useState(0);
  // Decided in the browser (the server can't know the connection); until then the model waits, as a big one would.
  const auto = useSyncExternalStore(noSubscribe, () => !saveData() && (m.bytes ?? 0) <= BIG, () => false);
  const o = parseOrbit(m.orbit);
  const { box, canvas, stage, gen, ready, loaded } = useStage(
    { src: m.src, finish: m.explode ? "anodized" : "aluminium", theta: o.theta, phi: o.phi, drag: true, exposure: 1.1 },
    { enabled: auto || asked, progress: true },
  );
  useInk(stage, box, mode, ready, gen);

  useEffect(() => {
    if (ready && m.explode) stage.current?.setExplode(apart);
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
            Load 3D model ({sizeLabel(m.bytes)})<span className="sr-only">: {m.alt}</span>
          </button>
        )}
        {asked && !ready && (
          <p role="status" className="readout absolute bottom-3 left-3 bg-bg px-2 py-1">
            Loading <span className="val">{Math.round(loaded * 100)} %</span>
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <ModeButtons mode={mode} onChange={setMode} disabled={!ready} />
        <TurnButtons stage={stage} />
      </div>
      {m.explode ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 [&>:first-child]:min-w-48 [&>:first-child]:flex-1">
          <ExplodeRange value={apart} mm={mm} onChange={setApart} disabled={!ready} />
          <p className="readout text-muted">
            <span className="val">{m.parts}</span> parts, <span className="val">{String(mm).padStart(3, "0")}</span> mm apart
          </p>
        </div>
      ) : (
        <PartsReadout m={m} className="mt-2" />
      )}
    </div>
  );
}
