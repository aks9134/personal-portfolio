// The micro-vibration canceller (final device, spring 2025), rebuilt in three.js because the SolidWorks assembly
// (VI-A01) can't be exported here. Built from the final render, the exploded drawing, the photos and the stated parts:
// Thorlabs VC250 voice coil (25.4 mm travel), 6061 mount plate, piezo disc glued under the motor axis, centering
// spring, PLA cage shield (printed red), socket-head bolts through a 6061 beam. Dimensions are estimates in
// millimetres, scaled from the early shield's measured envelope (54 x 41 x 80 mm); the stack order and part count
// follow the drawing. Returns the model plus an "explode" clip in the same form as the pipeline's GLBs, so every
// viewer treats it like the others.
import * as THREE from "three";

type Part = { mesh: THREE.Object3D; lift: THREE.Vector3 };

export function buildCanceller() {
  const root = new THREE.Group();
  root.name = "canceller";
  const parts: Part[] = [];

  const alu = new THREE.MeshPhysicalMaterial({ color: 0xa9adb2, metalness: 0.8, roughness: 0.48 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x878b90, metalness: 0.8, roughness: 0.52 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0x2b2d30, metalness: 0.8, roughness: 0.38 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x141516, metalness: 0.3, roughness: 0.55 });
  const pla = new THREE.MeshPhysicalMaterial({ color: 0x6a1a25, metalness: 0, roughness: 0.72 });
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xc8924a, metalness: 0.9, roughness: 0.3 });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xe9e4d8, metalness: 0, roughness: 0.5 });
  const coil = new THREE.MeshPhysicalMaterial({ color: 0xb06a2c, metalness: 0.85, roughness: 0.35 });

  const add = (mesh: THREE.Object3D, lift: [number, number, number], name: string) => {
    mesh.name = name;
    root.add(mesh);
    parts.push({ mesh, lift: new THREE.Vector3(...lift) });
    return mesh;
  };
  const cyl = (r: number, h: number, m: THREE.Material, seg = 48, rTop = r) => new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), m);
  const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  /** An annular band: inner radius ri, outer ro, height h, from y = 0 up. */
  const band = (ri: number, ro: number, h: number, m: THREE.Material) =>
    new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(ri, 0), new THREE.Vector2(ro, 0), new THREE.Vector2(ro, h), new THREE.Vector2(ri, h), new THREE.Vector2(ri, 0)], 72), m);

  // ---- Beam section (6061 flat bar, 2 x 1/4 in), cut either side of the device --------------------------------------
  const beam = box(180, 6.35, 50.8, alu);
  beam.position.y = -3.175;
  add(beam, [0, 0, 0], "beam");

  // ---- Piezo disc on the beam, under the motor axis: brass shim with a ceramic face ----------------------------------
  const piezo = new THREE.Group();
  const shim = cyl(13.5, 0.4, brass, 48);
  shim.position.y = 0.2;
  const face = cyl(9.5, 0.5, ceramic, 48);
  face.position.y = 0.65;
  piezo.add(shim, face);
  add(piezo, [0, 12, 0], "piezo");

  // ---- Mount plate (6061, machined): square plate, motor seat boss, four counterbored corners -----------------------
  const plate = new THREE.Group();
  const slab = box(62, 6, 62, aluDark);
  slab.position.y = 4.5; // sits on 1.5 mm stand-offs so the piezo fits underneath
  plate.add(slab);
  const seat = band(15.6, 21, 6, aluDark);
  seat.position.y = 7.5;
  plate.add(seat);
  for (const [x, z] of [[-23, -23], [23, -23], [-23, 23], [23, 23]]) {
    const ear = cyl(6.2, 1.2, aluDark, 32);
    ear.position.set(x, 8.1, z);
    plate.add(ear);
  }
  add(plate, [0, 26, 0], "mount plate");

  // ---- Bolts: socket-head caps on the plate corners, shanks through the beam, nuts beneath ---------------------------
  for (const [x, z] of [[-23, -23], [23, -23], [-23, 23], [23, 23]]) {
    const bolt = new THREE.Group();
    const head = cyl(3.6, 3.6, black, 24);
    head.position.y = 10.5;
    const socket = cyl(1.6, 0.8, steel, 6);
    socket.position.y = 12.0;
    const shank = cyl(1.9, 26, steel, 16);
    shank.position.y = -3.5;
    bolt.add(head, socket, shank);
    add(bolt, [x * 0.7, 62, z * 0.7], "bolt");
    const nut = cyl(3.9, 3.2, steel, 6);
    nut.position.set(x, -8.2, z);
    add(nut, [x * 0.4, -18, z * 0.4], "nut");
  }

  // ---- Voice coil motor (Thorlabs VC250): housing, knurled base band, moving coil and shaft -------------------------
  const motor = new THREE.Group();
  const housing = cyl(15.5, 44, alu, 64);
  housing.position.y = 13.5 + 22;
  const ring = cyl(17, 5, black, 64);
  ring.position.y = 13.5 + 2.5;
  const coilEnd = cyl(8.5, 6, coil, 48);
  coilEnd.position.y = 13.5 + 44 + 3;
  const shaft = cyl(2.5, 9, steel, 24);
  shaft.position.y = 13.5 + 44 + 10;
  motor.add(housing, ring, coilEnd, shaft);
  add(motor, [0, 46, 0], "voice coil motor");

  // ---- Centering spring: a helix from the coil end to the cage's top hub --------------------------------------------
  const turns = 9;
  const helix = new THREE.CatmullRomCurve3(
    Array.from({ length: turns * 24 + 1 }, (_, k) => {
      const t = k / (turns * 24);
      const a = t * Math.PI * 2 * turns;
      return new THREE.Vector3(Math.cos(a) * 6.2, 63 + t * 37, Math.sin(a) * 6.2);
    }),
  );
  const spring = new THREE.Mesh(new THREE.TubeGeometry(helix, 360, 0.75, 8, false), steel);
  add(spring, [0, 74, 0], "centering spring");

  // ---- Cage shield (PLA, solid infill, printed red): base flange, eight ribs, four rings, a spoked top --------------
  const cage = new THREE.Group();
  const flange = box(58, 4, 58, pla);
  flange.position.y = 9.5;
  cage.add(flange);
  const R = 24;
  const H = 96;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const rib = box(7.5, H, 2.6, pla);
    rib.position.set(Math.cos(a) * (R - 1.3), 11.5 + H / 2, Math.sin(a) * (R - 1.3));
    rib.rotation.y = -a + Math.PI / 2;
    cage.add(rib);
  }
  for (const y of [11.5, 35, 58.5, 82]) {
    const b = band(R - 2.6, R, 4.5, pla);
    b.position.y = y;
    cage.add(b);
  }
  const top = band(R - 3, R, 4, pla);
  top.position.y = 11.5 + H - 4;
  cage.add(top);
  const hub = band(4, 9, 4, pla);
  hub.position.y = 11.5 + H - 4;
  cage.add(hub);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const spoke = box(R - 11, 4, 3.2, pla);
    spoke.position.set(Math.cos(a) * (R / 2 + 3), 11.5 + H - 2, Math.sin(a) * (R / 2 + 3));
    spoke.rotation.y = -a;
    cage.add(spoke);
  }
  add(cage, [0, 104, 0], "cage shield");

  // Shadows and the explode clip: every part moves from where it sits along its lift vector.
  root.traverse((n) => {
    const m = n as THREE.Mesh;
    if (m.isMesh) m.castShadow = m.receiveShadow = true;
  });
  const tracks = parts
    .filter((p) => p.lift.lengthSq() > 0)
    .map((p) => {
      const a = p.mesh.position.clone();
      const b = a.clone().add(p.lift);
      return new THREE.VectorKeyframeTrack(`${p.mesh.uuid}.position`, [0, 1], [a.x, a.y, a.z, b.x, b.y, b.z]);
    });
  const clip = new THREE.AnimationClip("explode", 1, tracks);
  return { scene: root, clip, parts: parts.length };
}
