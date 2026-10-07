import type { Metadata } from "next";
import { CaseBody } from "@/components/case-body";
import { Clips, Figure, Model, Strip, Video } from "@/components/figure";
import { CaseScan, type CaseHead } from "@/components/lab/console/case-scan";
import type { Spec } from "@/components/lab/console/scene";
import { PartsFigure } from "@/components/parts-figure";
import { SectionIndex } from "@/components/section-index";
import { preview, projectImage } from "@/lib/og";
import { site } from "@/lib/site";
import { allWork, getWork, still, workSlugs, type Work } from "@/lib/work";

export const dynamicParams = false;

export function generateStaticParams() {
  return workSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWork(slug);
  return {
    title: w.title,
    description: w.line,
    openGraph: preview(w.title, w.line, projectImage(slug), still(w.media[w.hero]).alt),
  };
}

// The machine each file opens on, where one exists.
function machine(w: Work): { model: Spec; apart?: { mm?: number }; estimated?: boolean } | null {
  const glb = (name: string, finish: Spec["finish"]) => ({ model: { src: w.media[name].src, finish, parts: w.media[name].parts ?? 0 } });
  if (w.slug === "robotic-arm") return glb("hand-model", "aluminium");
  if (w.slug === "gravity-storage-drive") return { ...glb("geared-module", "anodized"), apart: { mm: w.media["geared-module"].explode } };
  if (w.slug === "micro-vibration-canceller") return { model: { build: "canceller", finish: "own", parts: 14 }, apart: {} };
  if (w.slug === "tpu-weld-rig") return { model: { build: "weld-rig", finish: "own", parts: 0, view: { turn: 0.75, el: 0.62 } }, apart: {}, estimated: true };
  if (w.slug === "motorized-couch") return { model: { build: "couch", finish: "own", parts: 0, view: { turn: 0.6, el: 0.32 } }, apart: {}, estimated: true };
  return null;
}

// A project file in the console's language: the scan opener, the file's facts as a readout, then the write-up at
// reading width with the section list as a target list.
export default async function ConsoleFile({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const w = await getWork(slug);
  const all = await allWork();
  const at = all.findIndex((x) => x.slug === slug);
  const next = all[(at + 1) % all.length];
  const pad = (n: number) => String(n).padStart(2, "0");
  const m = machine(w);
  const head: CaseHead = {
    code: `${pad(at + 1)} / ${pad(all.length)}`,
    title: w.title,
    klass: `${w.context}, ${w.year}`,
    status: w.status,
    when: w.timeframe,
    line: w.line,
    award: w.award,
    model: m?.model,
    apart: m?.apart,
    estimated: m?.estimated,
    still: still(w.media[w.hero]),
  };
  const facts = [
    ["My part", w.role],
    ["Team", w.team],
    ["When", w.timeframe],
    ["Tools", w.tools],
  ];

  return (
    <main id="main" className="lab-console lc-case">
      <CaseScan h={head} />

      <div className="lcc-wrap">
        <p className="lcc-summary">{w.summary}</p>
        <dl className="lcc-facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="lc-dim">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {w.figure && (
          <div className="mt-16">
            <PartsFigure m={w.media[w.figure.name]} parts={w.figure.parts} />
          </div>
        )}

        <div className="lcc-grid">
          <article className="case-body">
            <w.Body
              components={{
                wrapper: ({ children }: { children: React.ReactNode }) => (
                  <CaseBody>
                    {children}
                  </CaseBody>
                ),
                Figure: (p: Omit<Parameters<typeof Figure>[0], "media">) => <Figure media={w.media} {...p} />,
                Strip: (p: Omit<Parameters<typeof Strip>[0], "media">) => <Strip media={w.media} {...p} />,
                Model: (p: Omit<Parameters<typeof Model>[0], "media">) => <Model media={w.media} {...p} />,
                Video: (p: Omit<Parameters<typeof Video>[0], "media">) => <Video media={w.media} {...p} />,
                Clips: (p: Omit<Parameters<typeof Clips>[0], "media">) => <Clips media={w.media} {...p} />,
              }}
            />
            <p className="clear-both mt-20 text-lg">
              Questions about this project? Email <a href={`mailto:${site.email}`} className="link">{site.email}</a>.
            </p>
          </article>
          <aside className="hidden xl:block">
            <SectionIndex within=".case-body" sections={w.sections} />
          </aside>
        </div>
      </div>

      <nav aria-label="Next file" className="lcc-next">
        <a href={`/work/${next.slug}`}>
          <span className="lc-dim">Next file, {pad(((at + 1) % all.length) + 1)}</span>
          <b>{next.title}</b>
          <span className="lcc-next-line">{next.line}</span>
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="lc-dim lcc-back">Back to the console</a>
      </nav>
    </main>
  );
}
