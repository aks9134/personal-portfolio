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
import { clamp01, loadModel, smooth } from "../load";

const SIZE = 3.2;
const MAX = 4; // the shader carries up to four clouds

export type Spec = { src?: string; build?: "canceller"; finish: "aluminium" | "anodized" | "own"; parts: number };
export type Measure = { x: number; y: number; z: number; parts: number };
export type ConsoleFrame = { index: number; phase: "morph" | "scan" | "solid" };

export async function createConsole(o: {
  canvas: HTMLCanvasElement;
  models: Spec[];
  motion: () => boolean;
  progress: () => number;
  onFrame: (f: ConsoleFrame) => void;
  onTick: (scan: number) => void;
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
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0xff6a2b, 1.6);
  rim.position.set(-4, 2, -3);
  scene.add(key, rim);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);

  const grid = new THREE.GridHelper(40, 80, 0x1d2a33, 0x111a20);
  grid.position.y = -SIZE * 0.42;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.7;
  scene.add(grid);

  const loaded = await Promise.all(o.models.map((m) => (m.build === "canceller" ? Promise.resolve(buildCanceller()) : loadModel(m.src!))));
  const measures: Measure[] = [];
  const clouds: Float32Array[] = [];
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const solids: { root: THREE.Group; mixer: THREE.AnimationMixer | null; action: THREE.AnimationAction | null; clip: THREE.AnimationClip | null; pose: number }[] = [];

  loaded.forEach((l, i) => {
    const model = l.scene;
    model.updateMatrixWorld(true);
    const raw = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    let meshes = 0;
    model.traverse((n) => (meshes += (n as THREE.Mesh).isMesh ? 1 : 0));
    measures.push({ x: raw.x, y: raw.y, z: raw.z, parts: o.models[i].parts || meshes });
    const s = SIZE / Math.max(raw.x, raw.y, raw.z);
    const holder = new THREE.Group();
    holder.add(model);
    model.scale.multiplyScalar(s);
    model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
    holder.updateMatrixWorld(true);
    // Sample the surfaces: every mesh merged into one position-only geometry in holder space.
    const geos: THREE.BufferGeometry[] = [];
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const p = m.geometry.attributes.position;
      const arr = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) arr.set([p.getX(k), p.getY(k), p.getZ(k)], k * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      if (m.geometry.index) g.setIndex(m.geometry.index.clone());
      g.applyMatrix4(m.matrixWorld);
      geos.push(g.index ? g.toNonIndexed() : g);
    });
    const merged = mergeGeometries(geos);
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
    const pts = new Float32Array(N * 3);
    const v = new THREE.Vector3();
    for (let k = 0; k < N; k++) {
      sampler.sample(v);
      pts.set([v.x, v.y, v.z], k * 3);
    }
    clouds.push(pts);
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
    const mixer = l.clip ? new THREE.AnimationMixer(model) : null;
    const action = l.clip && mixer ? mixer.clipAction(l.clip).play() : null;
    if (action) action.paused = true;
    solids.push({ root: holder, mixer, action, clip: l.clip, pose: -1 });
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
  for (let k = 0; k < MAX; k++) geo.setAttribute(`c${k}`, new THREE.BufferAttribute(clouds[k] ?? clouds[clouds.length - 1], 3));
  const seed = new Float32Array(N);
  for (let k = 0; k < N; k++) seed[k] = Math.random();
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uFromStart: { value: 1 },
    uFrom: { value: new THREE.Vector4() },
    uTo: { value: new THREE.Vector4(1, 0, 0, 0) },
    uMorph: { value: 0 },
    uScan: { value: -10 },
    uTime: { value: 0 },
    uSize: { value: 2.4 },
    uPix: { value: 1 },
    uHot: { value: new THREE.Color(0xff6a2b) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 c0, c1, c2, c3; attribute float seed;
      uniform float uFromStart, uMorph, uScan, uTime, uSize, uPix; uniform vec4 uFrom, uTo;
      varying float vAlpha; varying float vHot;
      void main() {
        vec3 a = position * uFromStart + c0 * uFrom.x + c1 * uFrom.y + c2 * uFrom.z + c3 * uFrom.w;
        vec3 b = c0 * uTo.x + c1 * uTo.y + c2 * uTo.z + c3 * uTo.w;
        float t = clamp((uMorph - seed * 0.45) / 0.55, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 p = mix(a, b, t);
        float fly = sin(t * 3.14159);
        float ang = fly * (1.2 + seed * 2.0);
        p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
        p.y += fly * (seed - 0.5) * 1.6;
        p += 0.006 * vec3(sin(uTime * 2.0 + seed * 40.0), cos(uTime * 1.7 + seed * 31.0), sin(uTime * 2.3 + seed * 17.0)) * (1.0 - fly);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPix * (6.0 / -mv.z);
        float above = p.y - uScan;
        vAlpha = step(0.0, above) * (0.35 + 0.65 * seed);
        vHot = exp(-abs(above) * 9.0);
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
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.45, 1.25);
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

  // Scroll timeline: one segment per model. 0-0.32 the cloud re-forms; 0.32-0.72 the scan resolves it; 0.72-1 it
  // holds as a solid and comes apart if it has an explode clip.
  const M = clouds.length;
  const unit = (k: number) => new THREE.Vector4(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0, k === 3 ? 1 : 0);
  let shown = -1;
  let shownPhase = "";
  let eased = o.progress();
  let raf = 0;
  let clock = 0;
  let last = performance.now();
  let yaw = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = o.motion();
    if (moving) clock += dt;
    // Ease toward the scroll position: a wheel step becomes a short glide (about 0.25 s to settle).
    const goal = Math.min(0.9999, o.progress());
    eased = moving ? eased + (goal - eased) * (1 - Math.exp(-dt * 9)) : goal;
    const q = eased * M;
    const i = Math.min(M - 1, Math.floor(q));
    const f = q - i;
    if (i !== shown) {
      shown = i;
      uniforms.uFromStart.value = i === 0 ? 1 : 0;
      uniforms.uFrom.value.copy(i === 0 ? new THREE.Vector4() : unit(i - 1));
      uniforms.uTo.value.copy(unit(i));
    }
    const morph = clamp01(f / 0.32);
    const scanT = smooth((f - 0.32) / 0.4);
    const solidT = clamp01((f - 0.72) / 0.28);
    uniforms.uMorph.value = morph * 1.45;
    uniforms.uTime.value = clock;
    const bottom = -SIZE * 0.5;
    const top = SIZE * 0.5;
    const scanY = f < 0.32 ? bottom - 0.01 : bottom + (top - bottom) * scanT;
    uniforms.uScan.value = scanY;
    // Once the scan is complete the plane lets go, so exploded parts above the scan height stay whole.
    clip.constant = scanT >= 0.999 ? 1e4 : scanY;
    ring.position.y = scanY;
    (ring.material as THREE.MeshBasicMaterial).opacity = f > 0.3 && scanT < 0.999 ? 0.9 : 0;
    solids.forEach((s, k) => {
      s.root.visible = k === i && f > 0.3;
      if (!s.action || !s.clip || !s.mixer) return;
      const pose = k === i ? smooth((solidT - 0.15) / 0.75) : 0;
      if (Math.abs(pose - s.pose) < 1e-4) return; // pose only when it changes
      s.pose = pose;
      s.action.time = s.clip.duration * 0.999 * pose;
      s.mixer.update(0);
    });
    yaw += moving ? dt * 0.12 : 0;
    const a = yaw + eased * Math.PI * 1.5 + 0.6;
    const back = 7.4 + (solids[i]?.pose > 0 ? solids[i].pose * 2.6 : 0); // pull back as an assembly comes apart
    camera.position.set(Math.sin(a) * back, 2.6 + Math.sin(eased * 6) * 0.4 + (back - 7.4) * 0.35, Math.cos(a) * back);
    camera.lookAt(0, (back - 7.4) * 0.45, 0);
    const phase = f < 0.32 ? "morph" : f < 0.72 ? "scan" : "solid";
    if (`${i}${phase}` !== shownPhase) {
      shownPhase = `${i}${phase}`;
      o.onFrame({ index: i, phase });
    }
    o.onTick(phase === "morph" ? 0 : phase === "scan" ? scanT : 1);
    composer.render();
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
