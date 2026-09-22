// The public resume: /resume renders it and scripts/resume-pdf.mjs prints that page, so the two can't drift.
// Public-safe by rule: no phone number, and the QA role is left out. The Curtiss-Wright text comes from Allen's
// resume and his knowledge log, which he cleared for sharing on 2026-09-22 (DECISIONS-LOG), plus his confirmation
// that every resume bullet was work carried through to completion (see site.ts). Every entry is written in full sentences.
import { site } from "./site";

// `text` is the resume entry (and the About entry); `detail`, where present, replaces it on the About page.
export type Job = { org: string; title: string; place: string; dates: string; text: string; detail?: readonly string[] };

export const resume = {
  location: "Pittsburgh, PA",
  jobs: [
    {
      org: "Curtiss-Wright, Electro-Mechanical Division",
      // The company line carries his full tenure; the QA role he held until Mar 2026 stays off the site (his call).
      title: "Mechanical Design Engineer since Mar 2026",
      place: "Pittsburgh, PA",
      dates: "Jun 2025 - present",
      text: site.cwText,
      detail: site.cwDetail,
    },
    {
      org: "Ergami Endoscopy",
      title: "R&D / Robotics Engineering Intern",
      place: "New York, NY",
      dates: "Jan - May 2025",
      text: "I designed and built the weld rig behind the TPU tube process for a soft robotic colonoscope insert, using machined aluminum on press-fit brass rods with 3D-printed parts to get consistent heat welds. I also worked on the insert's locomotion concept, from anchor design and actuator selection to motion testing.",
    },
    {
      org: "Relavo Medical",
      title: "Mechanical Engineering Intern",
      place: "New York, NY",
      dates: "Sep - Dec 2024",
      text: "I worked on a device that disinfects peritoneal dialysis tube connections. I reviewed its design control traceability matrix, wrote verification and validation test protocols, and designed SolidWorks test fixtures for its torque and robustness tests. I also made the GD&T drawings for its injection-molded parts.",
    },
    {
      org: "Terrament",
      title: "Mechanical Engineering Intern",
      place: "New York, NY",
      dates: "Sep 2023 - Sep 2024",
      text: "I built and wired the 1/24-scale geared drive prototype that Terrament showed at Newlab's New Climate Futures in September 2023. I also ran load calculations, gear-ratio analyses and structural feasibility studies in Fusion 360 for the gravity storage system and its linear harmonic drive redesign. Along the way I printed prototypes around off-the-shelf industrial parts and used FEA to check stress, fatigue life and material choices.",
    },
  ] satisfies Job[],
  projects: [
    {
      name: "Micro-vibration canceller",
      slug: "micro-vibration-canceller",
      context: "Senior design, NYU, Sep 2024 - May 2025",
      point: "Our team of four built a bolt-on vibration canceller around a voice coil motor and a piezo sensor, and I machined every part of it along with the test rig. Open-loop tests at 54 Hz cut beam vibration 75 to 90% for 40 to 50 ms at a time, and the faculty voted it Best Senior Design Project for the NYU ME class of 2025.",
    },
    {
      name: "Robotic arm",
      slug: "robotic-arm",
      context: "Advanced CAD, NYU, Fall 2024",
      point: "I designed the hand, palm, wrist and forearm of a human-scale arm in Fusion 360, and the wrist held a 1000 N load in SolidWorks Simulation (modeled in steel).",
    },
  ],
  education: { school: "NYU Tandon School of Engineering", degree: "B.S. Mechanical Engineering", year: "2025", gpa: "3.6/4.0" },
  skills: [
    ["Design", "Mechanical and product design, DFM, GD&T (ASME Y14.5), fixture design, rapid prototyping, 3D printing, materials selection"],
    ["Analysis and test", "FEA, CFD, tolerance stack-ups, test planning, verification and validation, control systems, system identification, data analysis"],
    ["Shop", "Manual mill and lathe, laser marking, welding"],
    ["Software", "SolidWorks, Solid Edge, Fusion 360, ANSYS (Mechanical, Fluent), MATLAB, Simulink, Python, Arduino, SQL, Power BI"],
    ["Process", "Lean Six Sigma (Green Belt trained), root cause analysis, CAPA"],
  ] as const,
};
