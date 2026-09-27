import type { Media } from "@/lib/work";
import { srcSet } from "@/lib/image-widths";
import { cn } from "@/lib/utils";

// See-through images in the dark: renders sit on the bench like the live models; ink drawings and plots (ground "ink")
// turn light-on-dark, like an instrument trace; the few that need paper (ground "sheet": labelled renders, black
// parts) keep a dimmed bone plate. With the lights up all of them show as made, on nothing. Photos and screenshots
// keep their own ground and get a hairline frame. Never upscaled.
// A plain <img> on purpose: the pipeline already made the sizes, and this srcset labels each with its real width.
export function MediaImage({
  m,
  sizes,
  priority = false,
  className,
  imgClassName,
  style,
}: {
  m: Media;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties; // carries the view-transition name when an image morphs between pages
}) {
  return (
    <div className={cn(!m.alpha ? "border border-rule" : m.ground === "sheet" ? "plate" : "bench", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={m.src}
        srcSet={srcSet(m.src, m.width)}
        sizes={sizes}
        width={m.width}
        height={m.height}
        alt={m.alt ?? ""}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        style={{ maxWidth: `min(100%, ${m.width}px)`, ...style }}
        className={cn("h-auto w-full", m.alpha && m.ground === "ink" && "ink", imgClassName)}
      />
    </div>
  );
}
