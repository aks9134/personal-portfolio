import type { Metadata } from "next";
import Link from "next/link";
import { Figure, Strip } from "@/components/figure";
import { MediaImage } from "@/components/media-image";
import { PartsFigure } from "@/components/parts-figure";
import { SiteHeader } from "@/components/site-nav";
import { Stamp, tiltFor } from "@/components/stamp";
import { allWork, getWork, still, workSlugs } from "@/lib/work";

export const dynamicParams = false;

export function generateStaticParams() {
  return workSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const w = await getWork((await params).slug);
  const og = still(w.media[w.hero]);
  return {
    title: w.title,
    description: w.line,
    openGraph: { title: w.title, description: w.line, images: [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] },
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
        <div className="mt-10 border-t-[1.5px] border-ink pt-6 md:mt-14">
          <h1 className="text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] [font-stretch:110%] md:text-7xl">{w.title}</h1>
          <p className="mt-3 text-ink-2">{w.context}, {w.year}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-6">
            <Stamp tilt={tiltFor(w.title)}>{w.status}</Stamp>
            {w.award && <Stamp large tilt={-3}>{w.award}</Stamp>}
          </div>
          <p className="mt-8 max-w-[62ch] text-xl leading-snug">{w.summary}</p>
        </div>

        <dl className="mt-10 grid border-t-[1.5px] border-ink sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k} className="border-b border-rule-soft py-4 sm:pr-6 lg:border-b-0">
              <dt className="text-sm font-bold">{k}</dt>
              <dd className="mt-1 leading-snug">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12">
          {w.figure ? (
            <PartsFigure m={w.media[w.figure.name]} parts={w.figure.parts} priority />
          ) : (
            <MediaImage
              m={still(w.media[w.hero])}
              priority
              print={w.heroStyle === "print"}
              sizes="(min-width: 1100px) 1100px, 100vw"
              className={`mx-auto max-w-[1100px] ${w.heroStyle === "frame" ? "border-[1.5px] border-ink" : ""}`}
              imgClassName="mx-auto max-h-[70vh] w-auto"
            />
          )}
        </div>

        <article className="mt-6">
          <w.Body
            components={{
              Figure: (p: Omit<Parameters<typeof Figure>[0], "media">) => <Figure media={w.media} {...p} />,
              Strip: (p: Omit<Parameters<typeof Strip>[0], "media">) => <Strip media={w.media} {...p} />,
            }}
          />
        </article>

        <nav aria-label="Next project" className="mt-24 border-t-[1.5px] border-ink pt-5">
          <Link href={`/work/${next.slug}`} className="group block">
            <span className="text-sm text-ink-2">Next project</span>
            <span className="mt-1 block text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%] group-hover:text-stamp group-hover:underline">
              {next.title}
            </span>
          </Link>
        </nav>
      </main>
    </>
  );
}
