import Image from "next/image";
import type { Media } from "@/lib/work";
import { cn } from "@/lib/utils";

// A media entry from media.generated.json on a plate (stock-colored in dark mode).
// `print` multiplies a white-ground line drawing into the stock, like ink on the sheet.
export function MediaImage({
  m,
  sizes,
  print = false,
  priority = false,
  className,
  imgClassName,
}: {
  m: Media;
  sizes: string;
  print?: boolean;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("plate", className)}>
      <Image
        src={m.src}
        width={m.width}
        height={m.height}
        alt={m.alt ?? ""}
        sizes={sizes}
        priority={priority}
        style={{ maxWidth: m.width }}
        className={cn("h-auto w-full", print && "print", imgClassName)}
      />
    </div>
  );
}
