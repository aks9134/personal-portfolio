import type { Media } from "@/lib/work";
import { MediaImage } from "./media-image";

type Item = { name: string; label: string };

function get(media: Record<string, Media>, name: string) {
  const m = media[name];
  if (!m) throw new Error(`No media named "${name}". Add it to media.json and run npm run media.`);
  return m;
}

// One image with a caption. `print` for white-ground drawings and plots.
// `narrow` figures sit in the right margin beside the text on wide screens, like a sheet clipped to the traveler.
export function Figure({ media, name, caption, print = false, narrow = false }: { media: Record<string, Media>; name: string; caption?: string; print?: boolean; narrow?: boolean }) {
  return (
    <figure className={narrow ? "my-12 max-w-md lg:float-right lg:clear-right lg:mb-8 lg:ml-12 lg:mt-6 lg:w-[38%] lg:max-w-lg" : "clear-both my-12 max-w-4xl"}>
      <MediaImage m={get(media, name)} print={print} sizes={narrow ? "28rem" : "(min-width: 1100px) 1100px, 100vw"} />
      {caption && <figcaption className="mt-3 max-w-[65ch] text-sm text-ink-2">{caption}</figcaption>}
    </figure>
  );
}

// Versions side by side, like test strips: how a design changed from one build to the next.
export function Strip({ media, items, caption }: { media: Record<string, Media>; items: Item[]; caption?: string }) {
  return (
    <figure className="clear-both my-12">
      <div className="grid gap-6 border-y-[1.5px] border-ink py-6 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={it.name} className={i > 0 ? "sm:border-l-[1.5px] sm:border-ink sm:pl-6" : ""}>
            <MediaImage m={get(media, it.name)} print sizes="(min-width: 640px) 50vw, 100vw" />
            <p className="mt-3 text-sm font-semibold">{it.label}</p>
          </div>
        ))}
      </div>
      {caption && <figcaption className="mt-3 max-w-[65ch] text-sm text-ink-2">{caption}</figcaption>}
    </figure>
  );
}
