import Image from "next/image";
import type { Media } from "@/lib/work";
import { cn } from "@/lib/utils";

// Every image keeps its true colors. See-through images (solid-matte cut-outs, ink drawings) sit on the stock;
// photos and screenshots keep their own ground and get a thin ink frame. Never upscaled.
export function MediaImage({
  m,
  sizes,
  priority = false,
  className,
  imgClassName,
}: {
  m: Media;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn(m.alpha ? "plate" : "border-[1.5px] border-ink", className)}>
      <Image
        src={m.src}
        width={m.width}
        height={m.height}
        alt={m.alt ?? ""}
        sizes={sizes}
        priority={priority}
        style={{ maxWidth: `min(100%, ${m.width}px)` }}
        className={cn("h-auto w-full", imgClassName)}
      />
    </div>
  );
}
