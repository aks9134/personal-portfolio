// Direction A, "The Line": the portfolio as a factory floor walked in stations. One hall, built to a loose scale in
// metres; the camera travels along the walkway with scroll and holds a composed view at each station while that
// station's beat plays (the hand assembles, the beam vibrates then settles, the drive climbs its rack and comes apart).
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { applyFinish } from "../../stage/engine";
import { clamp01, fit, loadEnv, loadModel, partsOf, smooth } from "../load";

export type Anchor = { id: string; station: number; pos: THREE.Vector3 };
export type Frame = { station: number; beat: number; anchors: { id: string; x: number; y: number; visible: boolean }[]; amp: number };

export type LineOptions = {
  canvas: HTMLCanvasElement;
  hand: string;
  shield: string;
  drive: string;
  extras: string[];
  motion: () => boolean;
  onFrame: (f: Frame) => void;
};

const STATION_X = [0, 16, 32, 48];
// Composed views per station: camera offset from the station origin, and the point it looks at.
const VIEWS: { eye: [number, number, number]; look: [number, number, number] }[] = [
  { eye: [-2.1, 2.3, 4.0], look: [-1.0, 1.75, 0] },
  { eye: [1.6, 1.8, 4.1], look: [-1.05, 1.0, 0] },
  { eye: [-2.4, 3.4, 6.2], look: [-1.3, 2.8, 0] },
  { eye: [-1.4, 2.4, 5.4], look: [-0.9, 1.1, 0] },
];
const INTRO = { eye: new THREE.Vector3(-14, 7, 16), look: new THREE.Vector3(10, 1.2, 0) };

const YELLOW = 0xf2c200;

