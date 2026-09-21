import Image from "next/image";
import type { Media } from "@/lib/work";
import { cn } from "@/lib/utils";

// Every image keeps its true colors. Cut-outs (see-through background) sit on a neutral sheet;
// photos, drawings and plots keep their own ground and get a thin ink frame. Never upscaled.
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
    <div className={cn(m.alpha ? "sheet p-4 sm:p-6" : "border-[1.5px] border-ink", className)}>
      <Image
        src={m.src}
        width={m.width}
        height={m.height}
        alt={m.alt ?? ""}
        sizes={sizes}
        priority={priority}
        style={{ maxWidth: m.width }}
        className={cn("h-auto w-full", imgClassName)}
      />
    </div>
  );
}
