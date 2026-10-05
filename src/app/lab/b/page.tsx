import { Martian_Mono } from "next/font/google";
import { Console, type Target } from "@/components/lab/console/console";
import { allWork } from "@/lib/work";

const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--lc-mono" });

export const metadata = { title: "Lab B: Console" };

export default async function LabB() {
  const all = await allWork();
  const by = (slug: string) => all.find((w) => w.slug === slug)!;
  const arm = by("robotic-arm");
  const drive = by("gravity-storage-drive");
  const can = by("micro-vibration-canceller");

  const targets: Target[] = [
    { code: "01", name: "Robotic hand", klass: `${arm.context}, ${arm.year}`, status: arm.status, line: arm.line, facts: ["Wrist FEA: 1000 N, steel", arm.tools], href: `/work/${arm.slug}`, model: { src: arm.media["hand-model"].src, finish: "aluminium", parts: arm.media["hand-model"].parts ?? 0 } },
    { code: "02", name: "Geared module", klass: `${drive.context}, ${drive.year}`, status: drive.status, line: drive.line, facts: ["Generation 1, 1/24 scale", `${drive.media["geared-module"].explode} mm apart at full explode`], href: `/work/${drive.slug}`, model: { src: drive.media["geared-module"].src, finish: "anodized", parts: drive.media["geared-module"].parts ?? 0, weight: 2.6 } },
    { code: "03", name: "Linear harmonic drive", klass: "Terrament, July 2024", status: "Modeled and printed", line: "Generation 3: a belt-driven roller module on a cam-profiled rail, the redesign after the geared module.", facts: ["Generation 3", "Printed prototype"], href: `/work/${drive.slug}#third-the-linear-harmonic-drive`, model: { src: drive.media["harmonic-drive"].src, finish: "anodized", parts: drive.media["harmonic-drive"].parts ?? 0 } },
    { code: "04", name: "Micro-vibration canceller", klass: `${can.context}, ${can.year}`, status: can.status, line: can.line, facts: [can.award ?? "", "54 Hz, open loop: 75 to 90% for 40 to 50 ms", "Model rebuilt from the renders and photos; sizes estimated"], href: `/work/${can.slug}`, model: { build: "canceller", finish: "own", parts: 14, weight: 2.6 } },
  ];
  const shown = new Set([arm.slug, drive.slug, can.slug]);
  const more = all.filter((w) => !shown.has(w.slug)).map((w) => ({ title: w.title, meta: `${w.context}, ${w.year}`, href: `/work/${w.slug}` }));

  return (
    <div className={martian.variable}>
      <Console targets={targets} more={more} />
    </div>
  );
}
