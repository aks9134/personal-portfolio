import { Children, isValidElement, type ReactNode } from "react";

// The write-up regrouped into sections, one per "## " heading, so that from 1280 px each heading can sit in its own
// left column, held in view while its section scrolls, with the section's text and media to its right (console.css,
// "Write-up sections"; Allen's pick of two trials, 2026-10-07). Narrower screens show the plain flow.

type Tagged = { kind?: "h2" };
const isHead = (n: ReactNode) => isValidElement(n) && typeof n.type === "function" && (n.type as Tagged).kind === "h2";

export function CaseBody({ children }: { children: ReactNode }) {
  // MDX hands its layout one element, the compiled content; rendering that once gives the fragment of blocks.
  let flat = children;
  if (isValidElement(children) && typeof children.type === "function" && !(children.type as Tagged).kind) {
    const out = (children.type as (p: unknown) => ReactNode)(children.props);
    if (isValidElement(out)) flat = (out.props as { children?: ReactNode }).children;
  }
  const sections: { head?: ReactNode; body: ReactNode[] }[] = [{ body: [] }];
  for (const n of Children.toArray(flat)) {
    if (typeof n === "string" && !n.trim()) continue;
    if (isHead(n)) sections.push({ head: n, body: [] });
    else sections[sections.length - 1].body.push(n);
  }
  return (
    <>
      {sections
        .filter((s) => s.head || s.body.length)
        .map((s, i) => (
          <section key={i} className={s.head ? "lcc-sec" : "lcc-sec lcc-sec-lead"}>
            {s.head && <div className="lcc-sec-head">{s.head}</div>}
            <div className="lcc-sec-body">{s.body}</div>
          </section>
        ))}
    </>
  );
}
