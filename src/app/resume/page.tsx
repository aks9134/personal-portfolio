import type { Metadata } from "next";
import { preview } from "@/lib/og";
import Link from "next/link";
import { SiteHeader } from "@/components/site-nav";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";

const description =
  "Allen Sun's resume: mechanical design engineer at Curtiss-Wright; internships at Ergami Endoscopy, Relavo Medical and Terrament; B.S. Mechanical Engineering, NYU Tandon.";

export const metadata: Metadata = {
  title: "Resume",
  description,
  openGraph: preview("Resume | Allen Sun", description),
};

const h2 = "mt-9 border-t-[1.5px] border-ink pt-3 text-xl font-extrabold tracking-[-0.01em] [font-stretch:108%] print:mt-3 print:pt-1 print:text-[12pt]";

// Screen: the site's sheet. Print (and the PDF made from it by scripts/resume-pdf.mjs): one letter page, white paper.
export default function ResumePage() {
  const { jobs, projects, education, skills } = resume;
  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main id="main" className="resume mx-auto max-w-[920px] px-4 md:px-10 print:max-w-none print:px-0 print:text-[9.5pt] print:leading-snug">
        <header className="mt-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t-[1.5px] border-ink pt-6 print:mt-0 print:border-0 print:pt-0">
          <div>
            <h1 className="text-5xl font-extrabold leading-none tracking-[-0.03em] [font-stretch:110%] print:text-[22pt]">{site.name}</h1>
            <p className="mt-2 text-lg text-ink-2 print:mt-1 print:text-[10.5pt]">
              {site.role}, {resume.location}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm sm:items-end print:text-[9.5pt]">
            <a href={`mailto:${site.email}`} className="underline hover:text-stamp">{site.email}</a>
            <a href={site.linkedin} className="underline hover:text-stamp">linkedin.com/in/allen-sun-b06858233</a>
          </div>
        </header>

        <p className="mt-6 print:hidden">
          <a href="/allen-sun-resume.pdf" download className="inline-block border-[1.5px] border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-stock">
            Download PDF
          </a>
        </p>

        <section aria-labelledby="experience">
          <h2 id="experience" className={h2}>Experience</h2>
          {jobs.map((j) => (
            <article key={j.org} className="mt-5 break-inside-avoid print:mt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="font-bold">{j.org}</h3>
                <p className="whitespace-nowrap text-sm tabular-nums text-ink-2 print:text-[9pt]">{j.dates}</p>
              </div>
              <p className="text-ink-2">{j.title}, {j.place}</p>
              {"text" in j && j.text && <p className="mt-1.5 max-w-[75ch] print:max-w-none">{j.text}</p>}
              {"points" in j && j.points && (
                <ul className="mt-1.5 list-disc space-y-1 pl-5 print:space-y-0.5">
                  {j.points.map((pt) => <li key={pt} className="max-w-[75ch] print:max-w-none">{pt}</li>)}
                </ul>
              )}
            </article>
          ))}
        </section>

        <section aria-labelledby="projects">
          <h2 id="projects" className={h2}>Projects</h2>
          {projects.map((p) => (
            <article key={p.slug} className="mt-5 break-inside-avoid print:mt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-sm text-ink-2 print:text-[9pt]">{p.context}</p>
              </div>
              <p className="mt-1 max-w-[75ch] print:max-w-none">
                {p.point}{" "}
                <Link href={`/work/${p.slug}`} className="whitespace-nowrap underline hover:text-stamp print:hidden">Case study</Link>
              </p>
            </article>
          ))}
        </section>

        <section aria-labelledby="education">
          <h2 id="education" className={h2}>Education</h2>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 print:mt-1.5">
            <p><span className="font-bold">{education.school}</span>, {education.degree}. GPA {education.gpa}</p>
            <p className="text-sm tabular-nums text-ink-2 print:text-[9pt]">{education.year}</p>
          </div>
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className={h2}>Skills</h2>
          <dl className="mt-3 grid gap-y-1.5 sm:grid-cols-[10rem_1fr] print:mt-1.5 print:grid-cols-[8.5rem_1fr] print:gap-y-0.5">
            {skills.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-bold">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
