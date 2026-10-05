// Direction B, "Console": scan to solid. Each model exists twice: as a point cloud sampled from its real surfaces, and
// as the solid part. Scrolling into a project re-forms the cloud from the previous machine into this one; then a scan
// plane sweeps upward, and below it the cloud becomes the solid (a clipping plane on the solid, a discard in the
// points shader). The geared module also comes apart once it is solid.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { applyFinish } from "../../stage/engine";
import { clamp01, loadModel, smooth } from "../load";

const N = 70000;
const SIZE = 3.2;

export type Spec = { src: string; finish: "aluminium" | "anodized"; parts: number };
export type Measure = { x: number; y: number; z: number; parts: number };
export type ConsoleFrame = { index: number; phase: "morph" | "scan" | "solid"; local: number; scan: number };

export async function createConsole(o: { canvas: HTMLCanvasElement; models: Spec[]; motion: () => boolean; onFrame: (f: ConsoleFrame) => void; onMeasure: (m: Measure[]) => void }) {
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
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

  // Floor grid: fine lines that fade out with distance.
  const grid = new THREE.GridHelper(40, 80, 0x1d2a33, 0x111a20);
  grid.position.y = -SIZE * 0.42;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.7;
  scene.add(grid);

  const loaded = await Promise.all(o.models.map((m) => loadModel(m.src)));
  const measures: Measure[] = [];
  const clouds: Float32Array[] = [];
  const solids: { root: THREE.Group; model: THREE.Object3D; mixer: THREE.AnimationMixer | null; action: THREE.AnimationAction | null; clip: THREE.AnimationClip | null }[] = [];
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

  loaded.forEach((l, i) => {
    const model = l.scene;
    model.updateMatrixWorld(true);
    // Real dimensions straight from the CAD (millimetres), before any scaling.
    const raw = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    let parts = 0;
    model.traverse((n) => (parts += (n as THREE.Mesh).isMesh ? 1 : 0));
    measures.push({ x: raw.x, y: raw.y, z: raw.z, parts: o.models[i].parts || parts });
    // Normalise: centre on the origin, largest dimension SIZE.
    const s = SIZE / Math.max(raw.x, raw.y, raw.z);
    const holder = new THREE.Group();
    holder.add(model);
    model.scale.multiplyScalar(s);
    const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    model.position.sub(c);
    holder.updateMatrixWorld(true);
    // Sample the surfaces: merge every mesh into one position-only geometry in holder space.
    const geos: THREE.BufferGeometry[] = [];
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const g = new THREE.BufferGeometry();
      const p = m.geometry.attributes.position;
      const arr = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) {
        arr[k * 3] = p.getX(k);
        arr[k * 3 + 1] = p.getY(k);
        arr[k * 3 + 2] = p.getZ(k);
      }
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

    applyFinish(THREE, model, o.models[i].finish, true);
    model.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = (m.material as THREE.Material).clone();
      mat.clippingPlanes = [clip];
      m.material = mat;
    });
    holder.visible = false;
    scene.add(holder);
    const mixer = l.clip ? new THREE.AnimationMixer(model) : null;
    const action = l.clip && mixer ? mixer.clipAction(l.clip).play() : null;
    if (action) action.paused = true;
    solids.push({ root: holder, model, mixer, action, clip: l.clip });
  });
  o.onMeasure(measures);

  // The cloud: one Points object; attribute a = where it comes from, b = where it is going.
  const start = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    const r = 6 + Math.random() * 6;
    const t = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 8;
    start.set([Math.cos(t) * r, y, Math.sin(t) * r], k * 3);
  }
  const geo = new THREE.BufferGeometry();
  const aAttr = new THREE.BufferAttribute(start.slice(), 3);
  const bAttr = new THREE.BufferAttribute(clouds[0].slice(), 3);
  geo.setAttribute("position", aAttr);
  geo.setAttribute("target", bAttr);
  const seed = new Float32Array(N);
  for (let k = 0; k < N; k++) seed[k] = Math.random();
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uMorph: { value: 0 },
    uScan: { value: -10 },
    uTime: { value: 0 },
    uSize: { value: 2.2 },
    uPix: { value: 1 },
    uHot: { value: new THREE.Color(0xff6a2b) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 target; attribute float seed;
      uniform float uMorph, uScan, uTime, uSize, uPix;
      varying float vAlpha; varying float vHot;
      void main() {
        float d = seed * 0.45;
        float t = clamp((uMorph - d) / 0.55, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 p = mix(position, target, t);
        // A swirl while in flight: rotate about the vertical axis and lift, strongest mid-flight.
        float fly = sin(t * 3.14159);
        float ang = fly * (1.2 + seed * 2.0);
        p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
        p.y += fly * (seed - 0.5) * 1.6;
        // Idle shimmer once settled.
        p += 0.006 * vec3(sin(uTime * 2.0 + seed * 40.0), cos(uTime * 1.7 + seed * 31.0), sin(uTime * 2.3 + seed * 17.0)) * (1.0 - fly);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPix * (6.0 / -mv.z);
        // Below the scan plane the solid has taken over: hide the points there. Near the plane they flare.
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

  // The scan ring: a thin glowing disc edge at the plane height.
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.0, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a2b).multiplyScalar(3), side: THREE.DoubleSide, transparent: true, opacity: 0.9, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.45, 1.05));
  composer.addPass(new OutputPass());

  let w = 0;
  let h = 0;
  const resize = () => {
    w = o.canvas.clientWidth;
    h = o.canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPix.value = renderer.getPixelRatio() * (h / 900);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(o.canvas);
  resize();

  // Scroll timeline: one segment per model. 0-0.32 the cloud re-forms into this model; 0.32-0.72 the scan resolves it;
  // 0.72-1 it holds as a solid (the geared module comes apart here).
  const M = clouds.length;
  let progress = 0;
  let shown = -1; // which pair is loaded into the a/b attributes
  const load = (i: number) => {
    if (shown === i) return;
    shown = i;
    aAttr.array.set(i === 0 ? start : clouds[i - 1]);
    bAttr.array.set(clouds[i]);
    aAttr.needsUpdate = bAttr.needsUpdate = true;
  };
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
    const q = progress * M;
    const i = Math.min(M - 1, Math.floor(q));
    const f = q - i;
    load(i);
    const morph = clamp01(f / 0.32);
    const scanT = smooth((f - 0.32) / 0.4);
    const solidT = clamp01((f - 0.72) / 0.28);
    uniforms.uMorph.value = morph * 1.45;
    uniforms.uTime.value = clock;
    const bottom = -SIZE * 0.5;
    const top = SIZE * 0.5;
    const scanY = f < 0.32 ? bottom - 0.01 : bottom + (top - bottom) * scanT;
    uniforms.uScan.value = scanY;
    clip.constant = scanY; // solid shows where y < scanY
    ring.position.y = scanY;
    (ring.material as THREE.MeshBasicMaterial).opacity = f > 0.3 && scanT < 0.999 ? 0.9 : 0;
    solids.forEach((s, k) => {
      s.root.visible = k === i && f > 0.3;
      if (s.action && s.clip && s.mixer) {
        s.action.time = s.clip.duration * 0.999 * (k === i ? smooth((solidT - 0.15) / 0.75) : 0);
        s.mixer.update(0);
      }
    });
    // Camera: a slow orbit (time when motion is allowed) plus a turn tied to scroll.
    yaw += moving ? dt * 0.12 : 0;
    const a = yaw + progress * Math.PI * 1.5 + 0.6;
    const r = 7.4;
    camera.position.set(Math.sin(a) * r, 2.6 + Math.sin(progress * 6) * 0.4, Math.cos(a) * r);
    camera.lookAt(0, 0, 0);
    o.onFrame({ index: i, phase: f < 0.32 ? "morph" : f < 0.72 ? "scan" : "solid", local: f, scan: scanT });
    composer.render();
  };
  raf = requestAnimationFrame(tick);

  return {
    setProgress(p: number) {
      progress = Math.min(0.9999, p);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
