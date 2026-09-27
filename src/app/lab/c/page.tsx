import { Saira, Sometype_Mono } from "next/font/google";
import { MediaImage } from "@/components/media-image";
import { Scope } from "@/components/scope";
import { ExplodeDimension, ExplodeScrub, ExplodeSlider, ExplodeValue } from "@/components/stage/explode-scrub";
import { HeroStage } from "@/components/stage/hero-stage";
import { parseOrbit } from "@/components/stage/engine";
import { site } from "@/lib/site";
import { allWork, getWork, still } from "@/lib/work";
import "../lab.css";

const saira = Saira({ subsets: ["latin"], variable: "--font-saira", axes: ["wdth"] });
const sometype = Sometype_Mono({ subsets: ["latin"], variable: "--font-sometype" });

export const metadata = { title: "Direction C: machined", robots: { index: false } };

export default async function C() {
  const all = await allWork();
  const arm = await getWork("robotic-arm");
  const drive = await getWork("gravity-storage-drive");
  const hand = arm.media["hand-model"];
  const geared = drive.media["geared-module"];
  const o = parseOrbit(hand.orbit);
  const g = parseOrbit(geared.orbit);
  const canceller = all.find((w) => w.slug === "micro-vibration-canceller")!;

  return (
    <div className={`lab vc ${saira.variable} ${sometype.variable}`}>
      <header className="flex items-center justify-between border-b border-(--rule) px-4 py-4 md:px-8">
        <a href="/lab/c" className="font-bold uppercase tracking-[0.04em]">Allen Sun</a>
        <nav aria-label="Main" className="flex gap-6 text-sm font-semibold uppercase">
          {["Work", "About", "Resume", "Email"].map((l) => (
            <a key={l} href="#" className="hover:text-(--accent)">{l}</a>
          ))}
        </nav>
      </header>

      <main id="main">
        <section className="grid gap-8 px-4 pt-10 pb-16 md:grid-cols-[1.25fr_1fr] md:px-8">
          <div className="flex flex-col justify-between">
            <div className="relative" style={{ ["--run" as string]: "100%" }}>
              <h1 className="display mill text-[clamp(4.5rem,13vw,12.5rem)]">Allen<br />Sun</h1>
              <span aria-hidden className="cutter absolute top-0 left-0 block h-full w-[0.9rem] bg-(--accent)" />
            </div>
            <div className="mt-10 grid gap-6 border-t-2 border-(--fg) pt-5 sm:grid-cols-[1.4fr_1fr]">
              <p className="text-xl leading-snug"><span className="font-bold">{site.role}.</span> I design parts, machine them, and put them on a test rig. Right now that&apos;s design work on large electric motors at Curtiss-Wright.</p>
              <dl className="readout grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 self-start">
                <dt className="text-(--muted)">School</dt><dd>NYU Tandon, B.S. ME 2025</dd>
                <dt className="text-(--muted)">Shop</dt><dd>Mill, lathe, welding</dd>
                <dt className="text-(--muted)">CAD</dt><dd>SolidWorks, Fusion 360, Solid Edge</dd>
              </dl>
            </div>
          </div>
          <div className="relative bg-(--bg-2)">
            <HeroStage m={hand} theta={o.theta} phi={o.phi} finish="graphite" className="aspect-[4/5] w-full" label="Robotic hand" />
            <p className="readout absolute bottom-3 left-3">Fig. 1 Robotic hand, {hand.parts} parts. Drag to turn</p>
          </div>
        </section>

        <ExplodeScrub
          m={geared}
          finish="graphite"
          swing={[g.theta, g.theta + 70]}
          tilt={[g.phi, g.phi - 10]}
          className="border-t-2 border-(--fg)"
          overlay={
            <div className="pointer-events-none absolute inset-x-4 top-8 md:inset-x-8">
              <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)]">Gravity storage drive</h2>
              <p className="readout mt-2">Fig. 2 Terrament geared module, <ExplodeValue kind="parts" /> parts, 1/24 scale</p>
              <div className="mt-8"><ExplodeDimension /></div>
            </div>
          }
        >
          <div className="absolute inset-x-4 bottom-6 max-w-md md:left-8"><ExplodeSlider /></div>
        </ExplodeScrub>

        <section className="grid gap-10 border-t-2 border-(--fg) px-4 py-16 md:grid-cols-[1fr_1.1fr] md:px-8">
          <div>
            <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)]">Vibration canceller</h2>
            <p className="mt-6 max-w-[46ch] text-xl leading-snug">{canceller.line}</p>
            <p className="mt-6 inline-block bg-(--accent) px-3 py-1.5 font-semibold text-(--on-accent)">{canceller.award}</p>
          </div>
          <div className="bg-(--fg) p-4 text-(--bg) [--muted:oklch(0.78_0.006_240)] [--rule:oklch(0.9_0.005_240/0.25)]">
            <Scope />
          </div>
        </section>

        <section className="border-t-2 border-(--fg) px-4 py-16 md:px-8">
          <h2 className="display text-[clamp(2.5rem,6vw,5.5rem)]">Work</h2>
          <ol className="mt-10 grid gap-px bg-(--rule) sm:grid-cols-2 lg:grid-cols-4">
            {all.map((w, i) => (
              <li key={w.slug} className="bg-(--bg)">
                <a href="#" className="group block p-5">
                  <div className="grid aspect-square place-items-center">
                    <MediaImage m={still(w.media[w.cover ?? w.hero])} sizes="25vw" imgClassName="max-h-56 w-auto mx-auto" />
                  </div>
                  <p className="readout mt-4 text-(--muted)">{String(i + 1).padStart(2, "0")} {w.year}</p>
                  <p className="mt-1 text-xl font-bold uppercase leading-tight group-hover:text-(--accent)">{w.title}</p>
                </a>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
