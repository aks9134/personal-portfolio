import type { Metadata } from "next";
import { Top } from "@/components/lab/console/case-scan";
import { preview } from "@/lib/og";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";

const description =
  "Allen Sun is a mechanical design engineer at Curtiss-Wright in Pittsburgh, NYU Tandon ME 2025, with internships at Terrament, Relavo Medical and Ergami Endoscopy.";

export const metadata: Metadata = {
  title: "About",
  description,
  openGraph: preview("About | Allen Sun", description),
};

const caseStudy: Record<string, string> = { Terrament: "gravity-storage-drive", "Ergami Endoscopy": "tpu-weld-rig" };

export default function AboutPage() {
  return (
    <main id="main" className="lab-console lc-page">
      <div className="lcr-top">
        <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>
        <Top label="About" />
      </div>
      <div className="lc-pg">
        <p className="lc-dim">About</p>
        <h1>{site.name}</h1>
        <div className="lc-prose mt-8">
          <p>
            I&apos;m a mechanical design engineer at Curtiss-Wright in Pittsburgh, where I design and analyze canned induction motor assemblies for marine propulsion. I
            studied mechanical engineering at NYU Tandon and graduated in 2025. Two of the projects here, the vibration canceller and the weld
            rig, I took all the way from CAD through the mill to testing.
          </p>
          <p>
            Before Curtiss-Wright I interned at three startups in New York. I spent a year at Terrament on a gravity storage drive, a
            semester at Relavo Medical writing test protocols and designing fixtures for a dialysis device, and a semester at Ergami
            Endoscopy building the weld rig for a soft robotic colonoscope insert.
          </p>
          <p>
            Outside work I build things for less serious reasons. In high school it was a loveseat on a welded scrap frame with a go-kart
            engine, and lately it&apos;s been hand-tracked visuals in TouchDesigner.
          </p>
        </div>

        <section aria-labelledby="experience">
          <h2 id="experience" className="lcr-h">
            <span>01</span> Experience
          </h2>
          {resume.jobs.map((j) => (
            <article key={j.org} className="lcr-row">
              <p className="lc-dim lcr-when">{j.dates}</p>
              <div>
                <h3>{j.org}</h3>
                <p className="lcr-sub">
                  {j.title}, <span className="lcr-place">{j.place}</span>
                </p>
                {/* The resume's short version, or the longer About version where one exists. */}
                {(j.detail ?? [j.text]).map((d) => (
                  <p key={d.slice(0, 40)} className="lcr-text">
                    {d}
                  </p>
                ))}
                {caseStudy[j.org] && (
                  <a href={`/work/${caseStudy[j.org]}`} className="lcr-open">Open the file</a>
                )}
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className="lcr-h">
            <span>02</span> Skills and tools
          </h2>
          <dl className="lcr-skills">
            {resume.skills.map(([k, v]) => (
              <div key={k}>
                <dt className="lc-dim">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="education">
          <h2 id="education" className="lcr-h">
            <span>03</span> Education
          </h2>
          <div className="lcr-row">
            <p className="lc-dim lcr-when">{resume.education.year}</p>
            <div>
              <h3>{resume.education.school}</h3>
              <p className="lcr-sub">{resume.education.degree}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
