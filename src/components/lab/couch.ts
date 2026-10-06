// The motorized couch (summer 2021), rebuilt in three.js from the only two photos (front and side cut-outs) and the
// write-up: a loveseat with rolled arms, two seat and two back cushions, on a welded steel frame with a ground-level
// front bar on posts; a rear module welded on behind the backrest carrying the 470cc engine, a coil spring and the
// go-kart rear wheels; front wheels on a central axle, and the steering rod rising from it between the cushions.
// No dimensions survive, so every size here is an estimate (typical loveseat proportions, scaled to the photos).
// Millimetres. Returns the model plus an "explode" clip in the same form as the pipeline's GLBs.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Part = { mesh: THREE.Object3D; lift: THREE.Vector3 };

export function buildCouch() {
  const root = new THREE.Group();
  root.name = "motorized couch";
  const parts: Part[] = [];

  const fabric = new THREE.MeshPhysicalMaterial({ color: 0x8c8678, metalness: 0, roughness: 0.92, sheen: 0.45, sheenColor: new THREE.Color(0xd8d2c4), sheenRoughness: 0.8 });
  const fabricDark = new THREE.MeshPhysicalMaterial({ color: 0x7b7568, metalness: 0, roughness: 0.94, sheen: 0.4, sheenColor: new THREE.Color(0xc9c2b2), sheenRoughness: 0.8 });
  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x1c1d1f, metalness: 0.6, roughness: 0.5 });
  const engineMat = new THREE.MeshPhysicalMaterial({ color: 0x151617, metalness: 0.4, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const tire = new THREE.MeshPhysicalMaterial({ color: 0x121212, metalness: 0, roughness: 0.9 });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0xb9bcc0, metalness: 0.85, roughness: 0.35 });
  const copper = new THREE.MeshPhysicalMaterial({ color: 0xb4703c, metalness: 0.9, roughness: 0.32 });
  const spring = new THREE.MeshPhysicalMaterial({ color: 0x3a3c40, metalness: 0.85, roughness: 0.35 });

  const add = (mesh: THREE.Object3D, lift: [number, number, number], name: string) => {
    mesh.name = name;
    root.add(mesh);
    parts.push({ mesh, lift: new THREE.Vector3(...lift) });
    return mesh;
  };
  /** x across the couch, y up, z front (+) to back (-); positioned by centre. */
  const soft = (x: number, y: number, z: number, r: number, m: THREE.Material, at: [number, number, number]) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(x, y, z, 4, r), m);
    b.position.set(...at);
    return b;
  };
  const tube = (from: THREE.Vector3, to: THREE.Vector3, w = 25) => {
    const len = from.distanceTo(to);
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), frameMat);
    t.position.copy(from).add(to).multiplyScalar(0.5);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return t;
  };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const wheel = (r: number, w: number, hub: number) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(r - w * 0.32, w * 0.42, 16, 48), tire);
    t.scale.z = w / (w * 0.84);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(hub, hub, w * 0.7, 32), rim);
    disc.rotation.x = Math.PI / 2;
    g.add(t, disc);
    g.rotation.y = Math.PI / 2; // axle along x
    return g;
  };

  // ---- Upholstered body: skirt, backrest, rolled arms ------------------------------------------------------------
  add(soft(1300, 300, 820, 40, fabricDark, [0, 270, 20]), [0, 0, 0], "base");
  add(soft(1300, 430, 200, 60, fabricDark, [0, 640, -330]), [0, 120, -160], "backrest");
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.add(soft(190, 420, 860, 50, fabric, [0, 330, 0]));
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 880, 32), fabric);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(s * 40, 560, 0);
    arm.add(roll);
    arm.position.set(s * 745, 0, 10);
    add(arm, [s * 260, 60, 0], "arm");
  }
  for (const s of [-1, 1]) {
    add(soft(640, 170, 660, 70, fabric, [s * 325, 505, 80]), [s * 60, 300, 120], "seat cushion");
    add(soft(630, 440, 220, 90, fabric, [s * 325, 760, -200]), [s * 60, 360, -40], "back cushion");
  }

  // ---- Welded steel frame: side rails and cross members under the body, front bar on four posts ----------------
  const frame = new THREE.Group();
  for (const x of [-640, 640]) frame.add(tube(v(x, 105, -440), v(x, 105, 470)));
  for (const z of [-430, 0, 460]) frame.add(tube(v(-650, 105, z), v(650, 105, z)));
  frame.add(tube(v(-700, 35, 560), v(700, 35, 560)));
  for (const x of [-560, -190, 190, 560]) frame.add(tube(v(x, 35, 560), v(x, 105, 440), 20));
  add(frame, [0, -90, 60], "frame");

  // ---- Front: central axle with two small wheels, steering rod rising between the cushions ---------------------
  const front = new THREE.Group();
  front.add(tube(v(-330, 110, 180), v(330, 110, 180), 30));
  for (const x of [-360, 360]) {
    const w = wheel(110, 80, 50);
    w.position.set(x, 110, 180);
    front.add(w);
  }
  add(front, [0, -60, 220], "front axle and wheels");
  const rod = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 860, 20), frameMat);
  shaft.position.set(0, 540, 180);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 150, 20), engineMat);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, 975, 180);
  rod.add(shaft, grip);
  add(rod, [0, 520, 0], "steering rod");

  // ---- Rear module behind the backrest: sub-frame, engine, coil spring, rear wheels -----------------------------
  const sub = new THREE.Group();
  for (const x of [-430, 430]) {
    sub.add(tube(v(x, 105, -440), v(x, 105, -980)));
    sub.add(tube(v(x, 105, -460), v(x, 560, -460)));
    sub.add(tube(v(x, 430, -470), v(x, 430, -900)));
  }
  sub.add(tube(v(-440, 430, -900), v(440, 430, -900)));
  sub.add(tube(v(-440, 105, -980), v(440, 105, -980)));
  add(sub, [0, 0, -260], "rear sub-frame");

  const engine = new THREE.Group();
  engine.add(soft(380, 300, 330, 30, engineMat, [0, 600, -700]));
  const head = soft(220, 200, 200, 25, engineMat, [-150, 790, -720]);
  head.rotation.z = 0.35;
  engine.add(head);
  engine.add(soft(300, 150, 230, 40, engineMat, [70, 830, -690])); // fuel tank
  engine.add(soft(170, 160, 130, 30, engineMat, [210, 720, -820])); // air cleaner
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 70, 40), engineMat);
  shroud.rotation.z = Math.PI / 2;
  shroud.position.set(-230, 610, -700);
  const clutch = new THREE.Mesh(new THREE.CylinderGeometry(95, 95, 30, 40), copper);
  clutch.rotation.z = Math.PI / 2;
  clutch.position.set(225, 560, -700);
  engine.add(shroud, clutch);
  add(engine, [0, 360, -360], "470cc engine");

  const coil = new THREE.CatmullRomCurve3(
    Array.from({ length: 8 * 24 + 1 }, (_, k) => {
      const t = k / (8 * 24);
      const a = t * Math.PI * 2 * 8;
      return v(Math.cos(a) * 34, 150 + t * 260, -560 + Math.sin(a) * 34);
    }),
  );
  add(new THREE.Mesh(new THREE.TubeGeometry(coil, 300, 6, 8, false), spring), [0, 200, -300], "coil spring");

  for (const s of [-1, 1]) {
    const w = wheel(225, 190, 110);
    w.position.set(s * 560, 225, -800);
    add(w, [s * 300, 0, -340], "rear wheel");
  }

  // The explode clip: every part moves from where it sits along its lift vector.
  const tracks = parts.map((p) => {
    const a = p.mesh.position.clone();
    const b = a.clone().add(p.lift);
    return new THREE.VectorKeyframeTrack(`${p.mesh.uuid}.position`, [0, 1], [a.x, a.y, a.z, b.x, b.y, b.z]);
  });
  return { scene: root, clip: new THREE.AnimationClip("explode", 1, tracks), parts: parts.length };
}
