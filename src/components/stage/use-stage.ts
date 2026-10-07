"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { subscribe } from "@/lib/prefs";
import { createStage, cssColor, type Mode, type Stage, type StageOptions } from "./engine";
import { isPhone } from "../lab/progress";

// Lifecycle shared by every 3D view: build the scene when the view comes within a screen of the viewport, free the
// GPU context when it is two screens away (or when the browser drops it), and hand back a fresh <canvas> each time
// (`gen` is its React key), because a canvas whose context was lost can't get a new one. `idle` waits for the page
// to finish loading and go quiet first; on touch screens it also waits for the first interaction, so a phone's
// first load spends nothing on 3D. `enabled` false holds the build back entirely (a model the visitor must ask for).
// `progress` reports the download, for the one view that shows it.
export function useStage(
  opts: Omit<StageOptions, "onProgress" | "onLost">,
  { idle = false, enabled = true, progress = false }: { idle?: boolean; enabled?: boolean; progress?: boolean } = {},
) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const [gen, setGen] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  // A lost GPU context is rebuilt once (it can be passing, like a tab switch); a second loss means memory pressure,
  // and rebuilding would loop load, lose, reload, so the view keeps its poster from then on.
  const losses = useRef(0);
  // Options that don't need a rebuild are read at build time from here.
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let alive = true;
    let loading = false;
    let near = false;
    let gate = !idle;

    const drop = () => {
      if (!stage.current) return;
      stage.current.dispose();
      stage.current = null;
      setReady(false);
      setGen((g) => g + 1);
    };
    const build = async () => {
      if (!enabled || !near || !gate || stage.current || loading || !canvas.current || losses.current > 1) return;
      loading = true;
      try {
        const onProgress = progress ? (l: number, t: number) => setLoaded(t ? Math.round((l / t) * 100) / 100 : 0) : undefined;
        const onLost = () => {
          losses.current += 1;
          drop();
        };
        const s = await createStage(canvas.current, { ...optsRef.current, onProgress, onLost });
        if (!alive) return s.dispose();
        stage.current = s;
        setReady(true);
      } catch {
        /* the poster stays; a model that fails to load is not an error the visitor needs to see */
      } finally {
        loading = false;
      }
    };

    const nearIO = new IntersectionObserver(([e]) => {
      near = e.isIntersecting;
      void build();
    }, { rootMargin: "100% 0px" });
    const farIO = new IntersectionObserver(([e]) => !e.isIntersecting && drop(), { rootMargin: "200% 0px" });
    nearIO.observe(el);
    farIO.observe(el);

    const offs: (() => void)[] = [];
    if (idle) {
      const open = () => {
        gate = true;
        void build();
      };
      const whenIdle = () => {
        const ric = (window as { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
        if (ric) ric(open, { timeout: 2500 });
        else setTimeout(open, 800);
      };
      if (isPhone()) {
        const events = ["pointerdown", "scroll", "keydown"] as const;
        const first = () => {
          events.forEach((k) => window.removeEventListener(k, first));
          whenIdle();
        };
        events.forEach((k) => window.addEventListener(k, first, { passive: true, once: true }));
        offs.push(() => events.forEach((k) => window.removeEventListener(k, first)));
      } else if (document.readyState === "complete") whenIdle();
      else {
        window.addEventListener("load", whenIdle, { once: true });
        offs.push(() => window.removeEventListener("load", whenIdle));
      }
    }

    return () => {
      alive = false;
      nearIO.disconnect();
      farIO.disconnect();
      offs.forEach((f) => f());
      drop();
    };
  }, [opts.src, gen, idle, enabled, progress]);

  return { box, canvas, stage, gen, ready, loaded };
}

/** Keeps a stage in render mode `mode`, its lines drawn in the theme's ink, now and whenever the lights change. */
export function useInk(stage: RefObject<Stage | null>, box: RefObject<HTMLDivElement | null>, mode: Mode, ready: boolean, gen: number) {
  useEffect(() => {
    const el = box.current;
    if (!ready || !el) return;
    const apply = () => stage.current?.setMode(mode, cssColor(el, "--fg"));
    apply();
    return subscribe(apply);
  }, [stage, box, mode, ready, gen]);
}
