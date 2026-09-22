"use client";

import { useEffect, useRef, useState } from "react";
import { srcSet } from "@/lib/image-widths";
import type { Media } from "@/lib/work";

// The one model that loads without being asked: it turns slowly beside the name, and you can grab it.
// The rendered poster holds the space until the mesh arrives, so nothing jumps. Reduced motion keeps the
// model but stops the rotation, and a slow connection just keeps the poster.
export function HeroModel({ m, label }: { m: Media; label: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ready">("idle");
  const viewer = useRef<HTMLElement>(null);
  const [spin, setSpin] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSpin(!mq.matches);
    sync();
    mq.addEventListener("change", sync);

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
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const ready = () => setState("ready");
    el.addEventListener("poster-dismissed", ready);
    return () => el.removeEventListener("poster-dismissed", ready);
  }, [state]);

  return (
    <div className="relative aspect-square w-full">
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
          {...(spin && { "auto-rotate": "", "auto-rotate-delay": "300", "rotation-per-second": "18deg" })}
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
      <p className="absolute -bottom-1 left-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-2">{label}</p>
    </div>
  );
}
