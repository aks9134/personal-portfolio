"use client";

import { useEffect, useRef, useState } from "react";
import { motionOk } from "@/lib/prefs";
import { sectionProgress } from "../load";
import type { ConsoleFrame, Measure, Spec } from "./scene";

export type Target = { code: string; name: string; klass: string; status: string; line: string; facts: string[]; href: string; model: Spec };

// Direction B, "Console". A pinned canvas carries the scan; the HTML around it reads as instrumentation: a target
// list, a telemetry block with dimensions measured from the CAD itself, a scan bar, and the project line, which only
// prints once the part is solid.
export function Console({ targets, more }: { targets: Target[]; more: { title: string; meta: string; href: string }[] }) {
  const run = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Measure[]>([]);
  const [f, setF] = useState<ConsoleFrame>({ index: 0, phase: "morph" });
  const [ready, setReady] = useState(false);
  // The scan bar and percentage change every frame: written straight to the DOM, so React re-renders only when the
  // target or the phase changes.
  const bar = useRef<HTMLElement>(null);
  const pctEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let alive = true;
    let api: Awaited<ReturnType<typeof import("./scene").createConsole>> | null = null;
    let lastPct = -1;
    (async () => {
      const { createConsole } = await import("./scene");
      if (!alive || !canvas.current) return;
      api = await createConsole({
        canvas: canvas.current,
        models: targets.map((t) => t.model),
        motion: motionOk,
        progress: () => (run.current ? sectionProgress(run.current) : 0),
        onMeasure: setM,
        onFrame: setF,
        onTick: (scan) => {
          const p = Math.round(scan * 100);
          if (p === lastPct) return;
          lastPct = p;
          if (bar.current) bar.current.style.transform = `scaleX(${scan})`;
          if (pctEl.current) pctEl.current.textContent = `${String(p).padStart(3, "0")}%`;
        },
      });
      if (!alive) return api.dispose();
      setReady(true);
    })();
    return () => {
      alive = false;
      api?.dispose();
    };
  }, [targets]);

  const t = targets[f.index];
  const mm = m[f.index];
  const solid = f.phase === "solid";
  const approx = t.model.build ? "≈ " : "";

  return (
    <main className="lab-console">
      <div ref={run} style={{ height: `${targets.length * 170 + 100}svh` }}>
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
          <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>

          <header className="lc-top">
            <div>
              <p className="lc-name">Allen Sun</p>
              <p className="lc-dim">Mechanical design engineer</p>
            </div>
            <p className="lc-dim lc-status">
              <span className={ready ? "lc-dot is-on" : "lc-dot"} /> {ready ? "Link live, 4 targets" : "Sampling surfaces"}
            </p>
            <nav className="lc-dim flex gap-5">
              <a href="#index">Index</a>
              <a href="/resume">Resume</a>
              <a href="mailto:aks9134@nyu.edu">Email</a>
            </nav>
          </header>

          <ol className="lc-targets" aria-label="Targets">
            {targets.map((x, i) => (
              <li key={x.code} data-on={i === f.index ? "1" : "0"}>
                <span>{x.code}</span>
                {x.name}
              </li>
            ))}
          </ol>

          <section className="lc-tele" aria-live="polite">
            <p className="lc-dim">Target {t.code}</p>
            <h2 className="lc-title">{t.name}</h2>
            <dl>
              <dt>Class</dt>
              <dd>{t.klass}</dd>
              <dt>Envelope</dt>
              <dd>{mm ? `${approx}${Math.round(mm.x)} × ${Math.round(mm.y)} × ${Math.round(mm.z)} mm` : "measuring"}</dd>
              <dt>Bodies</dt>
              <dd>{mm ? mm.parts : "-"}</dd>
              <dt>Status</dt>
              <dd>{t.status}</dd>
            </dl>
            <div className="lc-scan">
              <span>{f.phase === "morph" ? "Acquiring" : f.phase === "scan" ? "Scanning" : "Solid"}</span>
              <b ref={bar} style={{ transform: "scaleX(0)" }} />
              <span ref={pctEl}>000%</span>
            </div>
          </section>

          <section className={`lc-brief ${solid ? "is-on" : ""}`}>
            <p>{t.line}</p>
            <ul>
              {t.facts.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <a href={t.href}>Open the file</a>
          </section>
        </div>
      </div>

      <section id="index" className="lc-index">
        <p className="lc-dim">Index</p>
        <ul>
          {more.map((x, i) => (
            <li key={x.href}>
              <a href={x.href}>
                <span className="lc-dim">{String(i + 1).padStart(2, "0")}</span>
                <b>{x.title}</b>
                <span className="lc-dim">{x.meta}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="lc-dim mt-16">aks9134@nyu.edu</p>
      </section>
    </main>
  );
}
