import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Line, type Callout, type Station } from "@/components/lab/line/line";
import { allWork } from "@/lib/work";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--ll-wide" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ll-mono" });

export const metadata = { title: "Lab A: The Line" };

export default async function LabA() {
  const all = await allWork();
  const by = (slug: string) => all.find((w) => w.slug === slug)!;
  const arm = by("robotic-arm");
  const can = by("micro-vibration-canceller");
  const drive = by("gravity-storage-drive");

  const stations: Station[] = [
    { code: "01", name: "Robot cell", project: arm.title, meta: `${arm.context}, ${arm.year}`, line: arm.line, facts: [`${arm.media["hand-model"].parts} parts`, "Wrist FEA: 1000 N, steel", arm.tools], href: `/work/${arm.slug}` },
    { code: "02", name: "Test stand", project: can.title, meta: `${can.context}, ${can.year}`, line: can.line, facts: [can.award ?? "", "54 Hz, open loop", "75 to 90% for 40 to 50 ms"], href: `/work/${can.slug}` },
    { code: "03", name: "Rack rig", project: drive.title, meta: `${drive.context}, ${drive.year}`, line: drive.line, facts: [`${drive.media["geared-module"].parts} parts`, "1/24 scale", `${drive.media["geared-module"].explode} mm apart`], href: `/work/${drive.slug}` },
    { code: "04", name: "Dispatch", project: "The next two generations", meta: "Terrament, 2024", line: "After the geared module: six pins in a slot, then a belt-driven linear harmonic drive on a cam-profiled rail.", facts: ["Gen 2: six-pin concept", "Gen 3: linear harmonic drive, July 2024"], href: `/work/${drive.slug}#third-the-linear-harmonic-drive` },
  ];
  const callouts: Callout[] = [
    { id: "hand-palm", label: "Hand and palm", value: "his half" },
    { id: "hand-wrist", label: "Wrist", value: "1000 N FEA" },
    { id: "rig-device", label: "Canceller shield", value: "early print" },
    { id: "rig-beam", label: "Fixed-fixed beam", value: "54 Hz" },
    { id: "rig-shaker", label: "Excitation motor" },
    { id: "drive-module", label: "Geared module", value: "248 parts" },
    { id: "dispatch-a", label: "Linear harmonic drive", value: "gen 3" },
    { id: "dispatch-b", label: "Six pins in a slot", value: "gen 2" },
  ];
  const shown = new Set([arm.slug, can.slug, drive.slug]);
  const more = all.filter((w) => !shown.has(w.slug)).map((w) => ({ title: w.title, meta: `${w.context}, ${w.year}`, href: `/work/${w.slug}` }));

  return (
    <div className={`${archivo.variable} ${plex.variable}`}>
      <Line
        models={{ hand: arm.media["hand-model"].src, shield: can.media["shield-print"].src, drive: drive.media["geared-module"].src, extras: [drive.media["harmonic-drive"].src, drive.media["pin-concept"].src] }}
        stations={stations}
        callouts={callouts}
        more={more}
      />
    </div>
  );
}
