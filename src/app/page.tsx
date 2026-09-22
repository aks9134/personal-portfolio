import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { PartsFigure } from "@/components/parts-figure";
import { SiteNav } from "@/components/site-nav";
import { Stamp, tiltFor } from "@/components/stamp";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";

// Structured data for search engines: who this page is about (Next.js JSON-LD guide; "<" escaped against injection).
const profile = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    name: site.name,
    jobTitle: "Mechanical Design Engineer",
    worksFor: { "@type": "Organization", name: "Curtiss-Wright" },
    alumniOf: { "@type": "CollegeOrUniversity", name: resume.education.school },
    email: `mailto:${site.email}`,
    sameAs: [site.linkedin],
    knowsAbout: ["Mechanical design", "Machining", "Finite element analysis", "GD&T", "Prototyping"],
  },
};
import { allWork, still, type Work } from "@/lib/work";

const titleLink = "hover:text-stamp hover:underline";

function Title({ w, as: H = "h3", className }: { w: Work; as?: "h2" | "h3"; className: string }) {
  return (
    <H className={className}>
      <Link href={`/work/${w.slug}`} className={titleLink}>{w.title}</Link>
    </H>
  );
}

function Meta({ w }: { w: Work }) {
  return <p className="mt-1 text-sm text-ink-2">{w.context}, {w.year}</p>;
}

// Case-study band. Layout follows the hero image: tall sits beside the text, wide runs full width, the rest splits.
function Band({ w }: { w: Work }) {
  const m = still(w.media[w.hero]);
  const ratio = m.width / m.height;
  const text = (
    <div>
      <Title w={w} className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]" />
      <Meta w={w} />
      <p className="mt-5 max-w-[48ch] text-lg leading-snug">{w.line}</p>
      <div className="mt-6"><Stamp tilt={tiltFor(w.title)}>{w.status}</Stamp></div>
    </div>
  );

  if (ratio > 1.6)
    return (
      <article className="mt-20 border-t-[1.5px] border-ink pt-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Title w={w} className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]" />
            <Meta w={w} />
          </div>
          <Stamp tilt={tiltFor(w.title)}>{w.status}</Stamp>
        </div>
        <MediaImage m={m} sizes="(min-width: 1100px) 1100px, 100vw" className="mx-auto mt-6 max-w-[1100px]" />
        <p className="mx-auto mt-5 max-w-[62ch] text-center text-lg leading-snug">{w.line}</p>
      </article>
    );

  if (ratio < 0.8)
    return (
      <article className="mt-20 grid gap-10 border-t-[1.5px] border-ink pt-5 md:grid-cols-2 md:items-center">
        {text}
        <MediaImage m={m} sizes="20rem" className="mx-auto w-fit" imgClassName="h-[26rem] w-auto md:h-[32rem]" />
      </article>
    );

  return (
    <article className="mt-20 grid gap-10 border-t-[1.5px] border-ink pt-5 md:grid-cols-[1.1fr_1fr] md:items-center">
      <MediaImage m={m} sizes="(min-width: 768px) 50vw, 100vw" className="mx-auto w-full" imgClassName="mx-auto max-w-[min(100%,34rem)]" />
      {text}
    </article>
  );
}

function ShortEntry({ w }: { w: Work }) {
  const m = still(w.media[w.hero]);
  return (
    <article>
      <div className="flex h-44 items-center justify-center">
        <MediaImage
          m={m}
          sizes="20rem"
          imgClassName="max-h-40 w-auto"
        />
      </div>
      <Title w={w} className="mt-5 text-xl font-bold leading-tight" />
      <Meta w={w} />
      <p className="mt-2 leading-snug">{w.line}</p>
    </article>
  );
}

export default async function Home() {
  const [lead, ...rest] = await allWork();
  const cases = rest.filter((w) => w.format === "case");
  const shorts = rest.filter((w) => w.format === "short");

  return (
    <main id="main" className="mx-auto max-w-[1400px] overflow-x-clip px-4 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      <header className="flex flex-col gap-5 pt-8 md:flex-row md:items-start md:justify-between md:pt-10">
        <div>
          <h1 className="text-6xl font-extrabold leading-[0.95] tracking-[-0.035em] [font-stretch:112%] md:text-[5.25rem]">{site.name}</h1>
          <p className="mt-4 max-w-[62ch] text-lg leading-snug text-ink-2 md:text-xl">
            <strong className="font-bold text-ink">{site.role}.</strong> {site.line}
          </p>
        </div>
        <SiteNav />
      </header>

      <section aria-labelledby="lead-title" className="mt-10 border-t-[1.5px] border-ink pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="lead-title" className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%] md:text-4xl">
            <Link href={`/work/${lead.slug}`} className={titleLink}>{lead.title}</Link>
          </h2>
          <p className="text-sm text-ink-2">{lead.context}, {lead.year}. Exploded view of the final design.</p>
        </div>
        <div className="mt-5">
          {lead.figure ? (
            <PartsFigure m={lead.media[lead.figure.name]} parts={lead.figure.parts} priority>
              <p className="mt-5 leading-snug">{lead.line}</p>
              {lead.award && <div className="mt-5"><Stamp large tilt={-4}>{lead.award}</Stamp></div>}
            </PartsFigure>
          ) : (
            <MediaImage m={still(lead.media[lead.hero])} priority sizes="100vw" />
          )}
        </div>
      </section>

      <section id="work" aria-labelledby="work-title" className="scroll-mt-6">
        <h2 id="work-title" className="sr-only">More work</h2>
        {cases.map((w) => <Band key={w.slug} w={w} />)}
        <div className="mt-20 grid gap-x-8 gap-y-14 border-t-[1.5px] border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {shorts.map((w) => <ShortEntry key={w.slug} w={w} />)}
        </div>
      </section>

      <section id="experience" aria-labelledby="exp-title" className="mt-24 scroll-mt-6 border-t-[1.5px] border-ink pt-5">
        <h2 id="exp-title" className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]">Experience</h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {resume.jobs.map((e) => (
            <div key={e.org}>
              <dt className="font-bold">{e.org}</dt>
              <dd className="text-ink-2">{e.title}, {e.place}. <span className="tabular-nums">{e.dates}</span></dd>
            </div>
          ))}
          <div>
            <dt className="font-bold">{resume.education.school}</dt>
            <dd className="text-ink-2">{resume.education.degree}, <span className="tabular-nums">{resume.education.year}</span></dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
