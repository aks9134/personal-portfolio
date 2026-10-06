// The TPU weld rig (Ergami, spring 2025), rebuilt in three.js from Allen's dimension notes, the STL channel segments,
// the exploded render and the photo (sources in _notes/ergami.md): two 6061 heating bars .1825 x 1.00 in, .253 in
// apart, joined by 2.00 x 1.00 x .3825 in bearing blocks whose holes (1.5 in apart) ride on 3/8 in brass rods
// pressed into two .75 x .3825 in base bars set .75 in apart; between them, the printed ABS channel (0.75 x 0.125 in
// strips, about 8 in each, grooved for a silicone strip). Lengths the notes leave open are estimated: the heating
// bars at the noted "36in?", the base bars a little longer than the five channel segments. Millimetres. Returns the
// model plus an "explode" clip in the same form as the pipeline's GLBs.
import * as THREE from "three";

const IN = 25.4;
type Part = { mesh: THREE.Object3D; lift: THREE.Vector3 };

export function buildWeldRig() {
  const root = new THREE.Group();
  root.name = "weld rig";
  const parts: Part[] = [];

  const alu = new THREE.MeshPhysicalMaterial({ color: 0xb4b8bd, metalness: 0.8, roughness: 0.42 });
  const aluBar = new THREE.MeshPhysicalMaterial({ color: 0xa3a7ac, metalness: 0.8, roughness: 0.48 });
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xc8a050, metalness: 0.9, roughness: 0.3 });
  const abs = new THREE.MeshPhysicalMaterial({ color: 0x2c2d30, metalness: 0, roughness: 0.6 }); // printed ABS; colour not recorded
  const silicone = new THREE.MeshPhysicalMaterial({ color: 0xb3221f, metalness: 0, roughness: 0.7 }); // the red strip in the render
  const steel = new THREE.MeshPhysicalMaterial({ color: 0x26282b, metalness: 0.8, roughness: 0.38 });
  const plateMat = new THREE.MeshPhysicalMaterial({ color: 0x2f5fd0, metalness: 0, roughness: 0.55 }); // the blue end plates in the photo

  const add = (mesh: THREE.Object3D, lift: [number, number, number], name: string) => {
    mesh.name = name;
    root.add(mesh);
    parts.push({ mesh, lift: new THREE.Vector3(...lift) });
    return mesh;
  };
  /** A box by its size (x along the rig, y up, z across) and its lowest-y, centre-x, centre-z position. */
  const box = (x: number, y: number, z: number, m: THREE.Material, at: [number, number, number]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
    b.position.set(at[0], at[1] + y / 2, at[2]);
    return b;
  };
  const cyl = (r: number, h: number, m: THREE.Material, seg = 32) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);

  const channelSeg = 204; // mm, the STL segments (203.2-205.2)
  const channelLen = channelSeg * 5;
  const baseLen = channelLen + 2 * IN; // estimated
  const heatLen = 36 * IN; // "36in?" in the notes
  const baseH = 0.3825 * IN;
  const baseW = 0.75 * IN;
  const gap = 0.75 * IN; // channel width between the base bars
  const zBar = (gap + baseW) / 2; // base bar centres, which the rod holes (1.5 in apart) also sit on

  // ---- Base: two bottom bearing bars ----------------------------------------------------------------------------
  for (const s of [-1, 1]) add(box(baseLen, baseH, baseW, alu, [0, 0, s * zBar]), [0, 0, s * 14], "bottom bearing bar");

  // ---- End plates across both bars (blue in the photo), two screws each ----------------------------------------
  for (const s of [-1, 1]) {
    const plate = new THREE.Group();
    plate.add(box(1.5 * IN, 0.132 * IN, 2 * zBar + baseW, plateMat, [0, baseH, 0]));
    for (const z of [-zBar, zBar]) {
      const head = cyl(3.4, 2.6, steel, 20);
      head.position.set(0, baseH + 0.132 * IN + 1.3, z);
      plate.add(head);
    }
    plate.position.x = s * (baseLen / 2 - 0.9 * IN);
    add(plate, [s * 40, 70, 0], "end plate");
  }

  // ---- Printed channel: five grooved ABS segments with the silicone strip in the groove -------------------------
  const chT = 0.125 * IN;
  const chY = baseH - chT; // top flush with the base bars, where the sheet lies
  for (let k = 0; k < 5; k++) {
    const seg = new THREE.Group();
    const x0 = -channelLen / 2 + channelSeg * (k + 0.5);
    const groove = 1.87; // groove floor width (STL)
    const side = (gap - 1.2 - groove) / 2;
    seg.add(box(channelSeg - 1.2, 0.6, gap - 1.2, abs, [0, chY, 0])); // floor under the groove
    for (const s of [-1, 1]) seg.add(box(channelSeg - 1.2, chT, side, abs, [0, chY, s * (groove / 2 + side / 2)]));
    seg.position.x = x0;
    add(seg, [(k - 2) * 26, 34, 0], "channel segment");
  }
  const strip = box(channelLen - 6, 2.4, 1.8, silicone, [0, chY + 0.6, 0]);
  add(strip, [0, 52, 0], "silicone strip");

  // ---- Brass guide rods, two at each end, pressed into the base bars ------------------------------------------
  const rodX = heatLen / 2 - 0.5 * IN;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const rod = cyl((0.375 * IN) / 2, 3 * IN, brass, 24);
      rod.position.set(sx * rodX, 1.5 * IN, sz * zBar);
      add(rod, [0, 96, 0], "brass guide rod");
    }

  // ---- Heating bars, .253 in apart over the channel ------------------------------------------------------------
  const heatT = 0.1825 * IN;
  const heatH = 1 * IN;
  const zHeat = (0.253 * IN + heatT) / 2;
  for (const s of [-1, 1]) add(box(heatLen, heatH, heatT, aluBar, [0, baseH, s * zHeat]), [0, 150, s * 10], "heating bar");

  // ---- Bearing blocks at both ends: across the heating bars, on the rods, two #8-32 screws each -----------------
  for (const s of [-1, 1]) {
    const block = new THREE.Group();
    block.add(box(1 * IN, 0.3825 * IN, 2 * IN, alu, [0, baseH + heatH, 0]));
    for (const z of [-zHeat, zHeat]) {
      const head = cyl(3.4, 3.4, steel, 20);
      head.position.set(0, baseH + heatH + 0.3825 * IN + 1.7, z);
      block.add(head);
    }
    block.position.x = s * rodX;
    add(block, [0, 200, 0], "bearing block");
  }

  // The explode clip: every part moves from where it sits along its lift vector.
  const tracks = parts.map((p) => {
    const a = p.mesh.position.clone();
    const b = a.clone().add(p.lift);
    return new THREE.VectorKeyframeTrack(`${p.mesh.uuid}.position`, [0, 1], [a.x, a.y, a.z, b.x, b.y, b.z]);
  });
  return { scene: root, clip: new THREE.AnimationClip("explode", 1, tracks), parts: parts.length };
}
