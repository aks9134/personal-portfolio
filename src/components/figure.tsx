import { widthCopy } from "@/lib/image-widths";
import type { Media } from "@/lib/work";
import { MediaImage } from "./media-image";
import { CaseModel } from "./stage/case-model";

type Item = { name: string; label: string };

function get(media: Record<string, Media>, name: string) {
  const m = media[name];
  if (!m) throw new Error(`No media named "${name}". Add it to media.json and run npm run media.`);
  return m;
}

const cap = "mt-3 max-w-[65ch] text-sm leading-relaxed text-muted";

// One image with a caption. `narrow` figures (a drawing, a portrait photo) are held to a smaller width, in line with
// the text like every other figure: floated beside short paragraphs they left uneven gaps.
export function Figure({ media, name, caption, narrow = false }: { media: Record<string, Media>; name: string; caption?: string; narrow?: boolean }) {
  return (
    <figure className={narrow ? "clear-both my-14 max-w-xl" : "clear-both my-14 max-w-4xl"}>
      <MediaImage m={get(media, name)} sizes={narrow ? "36rem" : "(min-width: 1100px) 900px, 100vw"} className="w-fit max-w-full" />
      {caption && <figcaption className={cap}>{caption}</figcaption>}
    </figure>
  );
}

// Versions side by side: how a design changed from one build to the next.
export function Strip({ media, items, caption }: { media: Record<string, Media>; items: Item[]; caption?: string }) {
  return (
    <figure className="clear-both my-14">
      <div className="grid gap-6 border-y border-rule py-6 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={it.name} className={i > 0 ? "sm:border-l sm:border-rule sm:pl-6" : ""}>
            <MediaImage m={get(media, it.name)} sizes="(min-width: 640px) 50vw, 100vw" className="w-fit max-w-full" />
            <p className="mt-3 text-sm font-semibold">{it.label}</p>
          </div>
        ))}
      </div>
      {caption && <figcaption className={cap}>{caption}</figcaption>}
    </figure>
  );
}

// A design generation as a live 3D model.
export function Model({ media, name, caption }: { media: Record<string, Media>; name: string; caption?: string }) {
  return (
    <figure className="clear-both my-14 max-w-4xl">
      <CaseModel m={get(media, name)} />
      {caption && <figcaption className={cap}>{caption}</figcaption>}
    </figure>
  );
}

// Silent clips in the browser's own player: nothing downloads until play is pressed.
// `shown` is about the widest the player gets on screen, so the poster comes from the nearest smaller copy.
function Player({ m, label, shown }: { m: Media; label?: string; shown: 828 | 1200 }) {
  const poster = m.poster && m.width > shown ? widthCopy(m.poster, shown) : m.poster;
  return (
    <video controls muted playsInline preload="none" poster={poster} width={m.width} height={m.height} aria-label={m.alt ?? label} className="h-auto w-full border border-rule bg-bg-2">
      <source src={m.src} type="video/mp4" />
    </video>
  );
}

export function Video({ media, name, caption }: { media: Record<string, Media>; name: string; caption?: string }) {
  return (
    <figure className="clear-both my-14 max-w-4xl">
      <Player m={get(media, name)} shown={1200} />
      {caption && <figcaption className={cap}>{caption}</figcaption>}
    </figure>
  );
}

// Several clips in a grid, each titled.
export function Clips({ media, items, caption }: { media: Record<string, Media>; items: Item[]; caption?: string }) {
  return (
    <figure className="clear-both my-14">
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.name}>
            <Player m={get(media, it.name)} label={it.label} shown={828} />
            <p className="mt-2 text-sm font-semibold">{it.label}</p>
          </div>
        ))}
      </div>
      {caption && <figcaption className={cap}>{caption}</figcaption>}
    </figure>
  );
}
