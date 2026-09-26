"use client";

import { useEffect, useRef, useState } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";

// The one model that loads without being asked: it sits beside the name, makes one slow turn when it arrives,
// then turns as the page scrolls past it, and you can grab it. After the first turn it only draws when something
// changes (scroll or drag), so an idle page costs nothing. The rendered poster holds the space until the mesh
// arrives, so nothing jumps. Reduced motion keeps the model still, and a slow connection just keeps the poster.
export function HeroModel({ m, label }: { m: Media; label: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ready">("idle");
  const viewer = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {

    // Wait for the page to settle before pulling the mesh: the hero text and the lead drawing come first.
    const ric = (window as unknown as { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 2500 }) : window.setTimeout(cb, 700));

    let cancelled = false;
    idle(async () => {
      if (cancelled) return;
      setState("loading");
      const w = window as unknown as { ModelViewerElement?: { meshoptDecoderLocation?: string } };
      w.ModelViewerElement = { ...w.ModelViewerElement, meshoptDecoderLocation: "/vendor/meshopt_decoder.js" };
      try {
        await import("@google/model-viewer");
      } catch {
        setState("idle");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // model-viewer fires poster-dismissed the moment it reveals the model: fade our poster out on the same frame.
  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const ready = () => setState("ready");
    el.addEventListener("poster-dismissed", ready);
    return () => el.removeEventListener("poster-dismissed", ready);
  }, [state]);

  // On arrival the hand makes one slow turn by itself (18 degrees a second, about 20 seconds), paused while it is
  // off screen; after that it only moves when scrolled or dragged. Reduced motion skips the turn.
  useEffect(() => {
    const el = viewer.current;
    const wrap = box.current;
    if (state !== "ready" || !el || !wrap || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    const spin = (on: boolean) => {
      if (on) {
        el.setAttribute("rotation-per-second", "18deg");
        el.setAttribute("auto-rotate", "");
      } else el.removeAttribute("auto-rotate");
    };
    const io = new IntersectionObserver(([e]) => spin(e.isIntersecting));
    io.observe(wrap);
    const done = window.setTimeout(() => {
      io.disconnect();
      spin(false);
    }, 20_000);
    return () => {
      io.disconnect();
      window.clearTimeout(done);
    };
  }, [state]);

  // Scroll turns the camera around the hand, a quarter degree per pixel scrolled, while the hero is on screen.
  // It adds to wherever the camera is, so a turn made by dragging is kept. (Not the `orientation` attribute:
  // in model-viewer 4.3.1 every orientation change throws inside its AR renderer.)
  useEffect(() => {
    const el = viewer.current as (HTMLElement & { getCameraOrbit: () => { theta: number; phi: number; radius: number }; cameraOrbit: string }) | null;
    const wrap = box.current;
    if (state !== "ready" || !el || !wrap) return;
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let onScreen = true;
    let frame = 0;
    let lastY = window.scrollY;
    // Our own running angle, not the camera's mid-glide position, so a fast scroll loses no turn and scrolling
    // back up returns to the same view. A drag re-bases it on wherever the visitor left the camera.
    let theta = el.getCameraOrbit().theta;
    const onCamera = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail?.source === "user-interaction") theta = el.getCameraOrbit().theta;
    };
    el.addEventListener("camera-change", onCamera);
    const turn = () => {
      frame = 0;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!onScreen || !motionOk.matches || !dy) return;
      theta -= (dy * 0.25 * Math.PI) / 180;
      const o = el.getCameraOrbit();
      el.cameraOrbit = `${theta}rad ${o.phi}rad ${o.radius}m`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(turn);
    };
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
    io.observe(wrap);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      el.removeEventListener("camera-change", onCamera);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [state]);

  return (
    <div ref={box} className="relative aspect-square w-full">
      {state !== "idle" && (
        <model-viewer
          ref={viewer}
          src={m.src}
          alt={m.alt}
          camera-controls=""
          disable-zoom=""
          disable-pan=""
          interaction-prompt="none"
          touch-action="pan-y"
          exposure="1.05"
          shadow-intensity="0.35"
          shadow-softness="1"
          {...(m.orbit && { "camera-orbit": m.orbit })}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <div slot="progress-bar" />
        </model-viewer>
      )}
      {m.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.poster}
          srcSet={srcSet(m.poster, m.width)}
          sizes="(min-width: 768px) 26rem, 80vw"
          width={m.width}
          height={m.height}
          alt={m.alt ?? ""}
          decoding="async"
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-(--ease-out) motion-reduce:transition-none ${state === "ready" ? "opacity-0" : ""}`}
        />
      )}
      <p className="absolute -bottom-1 left-0 text-sm text-ink-2">{label}</p>
    </div>
  );
}
