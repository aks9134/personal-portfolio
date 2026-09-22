import type { Media } from "@/lib/work";
import { srcSet } from "@/lib/image-widths";
import { cn } from "@/lib/utils";

// Every image keeps its true colors. See-through images (solid-matte cut-outs, ink drawings) sit on the stock;
// photos and screenshots keep their own ground and get a thin ink frame. Never upscaled.
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
    <div className={cn(m.alpha ? "plate" : "border-[1.5px] border-ink", className)}>
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
        className={cn("h-auto w-full", imgClassName)}
      />
    </div>
  );
}
