export const site = {
  name: "Allen Sun",
  role: "Mechanical design engineer",
  line: "I design parts, machine them, and put them on a test rig. Right now that's design work on large electric motors at Curtiss-Wright.",
  description:
    "Allen Sun, mechanical design engineer. Hardware he designed and built: an active vibration canceller, a gravity storage drive prototype, a TPU weld rig and more.",
  // The address Allen shares. Link previews and canonical URLs are built from it, so it has to match the
  // domain people actually visit. Vercel gave the project two; change this line if he buys a domain.
  url: "https://personal-portfolio-aks9134.vercel.app",
  email: "aks9134@nyu.edu",
  linkedin: "https://www.linkedin.com/in/allen-sun-b06858233/",
  // Curtiss-Wright is naval nuclear work. Allen cleared his resume and knowledge log for sharing on 2026-09-22, and
  // confirmed that every bullet on his resume was worked through to completion, which is why the casting and the
  // rewind are written as his own work. He also said no CW review is needed before launch. Nothing here goes past
  // his resume plus those two cases; never add more without asking him. cwText is the resume entry, cwDetail the About one.
  cwText:
    "I design and analyze canned induction motor assemblies for marine propulsion. That runs from stator geometry, windings and bearings up to how the air gap and rotor bar choices drive torque, slip and copper loss. I also disposition nonconforming hardware with Solid Edge, FEA and tolerance stack-ups, and I make the GD&T drawings, BOMs and reports that go with these parts.",
  cwDetail: [
    "Most of the design work is following a physical decision through to how the motor performs. The air gap length and the rotor bar resistance each shift torque, slip and copper loss, and part of the job is working out how. The motors run in seawater, so material choices trade electromagnetic performance against corrosion. I also analyze how the winding layout and the air gap interact with the propeller's load across its operating conditions.",
    "The other half is nonconforming hardware. When a part is out of spec, I analyze it with Solid Edge, FEA and tolerance stack-ups and write the engineering disposition that gets it back to drawing. Most cases are dimensional, surface or fit problems. Some go into the material. A nickel-aluminum bronze casting came in harder than its drawing allows and cost tooling on the boring machine, so the work was the heat treatment that brings the hardness back into range and what has to be re-verified afterward. A stator rewind needed its cured VPI resin stripped without harming the coils and laminations we meant to keep, so I ranked burn-off, dry-ice blasting and a chemical digester against that constraint and recommended one.",
    "I also make and revise the drawings for these parts with GD&T to ASME Y14.5, set each material's criticality and traceability class, keep the engineering BOMs, and write the design and test reports that record what was analyzed and decided.",
  ] as const,
};

