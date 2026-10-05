import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Teardown, type Chapter } from "@/components/lab/teardown/teardown";
import { allWork, type Media } from "@/lib/work";

const inter = Inter_Tight({ subsets: ["latin"], variable: "--lt-sans" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--lt-mono" });

export const metadata = { title: "Lab C: Teardown" };

const photo = (m: Media) => ({ src: m.src, alt: m.alt ?? "", w: m.width, h: m.height });

export default async function LabC() {
  const all = await allWork();
  const by = (slug: string) => all.find((w) => w.slug === slug)!;
  const drive = by("gravity-storage-drive");
  const arm = by("robotic-arm");
  const can = by("micro-vibration-canceller");

  const chapters: Chapter[] = [
    {
      code: "01",
      name: "Gravity storage drive",
      meta: `${drive.context}, ${drive.year}`,
      seq: "/lab/teardown/drive",
      statement: [`${drive.media["geared-module"].parts} parts.`, "One drive, taken apart."],
      spec: `geared module, generation 1, for mine-shaft gravity storage. 1/24 scale. climbs a rack on three geared wheels, motors in the outer two, a cycloidal reduction in the middle. ${drive.media["geared-module"].parts} parts. farthest part travels ${drive.media["geared-module"].explode} mm when taken apart. motor assembly, gear drive and bearings modeled in fusion 360. printed gears, off-the-shelf bearings. built for newlab's new climate futures, september 2023. my part: cad, load and gear-ratio calculations, fea, printed prototypes, motor wiring, arduino code.`,
      photos: [photo(drive.media["prototype-photo"])],
      href: `/work/${drive.slug}`,
    },
    {
      code: "02",
      name: "Robotic arm",
      meta: `${arm.context}, ${arm.year}`,
      seq: "/lab/teardown/hand",
      statement: ["My half of the arm.", "Hand, palm, wrist, forearm."],
      spec: `human-scale arm, a two-person course project. my half: hand, palm, wrist and forearm, and the drawings for my parts. ${arm.media["hand-model"].parts} parts in the hand model. wrist held 1000 n in fea, modeled in steel. rendered in carbon fiber. fusion 360, solidworks, solidworks simulation. fall 2024.`,
      photos: [photo(arm.media["forearm-final"])],
      href: `/work/${arm.slug}`,
    },
    {
      code: "03",
      name: "Micro-vibration canceller",
      meta: `${can.context}, ${can.year}`,
      statement: ["75 to 90% less vibration,", "for 40 to 50 ms at a time."],
      spec: `bolt-on device that fights beam vibration with a voice coil motor. thorlabs vc250, 25.4 mm travel, 15 n peak force. piezo sensor glued under the motor axis. 6061 mount plate, machined. open-loop test at 54 hz. every part machined by me, the shield printed in pla. ${(can.award ?? "").toLowerCase()}.`,
      photos: [photo(can.media["final-photo"]), photo(can.media["rig-photo"])],
      href: `/work/${can.slug}`,
    },
    {
      code: "04",
      name: "Linear harmonic drive",
      meta: "Terrament, July 2024",
      seq: "/lab/teardown/harmonic",
      statement: ["Generation three.", "Rollers on a cam rail."],
      spec: `the redesign after the geared module: a belt-driven roller module on a cam-profiled rail. ${drive.media["harmonic-drive"].parts} parts. modeled and printed. july 2024.`,
      photos: [],
      href: `/work/${drive.slug}#third-the-linear-harmonic-drive`,
    },
  ];
  const shown = new Set([drive.slug, arm.slug, can.slug]);
  const more = all.filter((w) => !shown.has(w.slug)).map((w) => ({ title: w.title, meta: `${w.context}, ${w.year}`, href: `/work/${w.slug}` }));

  return (
    <div className={`${inter.variable} ${jet.variable}`}>
      <Teardown chapters={chapters} more={more} />
    </div>
  );
}
