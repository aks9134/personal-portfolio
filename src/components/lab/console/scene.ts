// Direction B, "Console": scan to solid. Each model exists twice: as a point cloud sampled from its real surfaces, and
// as the solid part. Scrolling into a project re-forms the cloud from the previous machine into this one; then a scan
// plane sweeps upward, and below it the cloud becomes the solid (a clipping plane on the solid, a discard in the
// points shader). Once solid, assemblies with an explode clip come apart.
//
// Smoothness: every model's cloud is uploaded once as its own attribute, and the shader picks the pair by uniform
// weights, so changing project costs no upload; every solid is compiled before the first frame, so a project never
// stalls on its first appearance; the scroll position is eased toward the target each frame, so a wheel step glides.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { applyFinish } from "../../stage/engine";
import { buildCanceller } from "../canceller";
import { buildCouch } from "../couch";
import { buildWeldRig } from "../weld-rig";
import { clamp01, loadModel, smooth } from "../load";
import { EXPLODE, MORPH, SCAN, segments } from "./timeline";

const SIZE = 3.2;
const MAX = 4; // the shader carries up to four clouds

// Rebuilt models (no CAD on file), built in code from the sources each file names.
const builders = { canceller: buildCanceller, "weld-rig": buildWeldRig, couch: buildCouch };

// view: where the camera settles once an assembly is solid, as a turn off side-on and an elevation (radians); a long
// thin part reads better from a three-quarter view above than straight side-on.
export type Spec = { src?: string; build?: keyof typeof builders; finish: "aluminium" | "anodized" | "own"; parts: number; weight?: number; view?: { turn?: number; el?: number } };
export type Measure = { x: number; y: number; z: number; parts: number };
export type ConsoleFrame = { index: number; phase: "morph" | "scan" | "solid" };

