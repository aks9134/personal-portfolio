"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/work";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        alt?: string;
        "camera-controls"?: string;
        "camera-orbit"?: string;
        "disable-zoom"?: string;
        "disable-pan"?: string;
        "interaction-prompt"?: string;
        "touch-action"?: string;
      };
    }
  }
}

const size = (bytes = 0) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);

// A 3D model that costs nothing until asked for: poster and a load button first, then <model-viewer>
// (self-hosted, meshopt decoder from /vendor). Rotate only: zoom and pan are off so the page scroll is never trapped.
export function ModelViewer({ m }: { m: Media }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const viewer = useRef<HTMLElement>(null);

  async function load() {
    setState("loading");
    const w = window as unknown as { ModelViewerElement?: { meshoptDecoderLocation?: string } };
    w.ModelViewerElement = { ...w.ModelViewerElement, meshoptDecoderLocation: "/vendor/meshopt_decoder.js" };
    try {
      await import("@google/model-viewer");
    } catch {
      setState("error");
    }
  }

  // model-viewer fires poster-dismissed the moment it reveals the model: fade our poster out on the same frame.
  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const ready = () => {
      setState("ready");
      // The load button is gone, so keep keyboard users on the model (its focusable part lives in the shadow root).
      el.shadowRoot?.querySelector<HTMLElement>(".userInput")?.focus({ preventScroll: true });
    };
    const failed = () => setState("error");
    el.addEventListener("poster-dismissed", ready);
    el.addEventListener("error", failed);
    return () => {
      el.removeEventListener("poster-dismissed", ready);
      el.removeEventListener("error", failed);
    };
  }, [state]);

  const live = state === "loading" || state === "ready";
  return (
    <div>
      <div className="plate relative aspect-[4/3] w-full border-[1.5px] border-ink">
        {live && (
          <model-viewer
            ref={viewer}
            src={m.src}
            alt={m.alt}
            camera-controls=""
            disable-zoom=""
            disable-pan=""
            interaction-prompt="none"
            touch-action="pan-y"
            {...(m.orbit && { "camera-orbit": m.orbit })}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <div slot="progress-bar" />
          </model-viewer>
        )}
        {m.poster && (
          <Image
            src={m.poster}
            width={m.width}
            height={m.height}
            alt=""
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ease-(--ease-out) motion-reduce:transition-none ${state === "ready" ? "opacity-0" : ""}`}
          />
        )}
        {state !== "ready" && (
          <button
            type="button"
            onClick={load}
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className="group absolute inset-0 flex items-end p-3 text-left disabled:cursor-progress"
          >
            <span className="border-[1.5px] border-ink bg-stock px-3 py-1.5 text-sm font-bold transition-transform duration-150 ease-(--ease-out) group-hover:bg-ink group-hover:text-stock group-active:scale-[0.97] group-disabled:bg-stock group-disabled:text-ink">
              {state === "loading" ? "Loading 3D model…" : state === "error" ? "The model didn't load. Try again" : `Load 3D model (${size(m.bytes)})`}
            </span>
          </button>
        )}
      </div>
      {state === "ready" && <p className="mt-2 text-sm text-ink-2">Drag to rotate, or use the arrow keys.</p>}
    </div>
  );
}
