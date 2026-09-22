// The public resume: /resume renders it and scripts/resume-pdf.mjs prints that page, so the two can't drift.
// Public-safe by rule: no phone number; Curtiss-Wright is only the text Allen approved on 2026-09-21
// (DECISIONS-LOG), and the QA role is left out.
import { site } from "./site";

export type Job = { org: string; title: string; place: string; dates: string; text?: string; points?: string[] };

export const resume = {
  location: "Pittsburgh, PA",
  jobs: [
    {
      org: "Curtiss-Wright, Electro-Mechanical Division",
      title: "Mechanical Design Engineer",
      place: "Pittsburgh, PA",
      dates: "Mar 2026 - present",
      text: site.cwText,
    },
    {
      org: "Ergami Endoscopy",
      title: "R&D / Robotics Engineering Intern",
      place: "New York, NY",
      dates: "Jan - May 2025",
      points: [
        "Designed and built the weld rig behind the TPU tube process for a soft robotic colonoscope insert: machined aluminum on press-fit brass rods with 3D-printed parts, for consistent heat welds.",
        "Worked on the insert's locomotion concept: anchor design, actuator selection and motion testing.",
      ],
    },
    {
      org: "Relavo Medical",
      title: "Mechanical Engineering Intern",
      place: "New York, NY",
      dates: "Sep - Dec 2024",
      points: [
        "Worked on a device that disinfects peritoneal dialysis tube connections.",
        "Reviewed the design control traceability matrix, wrote verification and validation test protocols, and designed test fixtures in SolidWorks, including torque and robustness tests.",
        "Made GD&T drawings for injection-molded parts.",
      ],
    },
    {
      org: "Terrament",
      title: "Mechanical Engineering Intern",
      place: "New York, NY",
      dates: "Sep 2023 - Sep 2024",
      points: [
        "Built and wired the 1/24-scale geared drive prototype shown at Newlab's New Climate Futures in September 2023.",
        "Load calculations, gear-ratio analyses and structural feasibility studies in Fusion 360 for a gravity storage system and its linear harmonic drive redesign.",
        "3D-printed prototypes with off-the-shelf industrial parts; FEA for stress distribution, fatigue life and material selection.",
      ],
    },
  ] satisfies Job[],
  projects: [
    {
      name: "Micro-vibration canceller",
      slug: "micro-vibration-canceller",
      context: "Senior design, NYU, Sep 2024 - May 2025",
      point: "Bolt-on active vibration canceller (voice coil motor, piezo sensor). Machined every part and the test rig; open-loop tests cut beam vibration 75 to 90% at 54 Hz. Best Senior Design Project, NYU ME class of 2025.",
    },
    {
      name: "Robotic arm",
      slug: "robotic-arm",
      context: "Advanced CAD, NYU, Fall 2024",
      point: "Designed the hand, palm, wrist and forearm of a human-scale arm in Fusion 360; wrist FEA at 1000 N in SolidWorks Simulation.",
    },
  ],
  education: { school: "NYU Tandon School of Engineering", degree: "B.S. Mechanical Engineering", year: "2025", gpa: "3.6/4.0" },
  skills: [
    ["Design", "Mechanical and product design, DFM, GD&T (ASME Y14.5), fixture design, rapid prototyping, 3D printing, materials selection"],
    ["Analysis and test", "FEA, CFD, test planning, verification and validation, control systems, system identification, data analysis"],
    ["Shop", "Manual mill and lathe, laser marking, welding"],
    ["Software", "SolidWorks, Fusion 360, ANSYS (Mechanical, Fluent), MATLAB, Simulink, Python, Arduino, SQL, Power BI"],
    ["Process", "Lean Six Sigma (Green Belt trained), root cause analysis, CAPA"],
  ] as const,
};
