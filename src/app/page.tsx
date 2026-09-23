import { Contact } from "@/components/contact";
import { HeroModel } from "@/components/hero-model";
import { KineticName } from "@/components/kinetic-name";
import { MediaImage } from "@/components/media-image";
import { PartsFigure } from "@/components/parts-figure";
import { Schedule } from "@/components/schedule";
import { SiteNav } from "@/components/site-nav";
import { Stamp, tiltFor } from "@/components/stamp";
import { Tilt } from "@/components/tilt";
import { WorkIndex } from "@/components/work-index";
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

// The shop and software he works in, as a band that slides with the scroll. Decorative: the real list lives on /about.
const tools = [
  "SolidWorks", "Fusion 360", "Solid Edge", "ANSYS Mechanical", "Fluent CFD", "MATLAB", "Simulink",
  "Arduino", "GD&T ASME Y14.5", "Tolerance stack-ups", "Manual mill", "Lathe", "Welding", "3D printing",
];

// Project links are plain anchors on purpose: a full navigation is what lets the browser run a real
// cross-document view transition, so the render and title morph into the case study instead of blinking.
function WorkLink({ w, className }: { w: Work; className?: string }) {
  return (
    <a href={`/work/${w.slug}`} className={className} style={{ viewTransitionName: `t-${w.slug}` }}>
      {w.title}
    </a>
  );
}

function Title({ w, as: H = "h3", className }: { w: Work; as?: "h2" | "h3"; className: string }) {
  return (
    <H className={className}>
      <WorkLink w={w} className={titleLink} />
    </H>
  );
}

function Meta({ w }: { w: Work }) {
  return <p className="mt-1 text-sm text-ink-2">{w.context}, {w.year}</p>;
}

// Case-study band. Layout follows the hero image: tall sits beside the text, wide runs full width, the rest splits.
function Band({ w }: { w: Work }) {
  const m = still(w.media[w.cover ?? w.hero]);
  const ratio = m.width / m.height;
  const vt = { viewTransitionName: `m-${w.slug}` } as React.CSSProperties;
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
      <article className="rise mt-20 border-t-[1.5px] border-ink pt-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Title w={w} className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]" />
            <Meta w={w} />
          </div>
          <Stamp tilt={tiltFor(w.title)}>{w.status}</Stamp>
        </div>
        <Tilt className="mx-auto mt-6 max-w-[1100px]" max={5}>
          <MediaImage m={m} sizes="(min-width: 1100px) 1100px, 100vw" className="wipe" style={vt} />
        </Tilt>
        <p className="mx-auto mt-5 max-w-[62ch] text-center text-lg leading-snug">{w.line}</p>
      </article>
    );

  // A tall render leaves the text column mostly empty, so the real hardware (the project's hero photo) fills it.
  if (ratio < 0.8) {
    const photo = w.cover && w.cover !== w.hero ? still(w.media[w.hero]) : null;
    return (
      <article className="rise mt-20 grid gap-10 border-t-[1.5px] border-ink pt-5 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          {text}
          {photo && (
            <figure className="mt-10">
              <MediaImage m={photo} sizes="(min-width: 768px) 40vw, 100vw" className="wipe" imgClassName="max-w-[min(100%,30rem)]" />
              {photo.alt && <figcaption aria-hidden className="mt-2 text-sm text-ink-2">{photo.alt.split(":")[0]}.</figcaption>}
            </figure>
          )}
        </div>
        <Tilt className="mx-auto w-fit">
          <MediaImage m={m} sizes="20rem" className="wipe" imgClassName="h-[28rem] w-auto md:h-[40rem]" style={vt} />
        </Tilt>
      </article>
    );
  }

  return (
    <article className="rise mt-20 grid gap-10 border-t-[1.5px] border-ink pt-5 md:grid-cols-[1.1fr_1fr] md:items-center">
      <Tilt className="mx-auto w-full">
        <MediaImage m={m} sizes="(min-width: 768px) 50vw, 100vw" className="wipe" imgClassName="mx-auto max-w-[min(100%,34rem)]" style={vt} />
      </Tilt>
      {text}
    </article>
  );
}

