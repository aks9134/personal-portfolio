"use client";

import { useEffect, useRef, useState } from "react";
import { createStage, type Stage, type StageOptions } from "./engine";

// Lifecycle shared by every 3D view: build the scene when the view comes within a screen of the viewport, free the
// GPU context when it is two screens away (or when the browser drops it), and hand back a fresh <canvas> each time
// (`gen` is its React key), because a canvas whose context was lost can't get a new one. `idle` waits for the page
// to finish loading and go quiet first; on touch screens it also waits for the first interaction, so a phone's
// first load spends nothing on 3D. `enabled` false holds the build back entirely (a model the visitor must ask for).
export function useStage(opts: Omit<StageOptions, "onProgress" | "onLost">, { idle = false, enabled = true } = {}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const [gen, setGen] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

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
      if (!enabled || !near || !gate || stage.current || loading || !canvas.current) return;
      loading = true;
      try {
        const s = await createStage(canvas.current, { ...optsRef.current, onProgress: (l, t) => setLoaded(t ? l / t : 0), onLost: drop });
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
      if (window.matchMedia("(pointer: coarse)").matches) {
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
    // Rebuilt for a new model or a fresh canvas; option changes that don't need a rebuild are read from optsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.src, gen, idle, enabled]);

  return { box, canvas, stage, gen, ready, loaded };
}
