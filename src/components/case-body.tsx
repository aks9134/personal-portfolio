import { Children, isValidElement, type ReactNode } from "react";
import { still, type Media } from "@/lib/work";

// The write-up regrouped into sections (one per "## " heading), each holding its text and media in source order. In the
// default layout this renders exactly as a plain flow. Two trial layouts (Allen to pick, 2026-10-07) rearrange the same
// markup in CSS (console.css, html[data-layout]):
//  - "side": one grid over the whole write-up (the sections flatten with display: contents). Headings and text fill
//    the left column, one row each; each media group sits in the right column from the row where it appears to the
//    next media group, held in view (sticky). Before the first media, the lead image stands in. Each stretch ends in
//    a flexible spacer row, so a picture taller than its text adds space after the text, never between paragraphs.
//  - "heads": each section's heading in a left column, its text and media to the right.

export type Kind = "h2" | "media";
type Tagged = { kind?: Kind };
const kindOf = (n: ReactNode): Kind | "text" => (isValidElement(n) && typeof n.type === "function" && (n.type as Tagged).kind) || "text";

type Block = { kind: "text"; node: ReactNode; row: number } | { kind: "media"; nodes: ReactNode[]; rows: string };

export function CaseBody({ children, lead }: { children: ReactNode; lead: Media }) {
  // MDX hands its layout one element, the compiled content; rendering that once gives the fragment of blocks.
  let flat = children;
  if (isValidElement(children) && typeof children.type === "function" && !(children.type as Tagged).kind) {
    const out = (children.type as (p: unknown) => ReactNode)(children.props);
    if (isValidElement(out)) flat = (out.props as { children?: ReactNode }).children;
  }
  const nodes = Children.toArray(flat).filter((n) => !(typeof n === "string" && !n.trim()));

  // One pass over the whole write-up: rows for the "side" grid, sections for the markup.
  const tracks: string[] = [];
  const sections: { head?: { node: ReactNode; row: number }; blocks: Block[] }[] = [{ blocks: [] }];
  let open: { set: (rows: string) => void; from: number } | null = null; // the media stretch still running
  let leadFrom = 0; // rows before the first media show the lead image
  const close = () => {
    tracks.push("1fr"); // the stretch's spacer row
    const to = tracks.length + 1;
    if (open) open.set(`${open.from} / ${to}`);
    return to;
  };
  let leadTo = 0;
  for (const n of nodes) {
    const k = kindOf(n);
    const sec = sections[sections.length - 1];
    if (k === "media") {
      const last = sec.blocks[sec.blocks.length - 1];
      if (last?.kind === "media" && open) {
        last.nodes.push(n); // consecutive media share one cell
        continue;
      }
      if (!open && tracks.length) leadTo = close();
      else if (open) close();
      const block: Block = { kind: "media", nodes: [n], rows: "" };
      open = { set: (rows) => (block.rows = rows), from: tracks.length + 1 };
      sec.blocks.push(block);
      continue;
    }
    tracks.push("auto");
    if (!open && !leadFrom) leadFrom = 1;
    if (k === "h2") sections.push({ head: { node: n, row: tracks.length }, blocks: [] });
    else sec.blocks.push({ kind: "text", node: n, row: tracks.length });
  }
  if (open) close();
  else if (tracks.length) leadTo = close();

  const cell = (rows: string | number) => ({ "--r": String(rows) }) as React.CSSProperties;
  return (
    <div className="lcc-flow" style={{ "--rows": tracks.join(" ") } as React.CSSProperties}>
      {leadFrom > 0 && leadTo > 0 && (
        <div className="lcc-carry" aria-hidden style={cell(`1 / ${leadTo}`)}>
          <div className="lcc-stick">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={still(lead).src} alt="" width={lead.width} height={lead.height} loading="lazy" decoding="async" />
          </div>
        </div>
      )}
      {sections
        .filter((s) => s.head || s.blocks.length)
        .map((s, si) => (
          <section key={si} className={s.head ? "lcc-sec" : "lcc-sec lcc-sec-lead"}>
            {s.head && (
              <div className="lcc-sec-head" style={cell(s.head.row)}>
                {s.head.node}
              </div>
            )}
            <div className="lcc-sec-body">
              {s.blocks.map((b, bi) =>
                b.kind === "text" ? (
                  <div key={bi} className="lcc-t" style={cell(b.row)}>
                    {b.node}
                  </div>
                ) : (
                  <div key={bi} className="lcc-media" style={cell(b.rows)}>
                    <div className="lcc-stick">{b.nodes}</div>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
    </div>
  );
}