export async function createConsole(o: {
  canvas: HTMLCanvasElement;
  models: Spec[];
  motion: () => boolean;
  progress: () => number;
  onFrame: (f: ConsoleFrame) => void;
  onTick: (scan: number, apart: number) => void; // scan 0-1; apart: how far the active assembly has come apart, 0-1
  onMeasure: (m: Measure[]) => void;
}) {
  if (o.models.length > MAX) throw new Error(`console scene holds at most ${MAX} models`);
  const coarse = matchMedia("(pointer: coarse)").matches;
  const N = coarse ? 26000 : 52000;
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.Fog(0x05070a, 9, 22);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  // Key high above the view: flat tops still catch it, but its glare reflects away from the lens, not into it.
  const key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(3, 8, 3);
  const rim = new THREE.DirectionalLight(0xff6a2b, 1.6);
  rim.position.set(-4, 2, -3);
  // The lights ride with the camera: the key stays front-right of the view and the orange rim behind-left, so
  // whichever way the orbit has turned, the model faces the light (fixed lights left some models seen from the dark side).
  const rig = new THREE.Group();
  rig.add(key, rim);
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);

  const grid = new THREE.GridHelper(40, 80, 0x1d2a33, 0x111a20);
  grid.position.y = -SIZE * 0.42;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.7;
  scene.add(grid);

  const loaded = await Promise.all(o.models.map((m) => (m.build ? Promise.resolve(builders[m.build]()) : loadModel(m.src!))));
  const measures: Measure[] = [];
  const clouds: { whole: Float32Array; apart: Float32Array }[] = [];
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const solids: { root: THREE.Group; mixer: THREE.AnimationMixer | null; action: THREE.AnimationAction | null; clip: THREE.AnimationClip | null; pose: number; broad: number; el: number; y0: number; y1: number; floor0: number; floor1: number; c0: THREE.Vector3; c1: THREE.Vector3; r0: number; r1: number }[] = [];

  loaded.forEach((l, i) => {
    const model = l.scene;
    // Assemble first: the pipeline's GLBs rest in their exploded pose, and everything below (the envelope, the
    // centring, the point cloud) must describe the assembled part.
    const mixer = l.clip ? new THREE.AnimationMixer(model) : null;
    const action = l.clip && mixer ? mixer.clipAction(l.clip).play() : null;
    if (action) action.paused = true;
    const poseAt = (p: number) => {
      if (!action || !mixer || !l.clip) return;
      action.time = l.clip.duration * 0.999 * p;
      mixer.update(0);
    };
    poseAt(0);
    model.updateMatrixWorld(true);
    const raw = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    let meshes = 0;
    model.traverse((n) => (meshes += (n as THREE.Mesh).isMesh ? 1 : 0));
    measures.push({ x: raw.x, y: raw.y, z: raw.z, parts: o.models[i].parts || ("parts" in l ? (l.parts as number) : 0) || meshes });
    const s = SIZE / Math.max(raw.x, raw.y, raw.z);
    const holder = new THREE.Group();
    holder.add(model);
    model.scale.multiplyScalar(s);
    model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
    holder.updateMatrixWorld(true);
    // Sample the surfaces: every mesh merged into one position-only geometry in holder space. Each mesh's index rides
    // along in the colour channel, so every point knows which part it sits on.
    const geos: THREE.BufferGeometry[] = [];
    const meshList: THREE.Mesh[] = [];
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const p = m.geometry.attributes.position;
      const arr = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) arr.set([p.getX(k), p.getY(k), p.getZ(k)], k * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(p.count * 3).fill(meshList.length), 3));
      if (m.geometry.index) g.setIndex(m.geometry.index.clone());
      g.applyMatrix4(m.matrixWorld);
      geos.push(g.index ? g.toNonIndexed() : g);
      meshList.push(m);
    });
    const merged = mergeGeometries(geos);
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
    const pts = new Float32Array(N * 3);
    const owner = new Uint16Array(N);
    const v = new THREE.Vector3();
    const tag = new THREE.Color();
    for (let k = 0; k < N; k++) {
      sampler.sample(v, undefined, tag);
      pts.set([v.x, v.y, v.z], k * 3);
      owner[k] = Math.round(tag.r);
    }
    merged.dispose();
    geos.forEach((g) => g.dispose());

    if (o.models[i].finish !== "own") applyFinish(THREE, model, o.models[i].finish as "aluminium" | "anodized", !coarse);
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = (m.material as THREE.Material).clone();
      mat.clippingPlanes = [clip];
      m.material = mat;
    });
    scene.add(holder);
    // Framing: the bounding sphere assembled and fully apart. The holder is shifted by the interpolated centre each
    // frame, so an assembly comes apart about the middle of the view instead of drifting.
    const box = () => {
      holder.updateMatrixWorld(true);
      return new THREE.Box3().setFromObject(model);
    };
    const sphere = () => box().getBoundingSphere(new THREE.Sphere());
    // The scan sweeps the part's own height (a flat part would otherwise resolve in an instant mid-sweep), and the floor
    // sits just under its lowest point, assembled or apart.
    const b0 = box();
    const s0 = sphere();
    const where = () => meshList.map((m) => new THREE.Vector3().setFromMatrixPosition(m.matrixWorld));
    const at0 = where();
    poseAt(1);
    const s1 = l.clip ? sphere() : s0;
    const floor1 = l.clip ? box().min.y - s1.center.y : b0.min.y - s0.center.y;
    // The cloud twice, in the solid's own frame: assembled, and fully apart (each point moved with its part; the
    // explode clips only translate parts). A burst out of an assembly then starts from the pose the solid left in.
    const apart = l.clip ? new Float32Array(N * 3) : pts;
    if (l.clip) {
      const d = where().map((p, k) => p.sub(at0[k]).sub(s1.center));
      for (let k = 0; k < N; k++) {
        const off = d[owner[k]];
        apart.set([pts[k * 3] + off.x, pts[k * 3 + 1] + off.y, pts[k * 3 + 2] + off.z], k * 3);
      }
    }
    for (let k = 0; k < N * 3; k++) pts[k] -= s0.center.getComponent(k % 3);
    clouds.push({ whole: pts, apart });
    poseAt(0);
    // Side-on azimuth: the camera looks across the long horizontal axis, where an explode reads widest.
    solids.push({ root: holder, mixer, action, clip: l.clip, pose: -1, broad: (raw.x >= raw.z ? 0 : Math.PI / 2) + (o.models[i].view?.turn ?? 0), el: o.models[i].view?.el ?? 0.3, y0: b0.min.y - s0.center.y, y1: b0.max.y - s0.center.y, floor0: b0.min.y - s0.center.y, floor1, c0: s0.center, c1: s1.center, r0: s0.radius, r1: s1.radius });
  });
  o.onMeasure(measures);

  // The cloud: every model's points as its own attribute, plus a scattered starting field.
  const start = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    const r = 6 + Math.random() * 6;
    const t = Math.random() * Math.PI * 2;
    start.set([Math.cos(t) * r, (Math.random() - 0.5) * 8, Math.sin(t) * r], k * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  for (let k = 0; k < MAX; k++) {
    const c = clouds[k] ?? clouds[clouds.length - 1];
    const whole = new THREE.BufferAttribute(c.whole, 3);
    geo.setAttribute(`c${k}`, whole);
    // A part with no explode shares its one buffer for both shapes.
    geo.setAttribute(`e${k}`, c.apart === c.whole ? whole : new THREE.BufferAttribute(c.apart, 3));
  }
  const seed = new Float32Array(N);
  for (let k = 0; k < N; k++) seed[k] = Math.random();
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uFromStart: { value: 1 },
    uFromPose: { value: 0 }, // how far apart the outgoing machine was when it let go (0 assembled, 1 fully apart)
    uFrom: { value: new THREE.Vector4() },
    uTo: { value: new THREE.Vector4(1, 0, 0, 0) },
    uMorph: { value: 0 },
    uScan: { value: -10 },
    uTime: { value: 0 },
    uSize: { value: 2.4 },
    uPix: { value: 1 },
    uHot: { value: new THREE.Color(0xff6a2b) },
    uHotK: { value: 9 }, // how tight the glowing band at the scan line is: tighter on a flat part, so it never lights all of it
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 c0, c1, c2, c3, e0, e1, e2, e3; attribute float seed;
      uniform float uFromStart, uFromPose, uMorph, uScan, uTime, uSize, uPix, uHotK; uniform vec4 uFrom, uTo;
      varying float vAlpha; varying float vHot;
      void main() {
        vec3 whole = c0 * uFrom.x + c1 * uFrom.y + c2 * uFrom.z + c3 * uFrom.w;
        vec3 apart = e0 * uFrom.x + e1 * uFrom.y + e2 * uFrom.z + e3 * uFrom.w;
        vec3 a = position * uFromStart + mix(whole, apart, uFromPose);
        vec3 b = c0 * uTo.x + c1 * uTo.y + c2 * uTo.z + c3 * uTo.w;
        float t = clamp((uMorph - seed * 0.45) / 0.55, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 p = mix(a, b, t);
        // The burst: each point flies outward from the centre, swirls and spreads in height, then settles onto the
        // next machine. It glows hot as it leaves and cools to ice as it lands.
        float fly = sin(t * 3.14159);
        vec3 dir = normalize(vec3(p.x, p.y * 0.6, p.z) + vec3(seed - 0.5, 0.0, 0.5 - seed) * 0.02);
        p += dir * fly * (0.8 + seed * 2.4);
        float ang = fly * (1.6 + seed * 2.8);
        p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
        p.y += fly * (seed - 0.5) * 2.6;
        p += 0.006 * vec3(sin(uTime * 2.0 + seed * 40.0), cos(uTime * 1.7 + seed * 31.0), sin(uTime * 2.3 + seed * 17.0)) * (1.0 - fly);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(uSize * uPix * (6.0 / -mv.z), uSize * uPix * 3.0); // capped: the burst brings points close
        float above = p.y - uScan;
        vAlpha = step(0.0, above) * (0.35 + 0.65 * seed);
        vHot = max(exp(-abs(above) * uHotK), fly * (1.0 - t) * 0.8);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uHot; varying float vAlpha; varying float vHot;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = dot(c, c);
        if (r > 0.25) discard;
        float soft = smoothstep(0.25, 0.0, r);
        vec3 col = mix(vec3(0.72, 0.82, 0.9), uHot * 1.8, vHot);
        gl_FragColor = vec4(col, soft * vAlpha * (0.55 + vHot));
      }`,
  });
  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  scene.add(cloud);

  const ring = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.0, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a2b).multiplyScalar(3), side: THREE.DoubleSide, transparent: true, opacity: 0.9, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 2, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.45, 1.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let w = 0;
  let h = 0;
  const resize = () => {
    w = o.canvas.clientWidth;
    h = o.canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    // Bloom is soft by nature: half resolution looks the same and costs a quarter.
    const pr = renderer.getPixelRatio();
    bloom.setSize(Math.round((w * pr) / 2), Math.round((h * pr) / 2));
    camera.aspect = w / h;
    // Centre the models in the clear space above the project text, not the geometric middle of the screen.
    camera.setViewOffset(w, h, 0, h * 0.1, w, h);
    camera.updateProjectionMatrix();
    uniforms.uPix.value = renderer.getPixelRatio() * (h / 900);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(o.canvas);
  resize();

  // Compile every solid's shaders before the first frame, so no project stalls the first time it appears.
  camera.position.set(0, 2.6, 7.4);
  camera.lookAt(0, 0, 0);
  await renderer.compileAsync(scene, camera).catch(() => {});
  // Then draw one frame with everything showing: that uploads every model's geometry to the GPU now, instead of on
  // the frame where each project first appears (measured: 80-220 ms hitches without it).
  clip.constant = 1e4;
  composer.render();
  solids.forEach((s) => (s.root.visible = false));

  // Scroll timeline: one segment per model, weighted (an assembly that comes apart gets a longer one). Within a
  // segment: 0-MORPH the cloud re-forms; MORPH-SCAN the scan resolves it; after that it is solid, and an assembly
  // comes apart between EXPLODE[0] and EXPLODE[1], then holds apart to the end of its segment.
  const at = segments(o.models.map((m) => m.weight ?? 1));
  const unit = (k: number) => new THREE.Vector4(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0, k === 3 ? 1 : 0);
  // fromPose: how far apart the outgoing machine was. Scrolling, an assembly always leaves fully apart (its explode
  // ends before its segment does), so the burst starts from the parts where they hang.
  const setPair = (from: number, to: number, fromPose = solids[from]?.clip ? 1 : 0) => {
    uniforms.uFromStart.value = from < 0 ? 1 : 0;
    uniforms.uFromPose.value = fromPose;
    uniforms.uFrom.value.copy(from < 0 ? new THREE.Vector4() : unit(from));
    uniforms.uTo.value.copy(unit(to));
  };
  let shown = -1; // the model the cloud is currently heading to
  let shownPhase = "";
  let eased = o.progress();
  let cam = eased; // the camera's own, slower easing, so a jump becomes a sweep
  // A long jump (a clicked target, the Index link, a dragged scrollbar) plays one direct re-form from the current
  // machine to the destination instead of racing through every segment in between.
  let jump: { from: number; to: number; t: number; pose: number } | null = null;
  let held = false;
  let heldAt = 0;
  const JUMP_MORPH = 1.1; // seconds re-forming, then the scan
  const JUMP = 1.8;
  let raf = 0;
  let clock = 0;
  let last = performance.now();
  let yaw = 0;
  let dist = 7.4;
  // The pointer leans the camera a little (fine pointers only), like turning your head at a bench.
  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    lean.tx = (e.clientX / innerWidth) * 2 - 1;
    lean.ty = (e.clientY / innerHeight) * 2 - 1;
  };
  if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", onPointer, { passive: true });
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = o.motion();
    if (moving) clock += dt;
    // Held (a smooth scroll to the Index is running): the scene keeps its place instead of following the scroll.
    const goal = held ? heldAt : Math.min(0.9999, o.progress());
    if (!jump && moving && Math.abs(goal - eased) > 0.12 && at(goal).i !== at(eased).i) jump = { from: shown, to: at(goal).i, t: 0, pose: Math.max(0, solids[shown]?.pose ?? 0) };
    let i: number;
    let f: number;
    let scanT: number;
    let morph: number;
    if (jump && jump.t + dt < JUMP) {
      jump.t += dt;
      i = jump.to;
      if (shown !== -2) setPair(jump.from, jump.to, jump.pose);
      shown = -2; // the pair stays pinned for the whole jump
      morph = clamp01(jump.t / JUMP_MORPH);
      scanT = smooth((jump.t - JUMP_MORPH) / (JUMP - JUMP_MORPH));
      f = jump.t < JUMP_MORPH ? morph * MORPH * 0.999 : MORPH + scanT * (SCAN - MORPH) * 0.999;
    } else {
      if (jump) {
        // The jump has landed: hand back to the scroll position, already re-formed.
        jump = null;
        eased = goal;
        shown = -3;
      }
      // Ease toward the scroll position: a wheel step becomes a short glide (about 0.25 s to settle).
      eased = moving ? eased + (goal - eased) * (1 - Math.exp(-dt * 9)) : goal;
      ({ i, f } = at(eased));
      morph = clamp01(f / MORPH);
      scanT = smooth((f - MORPH) / (SCAN - MORPH));
    }
    if (!jump && i !== shown) {
      shown = i;
      setPair(i - 1, i);
    }
    cam = moving ? cam + (goal - cam) * (1 - Math.exp(-dt * (jump ? 2.5 : 9))) : goal;
    const solidT = clamp01((f - SCAN) / (1 - SCAN));
    uniforms.uMorph.value = morph * 1.45;
    uniforms.uTime.value = clock;
    const bottom = (solids[i]?.y0 ?? -SIZE * 0.5) - 0.01;
    const top = (solids[i]?.y1 ?? SIZE * 0.5) + 0.01;
    const scanY = f < MORPH ? bottom - 0.01 : bottom + (top - bottom) * scanT;
    uniforms.uScan.value = f < MORPH ? -10 : scanY; // re-forming: every point shows (the outgoing cloud may sit lower than this part)
    uniforms.uHotK.value = Math.max(9, (9 * SIZE * 0.5) / Math.max(0.05, top - bottom));
    // Once the scan is complete the plane lets go, so exploded parts above the scan height stay whole.
    clip.constant = scanT >= 0.999 ? 1e4 : scanY;
    ring.position.y = scanY;
    (ring.material as THREE.MeshBasicMaterial).opacity = f > MORPH - 0.02 && scanT < 0.999 ? 0.9 : 0;
    solids.forEach((s, k) => {
      s.root.visible = k === i && f > MORPH - 0.02;
      if (!s.action || !s.clip || !s.mixer) return;
      const pose = k === i && !jump ? smooth((solidT - EXPLODE[0]) / (EXPLODE[1] - EXPLODE[0])) : 0;
      if (Math.abs(pose - s.pose) < 1e-4) return; // pose only when it changes
      s.pose = pose;
      s.action.time = s.clip.duration * 0.999 * pose;
      s.mixer.update(0);
    });
    yaw += moving ? dt * 0.12 : 0;
    if (moving) {
      lean.x += (lean.tx - lean.x) * (1 - Math.exp(-dt * 3));
      lean.y += (lean.ty - lean.y) * (1 - Math.exp(-dt * 3));
    }
    const s = solids[i];
    const pose = s && s.pose > 0 ? s.pose : 0;
    // Keep the active assembly centred: shift it by its interpolated centre as the parts spread.
    if (s) s.root.position.copy(s.c0).lerp(s.c1, pose).negate();
    grid.position.y = s ? s.floor0 + (s.floor1 - s.floor0) * pose - 0.06 : -SIZE * 0.42; // the floor stays under the lowest part
    // Fit: the camera distance that holds the current bounding sphere inside the clear part of the screen (between
    // the side panels on wide screens, above the readout on narrow ones), eased so a change of model glides.
    const r = s ? s.r0 + (s.r1 - s.r0) * pose : SIZE * 0.6;
    const vf = (camera.fov * Math.PI) / 360;
    const wide = camera.aspect > 1.1;
    const hf = Math.atan(Math.tan(vf) * camera.aspect * (wide ? 0.56 : 1));
    const fit = (r / Math.sin(Math.min(Math.atan(Math.tan(vf) * (wide ? 0.74 : 0.6)), hf))) * (wide ? 1.04 : 1.14);
    dist = moving ? dist + (fit - dist) * (1 - Math.exp(-dt * 5)) : fit;
    // Fog follows the camera, so a far framing (a long assembly apart, a narrow screen) never fogs the model out.
    (scene.fog as THREE.Fog).near = dist + 1.5;
    (scene.fog as THREE.Fog).far = dist + 14;
    // Orbit with scroll. While an assembly is solid the camera leans side-on to its long axis (the nearer side), so
    // the parts spread across the frame, but it keeps turning with the scroll the whole time.
    const orbit = yaw + cam * Math.PI * 1.5 + 0.6;
    const side = s?.clip && !jump ? smooth(solidT / 0.25) * 0.85 : 0;
    const near = s ? s.broad + Math.PI * Math.round((orbit - s.broad) / Math.PI) : orbit;
    const a = orbit + (near + (solidT - 0.5) * 0.8 - orbit) * side - lean.x * 0.14;
    const el = 0.3 + ((s?.el ?? 0.3) - 0.3) * side + lean.y * 0.07; // steady (the model never sinks or rises), give or take the lean
    camera.position.set(Math.sin(a) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(a) * Math.cos(el) * dist);
    camera.lookAt(0, 0, 0);
    // The room's reflections turn with the camera too, so a flat metal top never mirrors a bright panel into the lens
    // at some angle and not others (tested: this turn keeps every panel out of the flat tops' reflection).
    rig.rotation.y = a;
    scene.environmentRotation.y = a;
    const phase = f < MORPH ? "morph" : f < SCAN ? "scan" : "solid";
    if (`${i}${phase}` !== shownPhase) {
      shownPhase = `${i}${phase}`;
      o.onFrame({ index: i, phase });
    }
    o.onTick(phase === "morph" ? 0 : phase === "scan" ? scanT : 1, s?.clip && !jump ? pose : 0);
    composer.render();
  };
  raf = requestAnimationFrame(tick);

  return {
    /** Freeze on the current state (true); on release, take up the scroll position directly, with no re-form. */
    hold(on: boolean) {
      held = on;
      heldAt = Math.min(0.9999, o.progress()); // where the visitor was, not where the easing had got to
      if (on) return;
      jump = null;
      eased = cam = Math.min(0.9999, o.progress());
      shown = -3;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("pointermove", onPointer);
      // Free every GPU resource the scene made, then the context itself (a remount must not stack contexts).
      scene.traverse((n) => {
        const m = n as THREE.Mesh;
        m.geometry?.dispose();
        (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []).forEach((x) => x.dispose());
      });
      scene.environment?.dispose();
      composer.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
