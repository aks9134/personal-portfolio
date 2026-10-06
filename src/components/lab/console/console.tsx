"use client";

import { useEffect, useRef, useState } from "react";
import { Scramble } from "@/components/scramble";
import { motionOk } from "@/lib/prefs";
import { site } from "@/lib/site";
import { sectionProgress } from "../progress";
import type { ConsoleFrame, Measure, Spec } from "./scene";
import { SCAN, segments } from "./timeline";

export type Target = { code: string; name: string; klass: string; status: string; line: string; facts: string[]; href: string; model: Spec; apartMm?: number };
export type IndexEntry = { title: string; meta: string; href: string; target?: string };

// The home page, "Console". A pinned canvas carries the scan; the HTML around it reads as instrumentation: a target
// list, a telemetry block with dimensions measured from the CAD itself, a scan bar, and the project line, which only
// prints once the part is solid. Below it, the Index of every project and whatever the page passes in (Experience).
// Without WebGL the page still works: the telemetry, the brief and the Index are plain HTML.
export function Console({ targets, index, children }: { targets: Target[]; index: IndexEntry[]; children?: React.ReactNode }) {
  const run = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Measure[]>([]);
  const [f, setF] = useState<ConsoleFrame>({ index: 0, phase: "morph" });
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  // The scan bar and percentage change every frame: written straight to the DOM, so React re-renders only when the
  // target or the phase changes.
  const bar = useRef<HTMLElement>(null);
  const pctEl = useRef<HTMLSpanElement>(null);
  const apartEl = useRef<HTMLElement>(null);
  const apartMm = useRef<number | undefined>(undefined);
  const jumpRef = useRef<(i: number) => void>(() => {});
  const sceneRef = useRef<{ hold: (on: boolean) => void; setVisible: (on: boolean) => void } | null>(null);
  const glide = useRef<(() => void) | null>(null); // the running Index glide's stop, if one is running
  useEffect(() => () => glide.current?.(), []);

  useEffect(() => {
    let alive = true;
    let api: Awaited<ReturnType<typeof import("./scene").createConsole>> | null = null;
    let lastPct = -1;
    const tl0 = segments(targets.map((x) => x.model.weight ?? 1));
    const still = tl0.to(0, SCAN + 0.02); // reduced motion: the first machine shown just solid
    const start = async () => {
      setState("loading");
      const { createConsole } = await import("./scene");
      if (!alive || !canvas.current) return;
      api = await createConsole({
        canvas: canvas.current,
        models: targets.map((t) => t.model),
        motion: motionOk,
        // Scroll alone drives it: the page opens on the scattered field, and scrolling back to the top returns to it.
        // Reduced motion: nothing re-forms on its own, so the first machine is shown solid.
        progress: () => {
          const p = run.current ? sectionProgress(run.current) : 0;
          return motionOk() ? p : Math.max(p, still);
        },
        onMeasure: setM,
        onFrame: setF,
        onTick: (scan, apart) => {
          const mm = apartMm.current;
          const txt = mm ? `${String(Math.round(apart * mm)).padStart(3, "0")} mm` : `${String(Math.round(apart * 100)).padStart(3, "0")}%`;
          if (apartEl.current && apartEl.current.textContent !== txt) apartEl.current.textContent = txt;
          const p = Math.round(scan * 100);
          if (p === lastPct) return;
          lastPct = p;
          if (bar.current) bar.current.style.transform = `scaleX(${scan})`;
          if (pctEl.current) pctEl.current.textContent = `${String(p).padStart(3, "0")}%`;
        },
      });
      if (!alive) return api.dispose();
      sceneRef.current = api;
      setState("ready");
      // Render only while the run is on screen; a lost GL context (a phone reclaiming memory) falls back to HTML.
      const io = new IntersectionObserver(([e]) => api?.setVisible(e.isIntersecting));
      if (run.current) io.observe(run.current);
      stopIo = () => io.disconnect();
      canvas.current?.addEventListener("webglcontextlost", () => alive && setState("failed"), { once: true });
    };
    let stopIo = () => {};
    const go = () => {
      start().catch(() => alive && setState("failed")); // no WebGL, or a model failed: the HTML stays usable
    };
    // Phones wait for the first touch or scroll before loading four models (as v4's hero did); desktops start now.
    const wake = ["pointerdown", "touchstart", "scroll", "keydown"] as const;
    const first = () => {
      wake.forEach((e) => removeEventListener(e, first));
      go();
    };
    if (matchMedia("(pointer: coarse)").matches) wake.forEach((e) => addEventListener(e, first, { passive: true }));
    else go();
    return () => {
      alive = false;
      wake.forEach((e) => removeEventListener(e, first));
      stopIo();
      api?.dispose();
    };
  }, [targets]);

  // Keys 1-4 jump to a target, unless the visitor is typing, holding a modifier, or has a dialog open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
      const k = Number(e.key);
      if (k >= 1 && k <= targets.length) jumpRef.current(k - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [targets.length]);

  const t = targets[f.index];
  const mm = m[f.index];
  const solid = f.phase === "solid" || state === "failed";
  const approx = t.model.build ? "≈ " : "";
  const tl = segments(targets.map((x) => x.model.weight ?? 1));

  // Jumps land instantly (no smooth scroll through every segment); the scene sees the long jump and re-forms the
  // cloud straight from the current machine into the chosen one.
  const jumpTo = (top: number) => window.scrollTo({ top, behavior: "instant" });
  const toTarget = (i: number) => {
    const el = run.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    jumpTo(top + tl.to(i, SCAN + 0.05) * (el.offsetHeight - window.innerHeight));
  };
  // The key handler and the per-frame readout read the latest target and jump through refs.
  useEffect(() => {
    apartMm.current = t.apartMm;
    jumpRef.current = toTarget;
  });
  // Index: one quick glide down (at most 0.7 s) while the scene holds still, so the machines don't race past. Any
  // scroll of the visitor's own (wheel, touch, scrollbar) takes over at once. Reduced motion: an instant jump.
  const toIndex = (e: React.MouseEvent) => {
    const el = document.getElementById("index");
    if (!el || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // a new tab or window: the browser's own way
    e.preventDefault();
    // Keyboard and screen-reader users land in the Index too, not only the view.
    const arrive = () => el.focus({ preventScroll: true });
    const to = el.getBoundingClientRect().top + window.scrollY;
    if (!motionOk()) {
      jumpTo(to);
      return arrive();
    }
    if (glide.current) return; // already gliding there
    const html = document.documentElement;
    const from = window.scrollY;
    const dur = Math.min(700, 350 + Math.abs(to - from) / 24);
    const t0 = performance.now();
    let last = from;
    let raf = 0;
    html.style.scrollBehavior = "auto"; // the site's smooth scrolling would ease every step a second time
    sceneRef.current?.hold(true);
    const done = () => {
      cancelAnimationFrame(raf);
      glide.current = null;
      html.style.scrollBehavior = "";
      sceneRef.current?.hold(false);
    };
    glide.current = done;
    const step = (now: number) => {
      if (Math.abs(window.scrollY - last) > 2) return done(); // the visitor scrolled: hand back
      const k = Math.min(1, (now - t0) / dur);
      const ease = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      window.scrollTo({ top: from + (to - from) * ease, behavior: "instant" });
      last = window.scrollY;
      if (k < 1) raf = requestAnimationFrame(step);
      else {
        done();
        arrive();
      }
    };
    raf = requestAnimationFrame(step);
  };

  return (
    <main id="main" className={state === "failed" ? "lab-console is-failed" : "lab-console"}>
      {/* Without 3D there is nothing to scroll through: the run is one screen showing the first machine's brief. */}
      <div ref={run} style={{ height: state === "failed" ? "100svh" : `${tl.total * 185 + 100}svh` }}>
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
          <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>

          <header className="lc-top">
            <div>
              <h1 className="lc-name">{site.name}</h1>
              <p className="lc-dim">{site.role}</p>
            </div>
            <p className="lc-dim lc-status">
              <span className={state === "ready" ? "lc-dot is-on" : "lc-dot"} />{" "}
              {{ idle: "Standing by", loading: "Sampling surfaces", ready: "Link live, 4 targets", failed: "3D view unavailable" }[state]}
            </p>
            <nav className="lc-dim lc-nav" aria-label="Primary">
              <a href="#index" onClick={toIndex}>Index</a>
              <a href="/about">About</a>
              <a href="/resume">Resume</a>
              <a href={`mailto:${site.email}`}>Email</a>
            </nav>
          </header>

          <ol className="lc-targets" aria-label="Targets, keys 1 to 4">
            {targets.map((x, i) => (
              <li key={x.code} data-on={i === f.index ? "1" : "0"}>
                <button type="button" onClick={() => toTarget(i)} aria-current={i === f.index ? "true" : undefined}>
                  <span>{x.code}</span>
                  {x.name}
                </button>
              </li>
            ))}
          </ol>

          <section className="lc-tele" aria-label="Telemetry">
            <p className="lc-dim">Target {t.code}</p>
            {/* Values decode into place when the target changes; screen readers get the plain text. */}
            <h2 className="lc-title" aria-live="polite"><Scramble text={t.name} /></h2>
            <dl>
              <dt>Class</dt>
              <dd><Scramble text={t.klass} /></dd>
              <dt>Envelope</dt>
              <dd><Scramble text={mm ? `${approx}${Math.round(mm.x)} × ${Math.round(mm.y)} × ${Math.round(mm.z)} mm` : "measuring"} /></dd>
              <dt>Bodies</dt>
              <dd><Scramble text={mm ? String(mm.parts) : "-"} /></dd>
              <dt>Status</dt>
              <dd><Scramble text={t.status} /></dd>
              {/* Assemblies (the models given a longer segment) read out how far apart they are. */}
              {t.model.weight && (
                <>
                  <dt>Apart</dt>
                  <dd className="lc-apart" aria-hidden><b key={t.code} ref={apartEl} /></dd>
                </>
              )}
            </dl>
            <div className="lc-scan" aria-hidden>
              <span>{f.phase === "morph" ? "Acquiring" : f.phase === "scan" ? "Scanning" : "Solid"}</span>
              <b ref={bar} style={{ transform: "scaleX(0)" }} />
              <span ref={pctEl}>000%</span>
            </div>
            {/* Phones: the brief is hidden, so the file's link lives here. */}
            <a href={t.href} className="lc-tele-open">Open the file</a>
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

      <section id="index" className="lc-index" aria-labelledby="index-title" tabIndex={-1}>
        <h2 id="index-title" className="lc-dim">Index, every project</h2>
        <ul>
          {index.map((x, i) => (
            <li key={x.href}>
              <a href={x.href}>
                <span className="lc-dim">{String(i + 1).padStart(2, "0")}</span>
                <b>{x.title}</b>
                <span className="lc-dim">
                  {x.target && <span className="lc-tag">Target {x.target}</span>}
                  {x.meta}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      {children}
    </main>
  );
}
