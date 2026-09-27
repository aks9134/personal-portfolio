import { MediaImage } from "@/components/media-image";
import { Scope } from "@/components/scope";
import { Shelf } from "@/components/shelf";
import { ExplodeBeat, ExplodeScrub, ExplodeSlider, ExplodeValue } from "@/components/stage/explode-scrub";
import { HeroStage } from "@/components/stage/hero-stage";
import { WorkIndex } from "@/components/work-index";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";
import { allWork, still, type Work } from "@/lib/work";

// Structured data for search engines: who this page is about ("<" escaped against injection).
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

// The geared module's story while it comes apart, in the case study's own words.
const beats = [
  "Generation 1: a module that climbs a rack on three geared wheels, with motors in the outer two and a cycloidal reduction in the middle.",
  "I modeled the motor assembly, the gear drive and the bearings in Fusion 360, then built it at 1/24 scale from printed gears and off-the-shelf bearings.",
  "It was built for Newlab's New Climate Futures in September 2023, then replaced by a linear harmonic drive.",
];

const by = (all: Work[], slug: string) => all.find((w) => w.slug === slug)!;

export default async function Home() {
  const all = await allWork();
  const arm = by(all, "robotic-arm");
  const drive = by(all, "gravity-storage-drive");
  const canceller = by(all, "micro-vibration-canceller");
  const hand = arm.media["hand-model"];
  const geared = drive.media["geared-module"];
  const models = all.flatMap((w) => Object.values(w.media).filter((m) => m.src.endsWith(".glb"))).length;
  const cases = all.filter((w) => w.format === "case");
  const shorts = all.filter((w) => w.format === "short");
  const job = resume.jobs[0];

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />

      <section aria-labelledby="name" className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-8 pb-16 md:min-h-[calc(100svh-3.5rem)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-end md:px-8">
        <div className="md:pb-6">
          <h1 id="name" className="display text-[clamp(5.5rem,17vw,15.5rem)]">
            Allen<br />Sun
          </h1>
          <p className="mt-6 max-w-[38ch] text-xl leading-snug text-muted">
            <strong className="font-semibold text-fg">{site.role}.</strong> {site.line}
          </p>
          <dl className="readout mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-muted">Now</dt>
              <dd className="val mt-1">{job.org.split(",")[0]}</dd>
            </div>
            <div>
              <dt className="text-muted">School</dt>
              <dd className="val mt-1">NYU ME {resume.education.year}</dd>
            </div>
            <div>
              <dt className="text-muted">Projects</dt>
              <dd className="val mt-1">{all.length}</dd>
            </div>
            <div>
              <dt className="text-muted">Live models</dt>
              <dd className="val mt-1">{models}</dd>
            </div>
          </dl>
        </div>
        <HeroStage m={hand} frame={0.92} className="aspect-square w-full md:aspect-auto md:h-[min(78svh,54rem)]" label={`Robotic hand, ${hand.parts} parts`} />
      </section>

      <section aria-labelledby="canceller" className="border-t border-rule">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-24 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
          <div>
            <h2 id="canceller" className="display text-[clamp(3.25rem,8vw,7.5rem)]">
              Micro-vibration canceller
            </h2>
            <p className="readout val mt-5">{canceller.award}</p>
            <p className="mt-6 max-w-[48ch] text-xl leading-snug">{canceller.line}</p>
            <p className="mt-8">
              <a href={`/work/${canceller.slug}`} className="link text-lg">Read the case study</a>
            </p>
          </div>
          <Scope />
        </div>
      </section>

      <ExplodeScrub
        id="terrament"
        m={geared}
        finish="anodized"
        className="border-t border-rule"
        overlay={
          <div className="pointer-events-none absolute inset-x-4 top-6 flex flex-wrap items-start justify-between gap-6 md:inset-x-8">
            <div>
              <h2 className="display text-[clamp(2.75rem,6.5vw,6rem)]">
                Gravity<br />storage drive
              </h2>
              <p className="readout mt-3 text-muted">{drive.context}, geared module, 1/24 scale</p>
            </div>
            <dl className="readout grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right">
              <dt className="text-muted">Parts</dt>
              <dd className="val"><ExplodeValue kind="parts" /></dd>
              <dt className="text-muted">Travel</dt>
              <dd className="val"><ExplodeValue kind="mm" pad={3} /> mm</dd>
              <dt className="text-muted">Apart</dt>
              <dd className="val"><ExplodeValue kind="pct" pad={3} /> %</dd>
            </dl>
          </div>
        }
      >
        <div className="absolute inset-x-4 bottom-20 max-w-xl md:left-8">
          <div className="relative min-h-[5.5rem]">
            {beats.map((b, i) => (
              <ExplodeBeat key={b} from={i / beats.length} to={(i + 1) / beats.length} className="absolute inset-x-0 bottom-0">
                <p className="text-lg leading-snug">{b}</p>
              </ExplodeBeat>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-4 bottom-6 flex max-w-xl items-center gap-6 md:left-8">
          <ExplodeSlider className="explode-control flex-1" />
          <a href={`/work/${drive.slug}`} className="link whitespace-nowrap">Case study</a>
        </div>
      </ExplodeScrub>

      <section aria-labelledby="models" className="border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-4 py-24 md:px-8">
          <h2 id="models" className="display text-[clamp(3rem,7vw,6.5rem)]">More models</h2>
          <p className="mt-4 max-w-[52ch] text-lg text-muted">
            The next two generations of the Terrament drive, and a part printed for the canceller. Drag any of them, or draw them as edges.
          </p>
          <div className="mt-10">
            <Shelf
              items={[
                { m: drive.media["pin-concept"], name: "Six pins in a slot", note: "Terrament, generation 2: the first linear harmonic concept.", href: `/work/${drive.slug}#second-six-pins-in-a-slot` },
                { m: drive.media["harmonic-drive"], name: "Linear harmonic drive", note: "Terrament, generation 3: a belt-driven roller module on a cam-profiled rail, July 2024.", href: `/work/${drive.slug}#third-the-linear-harmonic-drive` },
                { m: canceller.media["shield-print"], name: "Canceller shield", note: "An early open-frame shield printed for the canceller, before the cage and centering spring.", href: `/work/${canceller.slug}` },
              ]}
            />
          </div>
        </div>
      </section>

      <section id="work" aria-labelledby="work-title" className="scroll-mt-14 border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-4 py-24 md:px-8">
          <h2 id="work-title" className="display text-[clamp(3rem,7vw,6.5rem)]">Work</h2>
          <div className="mt-10">
            <WorkIndex
              rows={cases.map((w) => ({ slug: w.slug, title: w.title, context: w.context, year: w.year, status: w.status, line: w.line, still: still(w.media[w.cover ?? w.hero]) }))}
            />
          </div>
          <ul className="mt-16 grid gap-x-6 gap-y-12 border-t border-rule pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {shorts.map((w) => (
              <li key={w.slug}>
                <a href={`/work/${w.slug}`} className="group block">
                  <div className="grid aspect-[4/3] place-items-center bg-bg-2 p-4">
                    <MediaImage m={still(w.media[w.hero])} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw" imgClassName="mx-auto max-h-full w-auto object-contain" />
                  </div>
                  <p className="readout mt-3 text-muted">{w.context}, {w.year}</p>
                  <p className="mt-1 text-lg font-semibold leading-snug transition-colors duration-150 group-hover:text-accent" style={{ viewTransitionName: `t-${w.slug}` }}>
                    {w.title}
                  </p>
                  <p className="mt-1 text-muted">{w.line}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="experience" aria-labelledby="exp-title" className="scroll-mt-14 border-t border-rule">
        <div className="mx-auto max-w-[1600px] px-4 py-24 md:px-8">
          <h2 id="exp-title" className="display text-[clamp(3rem,7vw,6.5rem)]">Experience</h2>
          <ol className="mt-10">
            {resume.jobs.map((j) => (
              <li key={j.org} className="grid gap-x-10 gap-y-2 border-t border-rule py-8 md:grid-cols-[14rem_minmax(0,22rem)_minmax(0,1fr)]">
                <p className="readout text-muted">{j.dates}</p>
                <div>
                  <h3 className="text-xl font-semibold leading-snug">{j.org}</h3>
                  <p className="text-muted">{j.title}, {j.place}</p>
                </div>
                <p className="max-w-[68ch] leading-relaxed">{j.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-rule pt-6">
            <span className="font-semibold">{resume.education.school}</span>
            <span className="text-muted">, {resume.education.degree}, {resume.education.year}</span>
          </p>
          <p className="mt-6">
            <a href="/about" className="link">More about me</a>, or the <a href="/resume" className="link">resume</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
