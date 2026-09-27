import type { Metadata } from "next";
import { Clips, Figure, Model, Strip, Video } from "@/components/figure";
import { MediaImage } from "@/components/media-image";
import { PartsFigure } from "@/components/parts-figure";
import { SectionIndex } from "@/components/section-index";
import { preview, projectImage } from "@/lib/og";
import { site } from "@/lib/site";
import { allWork, getWork, still, workSlugs } from "@/lib/work";

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

export default async function WorkPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const w = await getWork(slug);
  const all = await allWork();
  const next = all[(all.findIndex((x) => x.slug === slug) + 1) % all.length];
  const facts = [
    ["My part", w.role],
    ["Team", w.team],
    ["When", w.timeframe],
    ["Tools", w.tools],
  ];

  return (
    <main id="main" className="mx-auto max-w-[1600px] px-4 md:px-8">
      {/* Title block: what it is, where and when, what state it reached. The thing itself follows at once. */}
      <header className={`grid gap-10 pt-12 md:pt-16 ${w.figure ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end"}`}>
        <div>
          <h1 className="display text-[clamp(3.75rem,10vw,9.5rem)]" style={{ viewTransitionName: `t-${w.slug}` }}>
            {w.title}
          </h1>
          <p className="readout mt-5 text-muted">
            {w.context}, {w.year}
          </p>
          <p className="readout mt-2">
            Status <span className="val">{w.status}</span>
          </p>
          {w.award && <p className="readout val mt-2">{w.award}</p>}
          <p className="mt-8 max-w-[60ch] text-xl leading-snug">{w.summary}</p>
        </div>
        {!w.figure && (
          <div className="bg-bg-2 p-4">
            <MediaImage m={still(w.media[w.hero])} priority sizes="(min-width: 1024px) 45vw, 100vw" imgClassName="mx-auto max-h-[70svh] w-auto object-contain" className="mx-auto w-fit" />
          </div>
        )}
      </header>

      <dl className="mt-14 grid border-t border-rule-strong sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k} className="border-b border-rule py-5 sm:pr-8 lg:border-b-0">
            <dt className="readout text-muted">{k}</dt>
            <dd className="mt-2 leading-snug">{v}</dd>
          </div>
        ))}
      </dl>

      {w.figure && (
        <div className="mt-14">
          <PartsFigure m={w.media[w.figure.name]} parts={w.figure.parts} priority />
        </div>
      )}

      <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-16">
        <article className="case-body">
          <w.Body
            components={{
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

      <nav aria-label="Next project" className="mt-24 border-t border-rule-strong pt-8">
        <a href={`/work/${next.slug}`} className="group block">
          <span className="readout text-muted">Next project</span>
          <span className="display mt-3 block text-[clamp(3rem,8vw,7.5rem)] transition-colors duration-150 group-hover:text-accent" style={{ viewTransitionName: `t-${next.slug}` }}>
            {next.title}
          </span>
          <span className="mt-2 block max-w-[60ch] text-muted">{next.line}</span>
        </a>
      </nav>
    </main>
  );
}
