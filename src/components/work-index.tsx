"use client";
import { useState } from "react";
import type { Media } from "@/lib/work";
import { MediaImage } from "./media-image";

export type IndexRow = { slug: string; title: string; context: string; year: string; status: string; still: Media };

// The whole body of work on one sheet, read like a parts list: every project on one line, so a visitor scanning
// for thirty seconds sees all eight at once. It works the way the exploded-view legend does: point at a row (or
// tab to it) and that project's render is pulled onto the sheet beside the list. The preview is a picture of the
// row, so it's hidden from screen readers; on phones and touch screens the list stands alone.
export function WorkIndex({ rows }: { rows: IndexRow[] }) {
  const [on, setOn] = useState(0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
      <ol className="border-t-[1.5px] border-ink">
        {rows.map((r, i) => (
          <li key={r.slug} className="border-b border-rule-soft">
            <a
              href={`/work/${r.slug}`}
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              data-on={on === i || undefined}
              className="index-row grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-x-2 py-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_auto] md:grid-cols-[1.75rem_minmax(0,1.1fr)_minmax(0,1fr)_4.5rem_10rem]"
            >
              <span className="font-bold tabular-nums">{i + 1}</span>
              <span className="text-lg font-bold leading-tight [font-stretch:106%]">{r.title}</span>
              <span className="col-start-2 text-sm text-ink-2 md:col-start-auto">{r.context}</span>
              <span className="hidden text-sm tabular-nums text-ink-2 md:block">{r.year}</span>
              <span className="col-start-2 text-xs font-extrabold uppercase tracking-[0.01em] text-stamp [font-stretch:118%] sm:col-start-auto sm:row-start-1 sm:whitespace-nowrap sm:text-right md:row-start-auto">
                {r.status}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-8 grid aspect-[4/3] border-[1.5px] border-ink p-5">
          {rows.map((r, i) => (
            <div key={r.slug} data-on={on === i || undefined} className="index-plate col-start-1 row-start-1 grid place-items-center overflow-hidden">
              <MediaImage
                m={r.still}
                sizes="28rem"
                imgClassName="max-h-[15rem] w-auto xl:max-h-[18rem]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
