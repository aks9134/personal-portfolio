"use client";

import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { motionOk } from "@/lib/prefs";
import type { Media } from "@/lib/work";
import { sectionProgress } from "../load";
import type { ConsoleFrame, Measure, Spec } from "./scene";
import { EXPLODE, SCAN } from "./timeline";

const INTRO = SCAN + 0.02; // where the arrival play stops: just solid
const REST = SCAN + (1 - SCAN) * EXPLODE[0] * 0.5; // reduced motion: solid, before any explode begins

export type CaseHead = {
  code: string; // "03 / 08": this file's place in the order
  title: string;
  klass: string;
  status: string;
  when: string;
  line: string;
  award?: string;
  note?: string; // a caveat that travels with the model ("rebuilt from the renders")
  model?: Spec;
  apart?: { mm?: number }; // an assembly: read out how far apart it is, in mm where the media records the travel
  still: Media;
};

// A project file's opener in the console's language. With a model: the console's scan on that one machine, pinned
// while the visitor scrolls (re-form, scan to solid, an assembly comes apart), with its telemetry measured from the
// model. Without one: the lead image, resolved upward behind the same orange scan line. Under reduced motion the
// model is shown solid and still, and nothing pins.
export function CaseScan({ h }: { h: CaseHead }) {
  return h.model ? <ModelScan h={h} model={h.model} /> : <StillScan h={h} />;
}

function Top({ code }: { code: string }) {
  return (
    <header className="lc-top">
      <div>
        <a href="/lab/b" className="lc-name">Allen Sun</a>
        <p className="lc-dim">Mechanical design engineer</p>
      </div>
      <p className="lc-dim lc-status">
        <span className="lc-dot is-on" /> File {code}
      </p>
      <nav className="lc-dim flex gap-5">
        <a href="/lab/b">Console</a>
        <a href="/lab/b#index">Index</a>
        <a href="/resume">Resume</a>
        <a href="mailto:aks9134@nyu.edu">Email</a>
      </nav>
    </header>
  );
}

function Head({ h }: { h: CaseHead }) {
  return (
    <div className="lcs-head">
      <p className="lc-dim">{h.klass}</p>
      <h1>{h.title}</h1>
      <p className="lcs-line">{h.line}</p>
      {h.award && <p className="lcs-award">{h.award}</p>}
    </div>
  );
}

function ModelScan({ h, model }: { h: CaseHead; model: Spec }) {
  const run = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLElement>(null);
  const pctEl = useRef<HTMLSpanElement>(null);
  const apartEl = useRef<HTMLElement>(null);
  const [m, setM] = useState<Measure | null>(null);
  const [f, setF] = useState<ConsoleFrame>({ index: 0, phase: "morph" });

  useEffect(() => {
    let alive = true;
    let api: Awaited<ReturnType<typeof import("./scene").createConsole>> | null = null;
    let t0 = 0;
    (async () => {
      const { createConsole } = await import("./scene");
      if (!alive || !canvas.current) return;
      api = await createConsole({
        canvas: canvas.current,
        models: [model],
        motion: motionOk,
        // On arrival the machine re-forms and scans to solid by itself (about 2.4 s); the pinned run then drives the
        // rest (the orbit, an assembly coming apart). Reduced motion: no run, the model held solid.
        progress: () => {
          if (!motionOk() || !run.current) return REST;
          t0 ||= performance.now();
          const intro = Math.min(1, (performance.now() - t0) / 2400);
          return intro * INTRO + sectionProgress(run.current) * (1 - INTRO);
        },
        onMeasure: (all) => setM(all[0]),
        onFrame: setF,
        onTick: (scan, apart) => {
          const mm = h.apart?.mm;
          const txt = mm ? `${String(Math.round(apart * mm)).padStart(3, "0")} mm` : `${String(Math.round(apart * 100)).padStart(3, "0")}%`;
          if (apartEl.current && apartEl.current.textContent !== txt) apartEl.current.textContent = txt;
          if (bar.current) bar.current.style.transform = `scaleX(${scan})`;
          if (pctEl.current) pctEl.current.textContent = `${String(Math.round(scan * 100)).padStart(3, "0")}%`;
        },
      });
      if (!alive) api.dispose();
    })();
    return () => {
      alive = false;
      api?.dispose();
    };
  }, [model, h.apart]);

  const approx = model.build ? "≈ " : "";
  return (
    <div ref={run} className="lcs-run">
      <div className="lcs-pin">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
        <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>
        <Top code={h.code} />
        <Head h={h} />
        <section className="lc-tele" aria-label="Telemetry">
          <p className="lc-dim">File {h.code}</p>
          <dl>
            <dt>Envelope</dt>
            <dd>{m ? `${approx}${Math.round(m.x)} × ${Math.round(m.y)} × ${Math.round(m.z)} mm` : "measuring"}</dd>
            <dt>Bodies</dt>
            <dd>{m ? m.parts : "-"}</dd>
            <dt>Status</dt>
            <dd>{h.status}</dd>
            <dt>When</dt>
            <dd>{h.when}</dd>
            {h.apart && (
              <>
                <dt>Apart</dt>
                <dd className="lc-apart" aria-hidden><b ref={apartEl} /></dd>
              </>
            )}
          </dl>
          {h.note && <p className="lcs-note">{h.note}</p>}
          <div className="lc-scan" aria-hidden>
            <span>{f.phase === "morph" ? "Acquiring" : f.phase === "scan" ? "Scanning" : "Solid"}</span>
            <b ref={bar} style={{ transform: "scaleX(0)" }} />
            <span ref={pctEl}>000%</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function StillScan({ h }: { h: CaseHead }) {
  return (
    <div className="lcs-pin lcs-still">
      <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>
      <Top code={h.code} />
      <div className="lcs-image">
        <div className="lcs-reveal">
          <MediaImage m={h.still} priority sizes="(min-width: 860px) 56vw, 100vw" imgClassName="mx-auto max-h-[60svh] w-auto object-contain" className="mx-auto w-fit" />
        </div>
      </div>
      <Head h={h} />
      <section className="lc-tele" aria-label="Telemetry">
        <p className="lc-dim">File {h.code}</p>
        <dl>
          <dt>Status</dt>
          <dd>{h.status}</dd>
          <dt>When</dt>
          <dd>{h.when}</dd>
        </dl>
        <div className="lc-scan" aria-hidden>
          <span>Image</span>
          <b className="lcs-bar" />
          <span>100%</span>
        </div>
      </section>
    </div>
  );
}
