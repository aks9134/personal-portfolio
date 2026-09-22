import type { Metadata } from "next";
import { Tilt } from "@/components/tilt";
import { Clips, Figure, Model, Strip, Video } from "@/components/figure";
import { MediaImage } from "@/components/media-image";
import { PartsFigure } from "@/components/parts-figure";
import { SiteHeader } from "@/components/site-nav";
import { Stamp, tiltFor } from "@/components/stamp";
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
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1400px] overflow-x-clip px-4 md:px-10">
        {/* The thing leads: the hero sits beside the title on wide screens and right after the summary on phones.
            Pages with a parts figure show it full width below instead, because its legend needs the room. */}
        <div className={`mt-10 border-t-[1.5px] border-ink pt-6 md:mt-14 ${w.figure ? "" : "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14"}`}>
          <div>
            <h1 className={`text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] [font-stretch:110%] md:text-7xl ${w.figure ? "" : "lg:text-6xl xl:text-7xl"}`} style={{ viewTransitionName: `t-${w.slug}` }}>{w.title}</h1>
            <p className="mt-3 text-ink-2">{w.context}, {w.year}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-6">
              <Stamp tilt={tiltFor(w.title)}>{w.status}</Stamp>
              {w.award && <Stamp large tilt={-3}>{w.award}</Stamp>}
            </div>
            <p className="mt-8 max-w-[62ch] text-xl leading-snug">{w.summary}</p>
          </div>
          {!w.figure && (
            <Tilt className="mx-auto mt-10 w-fit max-w-full lg:mt-0" max={5}>
              <MediaImage
                m={still(w.media[w.hero])}
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                imgClassName="mx-auto max-h-[70vh] w-auto"
                style={{ viewTransitionName: `m-${w.slug}` } as React.CSSProperties}
              />
            </Tilt>
          )}
        </div>

        <dl className="rise mt-10 grid border-t-[1.5px] border-ink sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k} className="border-b border-rule-soft py-4 sm:pr-6 lg:border-b-0">
              <dt className="text-sm font-bold">{k}</dt>
              <dd className="mt-1 leading-snug">{v}</dd>
            </div>
          ))}
        </dl>

        {w.figure && (
          <div className="mt-12">
            <PartsFigure m={w.media[w.figure.name]} parts={w.figure.parts} priority vt={`m-${w.slug}`} />
          </div>
        )}

        <article className="mt-6">
          <w.Body
            components={{
              Figure: (p: Omit<Parameters<typeof Figure>[0], "media">) => <Figure media={w.media} {...p} />,
              Strip: (p: Omit<Parameters<typeof Strip>[0], "media">) => <Strip media={w.media} {...p} />,
              Model: (p: Omit<Parameters<typeof Model>[0], "media">) => <Model media={w.media} {...p} />,
              Video: (p: Omit<Parameters<typeof Video>[0], "media">) => <Video media={w.media} {...p} />,
              Clips: (p: Omit<Parameters<typeof Clips>[0], "media">) => <Clips media={w.media} {...p} />,
            }}
          />
        </article>

        <p className="clear-both mt-20 text-lg">
          Questions about this project? Email{" "}
          <a href={`mailto:${site.email}`} className="font-semibold underline hover:text-stamp">{site.email}</a>.
        </p>

        <nav aria-label="Next project" className="mt-10 border-t-[1.5px] border-ink pt-5">
          <a href={`/work/${next.slug}`} className="group block">
            <span className="text-sm text-ink-2">Next project</span>
            <span
              className="mt-1 block text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%] group-hover:text-stamp group-hover:underline"
              style={{ viewTransitionName: `t-${next.slug}` }}
            >
              {next.title}
            </span>
          </a>
        </nav>
      </main>
    </>
  );
}