function ShortEntry({ w }: { w: Work }) {
  const m = still(w.media[w.hero]);
  return (
    <article className="rise group">
      <Tilt className="flex h-44 items-center justify-center" max={9}>
        <MediaImage
          m={m}
          sizes="20rem"
          imgClassName="max-h-40 w-auto"
          style={{ viewTransitionName: `m-${w.slug}` } as React.CSSProperties}
        />
      </Tilt>
      <Title w={w} className="mt-5 text-xl font-bold leading-tight" />
      <Meta w={w} />
      <p className="mt-2 leading-snug">{w.line}</p>
    </article>
  );
}

export default async function Home() {
  const all = await allWork();
  const [lead, ...rest] = all;
  const cases = rest.filter((w) => w.format === "case");
  const shorts = rest.filter((w) => w.format === "short");
  // The hand turns in the hero: the lightest model on the site, and the one that reads at a glance.
  const arm = all.find((w) => w.media["hand-model"]);

  return (
    <main id="main" className="mx-auto max-w-[1400px] overflow-x-clip px-4 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      <header data-rail={site.name} className="pt-8 md:pt-10">
        <div className="flex justify-end">
          <SiteNav />
        </div>
        <div className="mt-6 grid items-center gap-8 md:mt-2 md:grid-cols-[minmax(0,1fr)_min(26rem,32vw)] md:gap-12">
          <div>
            <KineticName
              name={site.name}
              className="text-[clamp(3.5rem,11vw,8.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em]"
            />
            <p className="mt-5 max-w-[46ch] text-xl leading-snug text-ink-2 md:text-2xl">
              <strong className="font-bold text-ink">{site.role}.</strong> {site.line}
            </p>
          </div>
          {arm && (
            <div className="w-full max-w-[22rem] justify-self-center md:max-w-none">
              <HeroModel m={arm.media["hand-model"]} label="Robotic hand, drag to turn" />
            </div>
          )}
        </div>
      </header>

      <section aria-labelledby="lead-title" data-rail={lead.title} className="mt-10 border-t-[1.5px] border-ink pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="lead-title" className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%] md:text-4xl">
            <WorkLink w={lead} className={titleLink} />
          </h2>
          <p className="text-sm text-ink-2">{lead.context}, {lead.year}. The exploded view shows the final design.</p>
        </div>
        <div className="mt-5">
          {lead.figure ? (
            <PartsFigure m={lead.media[lead.figure.name]} parts={lead.figure.parts} priority vt={`m-${lead.slug}`}>
              <p className="leading-snug">{lead.line}</p>
              {lead.award && <div className="mt-5 pr-3"><Stamp large still tilt={-3}>{lead.award}</Stamp></div>}
            </PartsFigure>
          ) : (
            <MediaImage m={still(lead.media[lead.hero])} priority sizes="100vw" />
          )}
        </div>
      </section>

      <section id="work" aria-labelledby="work-title" data-rail="Work" className="mt-20 scroll-mt-6">
        <h2 id="work-title" className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]">All work</h2>
        <div className="rise mt-6">
          <WorkIndex
            rows={all.map((w) => ({
              slug: w.slug,
              title: w.title,
              context: w.context,
              year: w.year,
              status: w.status,
              still: still(w.media[w.cover ?? w.hero]),
            }))}
          />
        </div>
        {cases.map((w) => <Band key={w.slug} w={w} />)}
        <div className="mt-20 grid gap-x-8 gap-y-14 border-t-[1.5px] border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {shorts.map((w) => <ShortEntry key={w.slug} w={w} />)}
        </div>
      </section>

      <div aria-hidden className="mt-24 overflow-hidden border-y-[1.5px] border-ink py-3">
        <div className="marquee">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0 items-center gap-8 pr-8 text-sm font-bold uppercase tracking-[0.12em] text-ink-2">
              {tools.map((t) => (
                <span key={t} className="flex items-center gap-8">
                  {t}
                  <span className="text-stamp">+</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section id="experience" aria-labelledby="exp-title" data-rail="Experience" className="rise mt-24 scroll-mt-6 border-t-[1.5px] border-ink pt-5">
        <h2 id="exp-title" className="text-3xl font-extrabold tracking-[-0.02em] [font-stretch:108%]">Experience</h2>
        <Schedule jobs={resume.jobs} />
        <p className="mt-8">
          <span className="font-bold">{resume.education.school}</span>
          <span className="text-ink-2">, {resume.education.degree}, <span className="tabular-nums">{resume.education.year}</span></span>
        </p>
      </section>

      <Contact />
    </main>
  );
}
