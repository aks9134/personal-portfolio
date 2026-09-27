import { Azeret_Mono, Big_Shoulders } from "next/font/google";
import { Scope } from "@/components/scope";
import { Scramble } from "@/components/scramble";
import { ExplodeScrub, ExplodeSlider, ExplodeValue } from "@/components/stage/explode-scrub";
import { HeroStage } from "@/components/stage/hero-stage";
import { parseOrbit } from "@/components/stage/engine";
import { resume } from "@/lib/resume";
import { site } from "@/lib/site";
import { allWork, getWork } from "@/lib/work";
import "../lab.css";

const shoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-shoulders", axes: ["opsz"] });
const azeret = Azeret_Mono({ subsets: ["latin"], variable: "--font-azeret" });

export const metadata = { title: "Direction A: test cell", robots: { index: false } };

export default async function A() {
  const all = await allWork();
  const arm = await getWork("robotic-arm");
  const drive = await getWork("gravity-storage-drive");
  const hand = arm.media["hand-model"];
  const geared = drive.media["geared-module"];
  const o = parseOrbit(hand.orbit);
  const g = parseOrbit(geared.orbit);

  return (
    <div className={`lab va ${shoulders.variable} ${azeret.variable}`}>
      <header className="flex items-center justify-between gap-6 px-4 py-5 md:px-8">
        <a href="/lab/a" className="readout">Allen Sun</a>
        <nav aria-label="Main" className="flex gap-5 readout">
          {["Work", "About", "Resume", "Email"].map((l) => (
            <a key={l} href="#" className="hover:text-(--accent)"><Scramble text={l} /></a>
          ))}
        </nav>
      </header>

      <main id="main">
        <section className="bay relative grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 items-end gap-6 px-4 pb-8 md:grid-cols-[1.1fr_1fr] md:px-8">
          <div className="relative z-10 pb-4">
            <h1 className="display text-[clamp(5rem,17vw,15rem)]">Allen<br />Sun</h1>
            <p className="mt-6 max-w-[34ch] text-lg leading-snug text-(--muted)">
              <span className="text-(--fg)">{site.role}.</span> I design parts, machine them, and put them on a test rig.
            </p>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-(--rule) pt-4 readout">
              <div><dt className="text-(--muted)">Now</dt><dd className="val mt-1">Curtiss-Wright</dd></div>
              <div><dt className="text-(--muted)">School</dt><dd className="val mt-1">NYU ME {resume.education.year}</dd></div>
              <div><dt className="text-(--muted)">Projects</dt><dd className="val mt-1">{all.length}</dd></div>
            </dl>
          </div>
          <HeroStage m={hand} theta={o.theta} phi={o.phi} finish="graphite" className="aspect-square w-full md:aspect-auto md:h-[78dvh]" label="Robotic hand" />
          <p className="readout absolute right-4 bottom-4 text-(--muted) md:right-8">Robotic hand, {hand.parts} parts. Drag it</p>
        </section>

        <section className="grid gap-10 border-t border-(--rule) px-4 py-20 md:grid-cols-[1fr_1.2fr] md:px-8">
          <div>
            <p className="readout text-(--accent)">Best Senior Design Project, NYU ME 2025</p>
            <h2 className="display mt-4 text-[clamp(3rem,8vw,7rem)]">Micro-vibration canceller</h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-snug">{all.find((w) => w.slug === "micro-vibration-canceller")?.line}</p>
          </div>
          <Scope />
        </section>

        <ExplodeScrub
          m={geared}
          finish="cad"
          swing={[g.theta, g.theta + 80]}
          tilt={[g.phi, g.phi - 12]}
          className="border-t border-(--rule)"
          stageClassName="bay"
          overlay={
            <div className="pointer-events-none absolute inset-x-4 top-6 flex items-start justify-between md:inset-x-8">
              <div>
                <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)]">Gravity<br />storage drive</h2>
                <p className="readout mt-3 text-(--muted)">Terrament, 1/24-scale geared module</p>
              </div>
              <dl className="readout grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right">
                <dt className="text-(--muted)">Parts</dt><dd className="val"><ExplodeValue kind="parts" /></dd>
                <dt className="text-(--muted)">Travel</dt><dd className="val"><ExplodeValue kind="mm" pad={3} /> mm</dd>
                <dt className="text-(--muted)">Apart</dt><dd className="val"><ExplodeValue kind="pct" pad={3} /> %</dd>
              </dl>
            </div>
          }
        >
          <div className="absolute inset-x-4 bottom-6 max-w-md md:left-8"><ExplodeSlider /></div>
        </ExplodeScrub>

        <section className="border-t border-(--rule) px-4 py-20 md:px-8">
          <h2 className="display text-[clamp(3rem,8vw,7rem)]">Work</h2>
          <ol className="mt-10">
            {all.map((w) => (
              <li key={w.slug} className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-(--rule) py-4 md:grid-cols-[3fr_2fr_1fr_auto]">
                <a href="#" className="display text-3xl hover:text-(--accent) md:text-4xl"><Scramble text={w.title} /></a>
                <span className="readout hidden text-(--muted) md:block">{w.context}</span>
                <span className="readout hidden text-(--muted) md:block">{w.status}</span>
                <span className="readout val">{w.year}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
