import { Console, type IndexEntry, type Target } from "@/components/lab/console/console";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";
import { allWork, type Work } from "@/lib/work";

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

const by = (all: Work[], slug: string) => all.find((w) => w.slug === slug)!;

// The home page: the console scans four machines (point clouds re-form from one into the next, a scan resolves each
// to solid, assemblies come apart), then the Index of every project and the resume's experience.
export default async function Home() {
  const all = await allWork();
  const arm = by(all, "robotic-arm");
  const drive = by(all, "gravity-storage-drive");
  const can = by(all, "micro-vibration-canceller");

  const targets: Target[] = [
    { code: "01", name: "Robotic hand", klass: `${arm.context}, ${arm.year}`, status: arm.status, line: arm.line, facts: ["Wrist FEA: 1000 N, steel", arm.tools], href: `/work/${arm.slug}`, model: { src: arm.media["hand-model"].src, finish: "aluminium", parts: arm.media["hand-model"].parts ?? 0 } },
    { code: "02", name: "Geared module", klass: `${drive.context}, ${drive.year}`, status: drive.status, line: drive.line, facts: ["Generation 1, 1/24 scale", `${drive.media["geared-module"].explode} mm apart at full explode`], href: `/work/${drive.slug}`, model: { src: drive.media["geared-module"].src, finish: "anodized", parts: drive.media["geared-module"].parts ?? 0, weight: 1.6 }, apartMm: drive.media["geared-module"].explode },
    { code: "03", name: "Micro-vibration canceller", klass: `${can.context}, ${can.year}`, status: can.status, line: can.line, facts: [can.award ?? "", "54 Hz, open loop: 75 to 90% for 40 to 50 ms"], href: `/work/${can.slug}`, model: { build: "canceller", finish: "own", parts: 14, weight: 1.6 } },
    { code: "04", name: "Linear harmonic drive", klass: "Terrament, July 2024", status: "Modeled and printed", line: "Generation 3: a belt-driven roller module on a cam-profiled rail, the redesign after the geared module.", facts: ["Generation 3", "Printed prototype"], href: `/work/${drive.slug}#third-the-linear-harmonic-drive`, model: { src: drive.media["harmonic-drive"].src, finish: "anodized", parts: drive.media["harmonic-drive"].parts ?? 0 } },
  ];
  // Every project, in the site's order; the ones on the console carry their target number.
  const featured: Record<string, string> = { [arm.slug]: "01", [drive.slug]: "02", [can.slug]: "03" };
  const index: IndexEntry[] = all.map((w) => ({ title: w.title, meta: `${w.context}, ${w.year}`, href: `/work/${w.slug}`, target: featured[w.slug] }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      <Console targets={targets} index={index}>
        <section id="experience" className="lc-exp" aria-labelledby="exp-title">
          <h2 id="exp-title" className="lc-dim">Experience</h2>
          {resume.jobs.map((j) => (
            <article key={j.org} className="lcr-row">
              <p className="lc-dim lcr-when">{j.dates}</p>
              <div>
                <h3>{j.org}</h3>
                <p className="lcr-sub">
                  {j.title}, <span className="lcr-place">{j.place}</span>
                </p>
                <p className="lcr-text">{j.text}</p>
              </div>
            </article>
          ))}
          <div className="lcr-row">
            <p className="lc-dim lcr-when">{resume.education.year}</p>
            <div>
              <h3>{resume.education.school}</h3>
              <p className="lcr-sub">{resume.education.degree}</p>
            </div>
          </div>
          <p className="lc-exp-more">
            <a href="/about">More about me</a>
            <a href="/resume">The resume</a>
          </p>
        </section>
      </Console>
    </>
  );
}
