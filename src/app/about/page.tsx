import type { Metadata } from "next";
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

const h2 = "display mt-20 border-t border-rule-strong pt-6 text-[clamp(2.5rem,5vw,4.25rem)]";
const caseStudy: Record<string, string> = { Terrament: "gravity-storage-drive", "Ergami Endoscopy": "tpu-weld-rig" };

export default function AboutPage() {
  return (
    <>
      <main id="main" className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="pt-12 md:pt-16">
          <h1 className="display text-[clamp(4rem,11vw,9.5rem)]">About</h1>
          <div className="mt-8 max-w-[62ch] space-y-5 text-xl leading-snug">
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
        </div>

        <section aria-labelledby="experience">
          <h2 id="experience" className={h2}>Experience</h2>
          <div className="mt-2">
            {resume.jobs.map((j) => (
              <article key={j.org} className="grid gap-x-10 gap-y-2 border-b border-rule py-6 md:grid-cols-[18rem_1fr]">
                <div>
                  <h3 className="font-bold">{j.org}</h3>
                  <p className="text-muted">{j.title}</p>
                  <p className="text-sm text-muted"><span className="whitespace-nowrap tabular-nums">{j.dates}</span>, {j.place}</p>
                </div>
                <div className="max-w-[65ch] space-y-3 leading-snug">
                  {/* The resume's short version, or the longer About version where one exists. */}
                  {(j.detail ?? [j.text]).map((d) => <p key={d.slice(0, 40)}>{d}</p>)}
                  {caseStudy[j.org] && (
                    <p className="mt-3">
                      <a href={`/work/${caseStudy[j.org]}`} className="link font-semibold">Read the case study</a>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className={h2}>Skills and tools</h2>
          <dl className="mt-6 grid max-w-[900px] gap-y-3 sm:grid-cols-[12rem_1fr]">
            {resume.skills.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-bold">{k}</dt>
                <dd className="leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="education">
          <h2 id="education" className={h2}>Education</h2>
          <p className="mt-6">
            <span className="font-bold">{resume.education.school}</span>, {resume.education.degree}, <span className="tabular-nums">{resume.education.year}</span>
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact" className={h2}>Contact</h2>
          <p className="mt-6 text-xl">
            Email <a href={`mailto:${site.email}`} className="link font-semibold">{site.email}</a>, find me on{" "}
            <a href={site.linkedin} className="link font-semibold">LinkedIn</a>, or see the{" "}
            <a href="/resume" className="link font-semibold">resume</a>.
          </p>
        </section>
      </main>
    </>
  );
}