export async function createLine(o: LineOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // A dark hall: the far end falls away into haze, and the light pools on the station in use.
  const scene = new THREE.Scene();
  const haze = new THREE.Color(0x242626);
  scene.background = haze;
  scene.fog = new THREE.FogExp2(haze, 0.045);
  const [env, handM, shieldM, driveM, ...extraM] = await Promise.all([
    loadEnv(renderer, "/lab/env/machine_shop_02_1k.hdr"),
    loadModel(o.hand),
    loadModel(o.shield),
    loadModel(o.drive),
    ...o.extras.map(loadModel),
  ]);
  scene.environment = env;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);

  // ---- The hall -------------------------------------------------------------------------------------------------
  const tex = new THREE.TextureLoader();
  const conc = (name: string, srgb = false) => {
    const t = tex.load(`/lab/concrete/${name}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(26, 9);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(130, 46),
    new THREE.MeshStandardMaterial({ map: conc("diff", true), normalMap: conc("nor"), roughnessMap: conc("rough"), color: 0x8f8d88, roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(24, 0, -4);
  floor.receiveShadow = true;
  scene.add(floor);

  const paint = new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.6 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x3b3e41, metalness: 0.7, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x232527, metalness: 0.5, roughness: 0.6 });
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.castShadow = shadow;
    b.receiveShadow = true;
    scene.add(b);
    return b;
  };
  // Walkway lines along the whole floor.
  for (const z of [3.6, -3.6]) box(120, 0.004, 0.12, paint, 24, 0.003, z, false);
  // Columns, a back wall with a band of windows, roof trusses and strip lights.
  for (let x = -16; x <= 72; x += 8) {
    box(0.55, 11, 0.55, steel, x, 5.5, -9);
    box(0.4, 0.5, 26, dark, x, 11, -2, false);
  }
  box(140, 14, 0.4, new THREE.MeshStandardMaterial({ color: 0x3a3c3c, roughness: 0.95 }), 24, 7, -11, false);
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8e6ef).multiplyScalar(2.2), toneMapped: false });
  for (let x = -14; x <= 70; x += 4) box(3.2, 2.2, 0.1, glow, x, 7.5, -10.75, false);
  // Light shafts from the window band: soft additive wedges reaching down to the floor.
  const shaftTex = (() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 256);
    const side = g.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, "rgba(0,0,0,1)");
    side.addColorStop(0.5, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = side;
    g.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  })();
  const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xcfe0ea, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let x = -14; x <= 70; x += 4) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 11), shaftMat);
    s.position.set(x + 1.2, 4.2, -6.2);
    s.rotation.set(-0.62, 0.25, 0);
    scene.add(s);
  }
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff4e0).multiplyScalar(3), toneMapped: false });
  for (let x = -14; x <= 70; x += 6) for (const z of [-5, 1]) box(3.6, 0.06, 0.22, lamp, x, 9.6, z, false);

  // Station pads: hatched border, a painted number on the floor.
  const pad = (i: number, label: string) => {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 1024, 1024);
    g.save();
    g.beginPath();
    g.rect(0, 0, 1024, 1024);
    g.rect(64, 64, 896, 896);
    g.clip("evenodd");
    for (let k = -1024; k < 2048; k += 96) {
      g.fillStyle = "#f2c200";
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + 48, 0);
      g.lineTo(k + 48 - 1024, 1024);
      g.lineTo(k - 1024, 1024);
      g.fill();
    }
    g.restore();
    g.fillStyle = "rgba(242,194,0,0.92)";
    g.font = "900 300px Arial Narrow, Arial, sans-serif";
    g.textBaseline = "bottom";
    g.fillText(label, 110, 960);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.7 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(STATION_X[i], 0.006, 0);
    m.receiveShadow = true;
    scene.add(m);
  };
  ["01", "02", "03", "04"].forEach((l, i) => pad(i, l));

  // Light: daylight through the window band, plus the HDRI from a real machine shop.
  const sun = new THREE.DirectionalLight(0xdfeaf2, 1.3);
  sun.position.set(-6, 14, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xdfe7ee, 0x3a3631, 0.18));
  // A work light over whichever station is in view: a warm pool on the pad, hard-ish shadows.
  const work = new THREE.SpotLight(0xffe2b8, 260, 0, 0.42, 0.75, 2);
  work.position.set(0, 9, 2.5);
  work.castShadow = true;
  work.shadow.mapSize.set(2048, 2048);
  work.shadow.bias = -0.0003;
  work.shadow.normalBias = 0.02;
  scene.add(work, work.target);

  const anchors: Anchor[] = [];
  const anchor = (id: string, station: number, x: number, y: number, z: number) => anchors.push({ id, station, pos: new THREE.Vector3(STATION_X[station] + x, y, z) });

  // ---- Station 01: robot cell, the hand assembles itself part by part ----------------------------------------------
  const cell = new THREE.Group();
  cell.position.x = STATION_X[0];
  scene.add(cell);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.75, 48), steel);
  pedestal.position.y = 0.375;
  pedestal.castShadow = pedestal.receiveShadow = true;
  cell.add(pedestal);
  // Safety fence: yellow posts, mesh panels.
  const meshTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.strokeStyle = "rgba(30,30,30,0.85)";
    g.lineWidth = 3;
    for (let k = 0; k <= 128; k += 16) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k, 128);
      g.moveTo(0, k);
      g.lineTo(128, k);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })();
  const fence = (x: number, z: number, w: number, rot: number) => {
    const t = meshTex.clone();
    t.repeat.set(w * 3, 6);
    t.needsUpdate = true;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 2), new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, alphaTest: 0.2, metalness: 0.6, roughness: 0.5 }));
    p.position.set(x, 1.1, z);
    p.rotation.y = rot;
    cell.add(p);
  };
  fence(0, -2.6, 5.2, 0);
  fence(-2.6, -0.4, 4.4, Math.PI / 2);
  for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 1.8]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), paint);
    post.position.set(x, 1.1, z);
    post.castShadow = true;
    cell.add(post);
  }
  const hand = handM.scene;
  applyFinish(THREE, hand, "aluminium", true);
  const handHolder = new THREE.Group();
  handHolder.add(hand);
  fit(hand, 2.7);
  handHolder.rotation.y = -0.5;
  handHolder.position.y = 0.75;
  cell.add(handHolder);
  scene.updateMatrixWorld(true);
  const handParts = partsOf(hand);
  const handCentre = new THREE.Box3().setFromObject(hand).getCenter(new THREE.Vector3());
  // A world-space offset expressed in a part's parent frame, so nested CAD transforms move it the right way.
  const inParent = (m: THREE.Object3D, from: THREE.Vector3, d: THREE.Vector3) =>
    m.parent!.worldToLocal(from.clone().add(d)).sub(m.parent!.worldToLocal(from.clone()));
  // Order: parts nearest the centre land first, the outermost (fingertips, the far end of the forearm) last.
  const handPlan = handParts
    .map((p) => {
      const dir = p.centre.clone().sub(handCentre);
      const dist = dir.length();
      const fly = dir.normalize().multiplyScalar(2.2).add(new THREE.Vector3(0, 1.6, 0));
      return {
        mesh: p.mesh,
        home: p.mesh.position.clone(),
        fly: inParent(p.mesh, p.centre, fly),
        up: inParent(p.mesh, p.centre, new THREE.Vector3(0, 0.03, 0)),
        spin: (Math.random() - 0.5) * 2.5,
        dist,
      };
    })
    .sort((a, b) => a.dist - b.dist);
  hand.traverse((n) => ((n as THREE.Mesh).castShadow = (n as THREE.Mesh).isMesh));
  anchor("hand-palm", 0, 0.2, 2.0, 0.3);
  anchor("hand-wrist", 0, -0.8, 1.7, -0.2);

  // ---- Station 02: the canceller's test stand, a fixed-fixed beam that vibrates, then settles -----------------------
  const rig = new THREE.Group();
  rig.position.x = STATION_X[1];
  scene.add(rig);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.0), new THREE.MeshStandardMaterial({ color: 0x5a5e62, metalness: 0.8, roughness: 0.35 }));
  base.position.y = 0.06;
  base.castShadow = base.receiveShadow = true;
  rig.add(base);
  for (const x of [-1.45, 1.45]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.3), steel);
    post.position.set(x, 0.57, 0);
    post.castShadow = true;
    rig.add(post);
  }
  const L = 2.9;
  const beamGeo = new THREE.BoxGeometry(L, 0.035, 0.22, 64, 1, 1);
  const beamRest = (beamGeo.attributes.position.array as Float32Array).slice();
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.9, roughness: 0.25 }));
  beam.position.y = 1.04;
  beam.castShadow = true;
  rig.add(beam);
  const shield = shieldM.scene;
  applyFinish(THREE, shield, "anodized", true);
  const shieldHolder = new THREE.Group();
  shieldHolder.add(shield);
  fit(shield, 0.75);
  shieldHolder.position.y = 1.06;
  shield.traverse((n) => ((n as THREE.Mesh).castShadow = (n as THREE.Mesh).isMesh));
  rig.add(shieldHolder);
  const shaker = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 32), dark);
  shaker.rotation.z = Math.PI / 2;
  shaker.position.set(1.1, 0.84, 0);
  shaker.castShadow = true;
  rig.add(shaker);
  anchor("rig-device", 1, 0, 1.6, 0);
  anchor("rig-beam", 1, -0.9, 1.06, 0.1);
  anchor("rig-shaker", 1, 1.1, 0.84, 0.15);

  // ---- Station 03: the Terrament drive climbs its rack, then comes apart ------------------------------------------
  const rackG = new THREE.Group();
  rackG.position.x = STATION_X[2];
  scene.add(rackG);
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 6.4, 0.34), steel);
  rack.position.set(0, 3.2, -0.6);
  rack.castShadow = true;
  rackG.add(rack);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.07, 0.12), steel, 40);
  for (let k = 0; k < 40; k++) teeth.setMatrixAt(k, new THREE.Matrix4().makeTranslation(0, 0.2 + k * 0.15, -0.38));
  teeth.castShadow = true;
  rackG.add(teeth);
  const footing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 1.6), dark);
  footing.position.set(0, 0.09, -0.6);
  footing.receiveShadow = footing.castShadow = true;
  rackG.add(footing);
  const drive = driveM.scene;
  applyFinish(THREE, drive, "anodized", true);
  const driveHolder = new THREE.Group();
  driveHolder.add(drive);
  const mixer = driveM.clip ? new THREE.AnimationMixer(drive) : null;
  const action = driveM.clip && mixer ? mixer.clipAction(driveM.clip).play() : null;
  if (action) action.paused = true;
  const explode = (p: number) => {
    if (!action || !mixer || !driveM.clip) return;
    action.time = driveM.clip.duration * 0.999 * clamp01(p);
    mixer.update(0);
  };
  explode(0);
  fit(drive, 2.6);
  driveHolder.rotation.y = Math.PI / 2;
  drive.traverse((n) => ((n as THREE.Mesh).castShadow = (n as THREE.Mesh).isMesh));
  rackG.add(driveHolder);
  anchor("drive-module", 2, 0.6, 3.4, 0.3);

  // ---- Station 04: dispatch, the later generations on a pallet ---------------------------------------------------
  const disp = new THREE.Group();
  disp.position.x = STATION_X[3];
  scene.add(disp);
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 1.4), new THREE.MeshStandardMaterial({ color: 0x9a7b55, roughness: 0.9 }));
  pallet.position.y = 0.4;
  pallet.castShadow = pallet.receiveShadow = true;
  disp.add(pallet);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.32, 1.2), dark);
  legs.position.y = 0.16;
  disp.add(legs);
  extraM.forEach((m, i) => {
    const g = new THREE.Group();
    applyFinish(THREE, m.scene, "anodized", true);
    g.add(m.scene);
    fit(m.scene, i === 0 ? 1.9 : 1.3);
    g.position.set(i === 0 ? -0.75 : 0.95, 0.48, 0);
    g.rotation.y = i === 0 ? 0.6 : -0.4;
    m.scene.traverse((n) => ((n as THREE.Mesh).castShadow = (n as THREE.Mesh).isMesh));
    disp.add(g);
  });
  anchor("dispatch-a", 3, -0.75, 1.9, 0);
  anchor("dispatch-b", 3, 0.95, 1.6, 0);

  // ---- Render pipeline ---------------------------------------------------------------------------------------------
  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.55, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let progress = 0;
  let w = 0;
  let h = 0;
  const resize = () => {
    w = o.canvas.clientWidth;
    h = o.canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(o.canvas);
  resize();

  // Scroll: 0-0.06 is the opening wide shot; then four equal segments. In each, the camera travels for the first
  // 35% and holds for the rest while the station's beat runs from 0 to 1.
  const eye = new THREE.Vector3();
  const look = new THREE.Vector3();
  const viewAt = (i: number) => ({
    eye: new THREE.Vector3(...VIEWS[i].eye).add(new THREE.Vector3(STATION_X[i], 0, 0)),
    look: new THREE.Vector3(...VIEWS[i].look).add(new THREE.Vector3(STATION_X[i], 0, 0)),
  });
  const views = VIEWS.map((_, i) => viewAt(i));
  const pose = (p: number) => {
    const intro = 0.06;
    if (p < intro) {
      const t = smooth(p / intro);
      eye.lerpVectors(INTRO.eye, views[0].eye, t);
      look.lerpVectors(INTRO.look, views[0].look, t);
      return { station: 0, beat: 0 };
    }
    const q = ((p - intro) / (1 - intro)) * 4;
    const i = Math.min(3, Math.floor(q));
    const f = q - i;
    const travel = 0.25;
    if (i === 0 || f >= travel) {
      eye.copy(views[i].eye);
      look.copy(views[i].look);
    } else {
      const t = smooth(f / travel);
      // An arc: rise a little between stations so the move reads as a crane shot, not a slide.
      eye.lerpVectors(views[i - 1].eye, views[i].eye, t).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * 1.6, Math.sin(t * Math.PI) * 1.4));
      look.lerpVectors(views[i - 1].look, views[i].look, t);
    }
    const beat = i === 0 ? clamp01(f / 0.85) : clamp01((f - travel) / (1 - travel - 0.1));
    return { station: i, beat };
  };

  const cur = { eye: INTRO.eye.clone(), look: INTRO.look.clone() };
  let raf = 0;
  let last = performance.now();
  let clock = 0;
  const proj = new THREE.Vector3();
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = o.motion();
    if (moving) clock += dt;
    const { station, beat } = pose(progress);
    // Ease the camera toward the scroll pose, so a wheel step glides instead of jumping.
    const k = moving ? 1 - Math.exp(-dt * 6) : 1;
    cur.eye.lerp(eye, k);
    cur.look.lerp(look, k);
    camera.position.copy(cur.eye);
    camera.lookAt(cur.look);
    // Keep the sun's shadow box on the station in view.
    sun.position.set(cur.look.x - 6, 14, -6);
    sun.target.position.set(cur.look.x, 0, 0);
    work.position.set(cur.look.x + 0.6, 9, 2.2);
    work.target.position.set(cur.look.x, 0.8, 0);

    // 01: assembly. Before the station, the parts hang in the air of the cell; the beat brings them home in order.
    const a = station === 0 ? beat : station > 0 ? 1 : 0;
    handPlan.forEach((pp, n) => {
      const start = (n / handPlan.length) * 0.7;
      const t = smooth((a - start) / 0.3);
      const hover = moving ? Math.sin(clock * 1.3 + n) * (1 - t) : 0;
      pp.mesh.position.copy(pp.home).addScaledVector(pp.fly, 1 - t).addScaledVector(pp.up, hover);
      pp.mesh.rotation.z = pp.spin * (1 - t);
    });
    if (moving) handHolder.rotation.y = -0.5 + Math.sin(clock * 0.25) * 0.06;

    // 02: the beam's first mode, slowed down so the eye can follow it; the canceller switches on halfway through
    // the beat and the amplitude drops toward the measured residual (75 to 90% less).
    const on = station === 1 ? beat > 0.45 : station > 1;
    const base = station === 1 ? 1 : 0.6;
    const amp = (on ? 0.18 : 1) * base * (moving ? 1 : 0);
    const disp = amp * 0.045 * Math.sin(clock * 2 * Math.PI * 2.2);
    const pos = beamGeo.attributes.position.array as Float32Array;
    for (let v = 0; v < pos.length; v += 3) {
      const x = beamRest[v];
      const mode = (1 - Math.cos((2 * Math.PI * (x + L / 2)) / L)) / 2;
      pos[v + 1] = beamRest[v + 1] + disp * mode;
    }
    beamGeo.attributes.position.needsUpdate = true;
    shieldHolder.position.y = 1.06 + disp;

    // 03: climb, then explode at the top.
    const c = station === 2 ? beat : station > 2 ? 1 : 0;
    driveHolder.position.set(0.45, 0.5 + smooth(c / 0.5) * 2.0, -0.2);
    explode(smooth((c - 0.45) / 0.5));

    // Callouts: project each anchor of the current station to the screen.
    const list = anchors.map((an) => {
      proj.copy(an.pos).project(camera);
      return { id: an.id, x: (proj.x * 0.5 + 0.5) * w, y: (-proj.y * 0.5 + 0.5) * h, visible: an.station === station && proj.z < 1 };
    });
    o.onFrame({ station, beat, anchors: list, amp: amp * (on ? 1 : 1) });
    composer.render();
  };
  raf = requestAnimationFrame(tick);

  return {
    setProgress(p: number) {
      progress = p;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      env.dispose();
    },
  };
}
