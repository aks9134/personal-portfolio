"use client";

import { useEffect, useRef, useState } from "react";
import { motionOk } from "@/lib/prefs";
import { sectionProgress } from "../progress";
import type { Frame } from "./scene";

export type Station = { code: string; name: string; project: string; meta: string; line: string; facts: string[]; href: string };
export type Callout = { id: string; label: string; value?: string };

// Direction A, "The Line". The page is one tall run; a sticky canvas shows the hall, and everything else is HTML laid
// over it: a title card that lifts to reveal the floor, the station rail, callouts pinned to real points on each
// machine (positioned every frame from the 3D scene, no React re-render), and a station panel that arrives after the
// object has done its thing.
export function Line({ models, stations, callouts, more }: { models: { hand: string; shield: string; drive: string; extras: string[] }; stations: Station[]; callouts: Callout[]; more: { title: string; meta: string; href: string }[] }) {
  const run = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tags = useRef<Record<string, HTMLDivElement | null>>({});
  const trace = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [state, setState] = useState({ station: 0, beat: 0 });

  useEffect(() => {
    let alive = true;
    let api: Awaited<ReturnType<typeof import("./scene").createLine>> | null = null;
    const amps: number[] = [];
    (async () => {
      const { createLine } = await import("./scene");
      if (!alive || !canvas.current) return;
      api = await createLine({
        canvas: canvas.current,
        ...models,
        motion: motionOk,
        onFrame: (f: Frame) => {
          for (const a of f.anchors) {
            const el = tags.current[a.id];
            if (!el) continue;
            el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
            el.dataset.on = a.visible && f.beat > 0.25 ? "1" : "0";
          }
          setState((s) => (s.station === f.station && Math.abs(s.beat - f.beat) < 0.02 ? s : { station: f.station, beat: f.beat }));
          // The test stand's trace: amplitude history, drawn on a small canvas.
          const c = trace.current;
          if (c) {
            amps.push(f.amp);
            if (amps.length > 160) amps.shift();
            const g = c.getContext("2d")!;
            const W = c.width;
            const H = c.height;
            g.clearRect(0, 0, W, H);
            g.strokeStyle = "rgba(255,255,255,0.18)";
            g.beginPath();
            g.moveTo(0, H / 2);
            g.lineTo(W, H / 2);
            g.stroke();
            g.strokeStyle = "#f2c200";
            g.lineWidth = 2;
            g.beginPath();
            amps.forEach((v, n) => {
              const x = (n / 159) * W;
              const y = H / 2 - Math.sin(n * 0.9) * v * (H * 0.42);
              if (n) g.lineTo(x, y);
              else g.moveTo(x, y);
            });
            g.stroke();
          }
        },
      });
      if (!alive) return api.dispose();
      setReady(true);
      setTimeout(() => setLifted(true), 900);
    })();
    const onScroll = () => run.current && api?.setProgress(sectionProgress(run.current));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      api?.dispose();
    };
  }, [models]);

  const s = stations[state.station];
  const panelOn = state.station === 0 ? state.beat > 0.55 : state.beat > 0.2;

  return (
    <main className="lab-line">
      <div ref={run} style={{ height: "760svh" }}>
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" />

          {/* Title card: stands alone first, then lifts to reveal the floor (the camera is already moving under it). */}
          <div className={`ll-card ${lifted ? "is-lifted" : ""}`} aria-hidden={lifted}>
            <p className="ll-mono">Plant tour, 4 stations</p>
            <h1 className="ll-wide text-[clamp(3.5rem,11vw,10rem)]">Allen Sun</h1>
            <p className="ll-lede">Mechanical design engineer. I design parts, machine them, and put them on a test rig.</p>
            <p className="ll-mono mt-8">{ready ? "Floor ready" : "Powering up the hall"}</p>
          </div>

          <header className="ll-top">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="ll-wide text-sm">Allen Sun</a>
            <nav className="ll-mono flex gap-5">
              <a href="#more">Work</a>
              <a href="/resume">Resume</a>
              <a href="mailto:aks9134@nyu.edu">Email</a>
            </nav>
          </header>

          <ol className="ll-rail ll-mono" aria-label="Stations">
            {stations.map((st, i) => (
              <li key={st.code} data-on={i === state.station ? "1" : "0"}>
                <span>{st.code}</span> {st.name}
              </li>
            ))}
          </ol>

          {callouts.map((c) => (
            <div key={c.id} ref={(el) => void (tags.current[c.id] = el)} className="ll-tag" data-on="0">
              <i />
              <span className="ll-mono">
                {c.label}
                {c.value && <b>{c.value}</b>}
              </span>
            </div>
          ))}

          <section className={`ll-panel ${panelOn ? "is-on" : ""}`} aria-live="polite">
            <p className="ll-mono ll-code">Station {s.code}</p>
            <h2 className="ll-wide text-[clamp(2.4rem,5.2vw,4.6rem)]">{s.name}</h2>
            <p className="ll-proj">{s.project} <span>{s.meta}</span></p>
            <p className="ll-text">{s.line}</p>
            <ul className="ll-facts ll-mono">
              {s.facts.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {state.station === 1 && (
              <div className="ll-scope">
                <canvas ref={trace} width={320} height={70} />
                <p className="ll-mono">Beam trace, slowed for viewing. Canceller {state.beat > 0.45 ? "on" : "off"}</p>
              </div>
            )}
            <a href={s.href} className="ll-mono ll-link">Open the case study</a>
          </section>
        </div>
      </div>

      <section id="more" className="ll-more">
        <h2 className="ll-wide text-[clamp(2.5rem,7vw,6rem)]">Also on the floor</h2>
        <ul>
          {more.map((m, i) => (
            <li key={m.href}>
              <a href={m.href}>
                <span className="ll-mono">{String(i + 1).padStart(2, "0")}</span>
                <b>{m.title}</b>
                <span className="ll-mono">{m.meta}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="ll-mono mt-16">aks9134@nyu.edu</p>
      </section>
    </main>
  );
}
