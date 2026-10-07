import type { Metadata } from "next";
import { Top } from "@/components/lab/console/case-scan";
import { preview } from "@/lib/og";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";

const description =
  "Allen Sun's resume: mechanical design engineer at Curtiss-Wright; internships at Ergami Endoscopy, Relavo Medical and Terrament; B.S. Mechanical Engineering, NYU Tandon.";

export const metadata: Metadata = {
  title: "Resume",
  description,
  openGraph: preview("Resume | Allen Sun", description),
};

// The resume in the console's language, from src/lib/resume.ts. Screen: the console. Print (and the PDF that
// scripts/resume-pdf.mjs makes from this page): one letter page, plain type on white (console.css).
export default function ConsoleResume() {
  const { jobs, projects, education, skills } = resume;
  return (
    <main id="main" className="lab-console lc-case lc-resume">
      <div className="lcr-top">
        <div className="lc-frame" aria-hidden><i /><i /><i /><i /></div>
        <Top label="Resume" />
      </div>

      <div className="lcr-wrap">
        <header className="lcr-head">
          <p className="lc-dim">Resume</p>
          <h1>{site.name}</h1>
          <p className="lcr-role">
            {site.role}, {resume.location}
          </p>
          <p className="lcr-links">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.linkedin}>linkedin.com/in/allen-sun-b06858233</a>
            <a href="/allen-sun-resume.pdf" download className="lcr-pdf">Download PDF</a>
          </p>
        </header>

        <section aria-labelledby="experience">
          <h2 id="experience" className="lcr-h">
            <span>01</span> Experience
          </h2>
          {jobs.map((j) => (
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
        </section>

        <section aria-labelledby="projects">
          <h2 id="projects" className="lcr-h">
            <span>02</span> Projects
          </h2>
          {projects.map((p) => (
            <article key={p.slug} className="lcr-row">
              <p className="lc-dim lcr-when lcr-ctx">{p.context}</p>
              <div>
                <h3>{p.name}</h3>
                <p className="lcr-text">{p.point}</p>
                <a href={`/work/${p.slug}`} className="lcr-open">Open the file</a>
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="education">
          <h2 id="education" className="lcr-h">
            <span>03</span> Education
          </h2>
          <div className="lcr-row">
            <p className="lc-dim lcr-when">{education.year}</p>
            <div>
              <h3>{education.school}</h3>
              <p className="lcr-sub">
                {education.degree}. GPA {education.gpa}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className="lcr-h">
            <span>04</span> Skills
          </h2>
          <dl className="lcr-skills">
            {skills.map(([k, v]) => (
              <div key={k}>
                <dt className="lc-dim">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
