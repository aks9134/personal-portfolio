import { Anybody, Mona_Sans } from "next/font/google";
import { MediaImage } from "@/components/media-image";
import { Scope } from "@/components/scope";
import { ExplodeBeat, ExplodeScrub, ExplodeSlider, ExplodeValue } from "@/components/stage/explode-scrub";
import { HeroStage } from "@/components/stage/hero-stage";
import { parseOrbit } from "@/components/stage/engine";
import { site } from "@/lib/site";
import { allWork, getWork, still } from "@/lib/work";
import "../lab.css";

const anybody = Anybody({ subsets: ["latin"], variable: "--font-anybody", axes: ["wdth"] });
const mona = Mona_Sans({ subsets: ["latin"], variable: "--font-mona", axes: ["wdth"] });

export const metadata = { title: "Direction B: launch", robots: { index: false } };

const beats = [
  "Generation 1: a geared module that climbs a rack on three wheels, with a cycloidal reduction in the middle one.",
  "I modeled the motor assembly, the gear drive and the bearings in Fusion 360, then built it at 1/24 scale.",
  "Terrament showed it at Newlab's New Climate Futures in September 2023.",
];

export default async function B() {
  const all = await allWork();
  const arm = await getWork("robotic-arm");
  const drive = await getWork("gravity-storage-drive");
  const hand = arm.media["hand-model"];
  const geared = drive.media["geared-module"];
  const o = parseOrbit(hand.orbit);
  const g = parseOrbit(geared.orbit);
  const canceller = all.find((w) => w.slug === "micro-vibration-canceller")!;

  return (
    <div className={`lab vb ${anybody.variable} ${mona.variable}`}>
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 md:px-8">
        <a href="/lab/b" className="font-semibold">Allen Sun</a>
        <nav aria-label="Main" className="flex gap-6 text-sm font-medium">
          {["Work", "About", "Resume", "Email"].map((l) => (
            <a key={l} href="#" className="text-(--muted) transition-colors duration-150 hover:text-(--fg)">{l}</a>
          ))}
        </nav>
      </header>

      <main id="main">
        <section className="relative grid min-h-dvh place-items-center overflow-hidden">
          <h1 className="display stretch-hero pointer-events-none absolute inset-x-0 top-[18dvh] text-center text-[clamp(4.5rem,19vw,20rem)] text-(--fg)">
            Allen Sun
          </h1>
          <HeroStage m={hand} theta={o.theta} phi={o.phi} finish="aluminium" className="relative z-10 mt-[12dvh] h-[70dvh] w-full max-w-[1100px]" label="Robotic hand" />
          <div className="absolute inset-x-4 bottom-8 z-10 flex flex-wrap items-end justify-between gap-4 md:inset-x-8">
            <p className="max-w-[30ch] text-xl leading-snug"><span className="font-semibold">{site.role}.</span> <span className="text-(--muted)">I design parts, machine them, and put them on a test rig.</span></p>
            <a href="#work" className="rounded-full bg-(--fg) px-5 py-3 text-sm font-semibold text-(--bg) transition-transform duration-150 active:scale-[0.97]">See the work</a>
          </div>
        </section>

        <section className="px-4 pt-32 text-center md:px-8">
          <p className="display stretch text-[clamp(3.5rem,11vw,10rem)]" style={{ ["--w" as string]: 120 }}>{geared.parts} parts.</p>
          <p className="mx-auto mt-6 max-w-[40ch] text-xl text-(--muted)">{drive.line}</p>
        </section>

        <ExplodeScrub
          m={geared}
          finish="graphite"
          swing={[g.theta, g.theta + 100]}
          tilt={[g.phi, g.phi - 15]}
          length={4}
          overlay={
            <>
              <div className="pointer-events-none absolute inset-x-4 bottom-28 mx-auto max-w-xl text-center md:inset-x-8">
                {beats.map((b, i) => (
                  <ExplodeBeat key={b} from={i / beats.length} to={(i + 1) / beats.length} className="absolute inset-x-0 bottom-0">
                    <p className="text-2xl leading-snug">{b}</p>
                  </ExplodeBeat>
                ))}
              </div>
              <p className="readout pointer-events-none absolute top-20 right-4 text-right md:right-8">
                <span className="block text-(--muted)">Farthest part travel</span>
                <span className="display stretch block text-5xl text-(--accent)" style={{ ["--w" as string]: 70 }}><ExplodeValue kind="mm" /> mm</span>
              </p>
            </>
          }
        >
          <div className="absolute inset-x-4 bottom-8 mx-auto max-w-md"><ExplodeSlider /></div>
        </ExplodeScrub>

        <section className="grid items-center gap-12 px-4 py-32 md:grid-cols-2 md:px-8">
          <div>
            <p className="display stretch text-[clamp(4rem,12vw,11rem)]" style={{ ["--w" as string]: 130 }}>75 to 90%</p>
            <p className="mt-4 max-w-[36ch] text-2xl leading-snug">less beam vibration, for 40 to 50 ms at a time, from a bolt-on canceller our team of four built.</p>
            <p className="mt-6 text-(--accent)">{canceller.award}</p>
          </div>
          <Scope />
        </section>

        <section id="work" className="px-4 pb-32 md:px-8">
          <h2 className="display stretch text-[clamp(3rem,8vw,7rem)]" style={{ ["--w" as string]: 140 }}>Work</h2>
          <ul className="mt-12 grid gap-x-8 gap-y-16 md:grid-cols-2">
            {all.map((w, i) => (
              <li key={w.slug} className={i === 0 ? "md:col-span-2" : ""}>
                <a href="#" className="group block">
                  <div className="grid aspect-[16/10] place-items-center bg-(--bg-2) p-8">
                    <MediaImage m={still(w.media[w.cover ?? w.hero])} sizes="50vw" imgClassName="max-h-[70%] w-auto mx-auto" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold group-hover:text-(--accent)">{w.title}</p>
                  <p className="text-(--muted)">{w.context}, {w.year}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
