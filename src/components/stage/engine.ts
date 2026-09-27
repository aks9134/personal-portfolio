// The 3D stage: one self-hosted three.js scene per canvas, for Allen's CAD exports (meshopt GLBs from
// scripts/media). Framework-free so any component can drive it: set the explode amount, turn the camera, switch the
// render mode, and it draws only when something changed. three.js and the loaders are imported on first use, off
// the critical path. The canvas carries its state as data attributes (data-ready, data-explode, data-theta) for tests.
import type * as T from "three";

export type Finish = "aluminium" | "anodized";
export type Mode = "solid" | "edges" | "xray";

export type StageOptions = {
  src: string;
  /** Camera angles in degrees, model-viewer's convention: theta around the vertical axis, phi down from the top. */
  theta?: number;
  phi?: number;
  /** Distance as a share of the fitted distance; below 1 pulls in. */
  frame?: number;
  finish?: Finish;
  exposure?: number;
  /** Drag to turn (zoom and pan stay off, so the page scroll is never trapped) and arrow keys on the focused canvas. */
  drag?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  /** The GPU dropped the context (memory pressure on phones): the caller shows its poster again. */
  onLost?: () => void;
};

export type Stage = {
  /** 0 = assembled, 1 = fully apart; the framing follows, so the model fills the view at both ends. */
  setExplode: (p: number) => void;
  setAngles: (theta: number, phi?: number) => void;
  /** A turn made by the visitor (buttons): moves the camera and fires "stage:turn" on the canvas, like a drag does. */
  turnBy: (dTheta: number, dPhi?: number) => void;
  /** Solid shading, feature edges only (like a line drawing), or see-through with edges. */
  setMode: (mode: Mode, line: string) => void;
  angles: () => { theta: number; phi: number };
  dispose: () => void;
};

const deg = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const PHI = [20, 95] as const; // how far the camera may tilt: never straight down, never below the floor

export async function createStage(canvas: HTMLCanvasElement, o: StageOptions): Promise<Stage> {
  const THREE = await import("three");
  const [{ GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);

  // Load before creating the renderer, so a failed download never leaves a GPU context behind.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(o.src, o.onProgress && ((e) => o.onProgress!(e.loaded, e.total)));

  // Phones: standard materials and a lower pixel ratio. Desktop: physical materials at up to 2x.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "default" });
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 4, 3);
  const rim = new THREE.DirectionalLight(0xffe2cc, 0.9);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(key, rim, new THREE.HemisphereLight(0xe6ebf0, 0x202226, 0.35));
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);

  const model = gltf.scene;
  const replaced = applyFinish(THREE, model, o.finish ?? "aluminium", !coarse);
  scene.add(model);

  const clip = gltf.animations.find((a) => a.name === "explode");
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  if (mixer && clip) {
    const action = mixer.clipAction(clip);
    action.play();
    action.paused = true;
  }
  const at = (p: number) => clip && mixer?.setTime(clip.duration * 0.999 * clamp(p, 0, 1));

  // Framing: the bounding spheres of the assembled and the fully exploded pose. The camera distance blends between
  // them as the parts spread, centred on the exploded pose so nothing drifts out of view.
  const sphereOf = (p: number) => {
    at(p);
    return new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
  };
  const apart = sphereOf(1);
  const together = clip ? sphereOf(0) : apart;
  model.position.sub(apart.center);

  let explode = 0;
  let aspect = 1;
  let fit = 1;
  const refit = () => {
    const v = (camera.fov * deg) / 2;
    const h = Math.atan(Math.tan(v) * aspect);
    const r = together.radius + (apart.radius - together.radius) * Math.min(1, explode * 1.4);
    fit = (r / Math.sin(Math.min(v, h))) * (o.frame ?? 1);
    camera.aspect = aspect;
    camera.near = apart.radius / 50;
    camera.far = fit * 10;
    camera.updateProjectionMatrix();
  };

  const meshes: T.Mesh[] = [];
  model.traverse((n) => {
    if ((n as T.Mesh).isMesh) meshes.push(n as T.Mesh);
  });

  let theta = o.theta ?? 40;
  let phi = o.phi ?? 65;
  let size = { w: canvas.clientWidth, h: canvas.clientHeight };
  let dirty = true;
  let raf = 0;
  let lost = false;
  const draw = () => {
    raf = 0;
    if (!dirty || lost || !size.w || !size.h) return;
    dirty = false;
    const pr = renderer.getPixelRatio();
    // three's setSize floors the drawing buffer, so compare floored values or every frame would resize.
    if (canvas.width !== Math.floor(size.w * pr) || canvas.height !== Math.floor(size.h * pr) || aspect !== size.w / size.h) {
      renderer.setSize(size.w, size.h, false);
      aspect = size.w / size.h;
    }
    refit();
    const t = theta * deg;
    const p = phi * deg;
    camera.position.set(fit * Math.sin(p) * Math.sin(t), fit * Math.cos(p), fit * Math.sin(p) * Math.cos(t));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    const e = explode.toFixed(3);
    const th = theta.toFixed(1);
    if (canvas.dataset.explode !== e) canvas.dataset.explode = e;
    if (canvas.dataset.theta !== th) canvas.dataset.theta = th;
  };
  const render = () => {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(draw);
  };
  const ro = new ResizeObserver(([entry]) => {
    size = { w: entry.contentRect.width, h: entry.contentRect.height };
    render();
  });
  ro.observe(canvas);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    delete canvas.dataset.ready;
    o.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  // Every turn the visitor makes (drag, arrow keys, Turn buttons) goes through here and announces itself, so a
  // caller that also moves the camera (the hero's scroll turn) can carry on from where the visitor left it.
  const turn = (dt: number, dp = 0) => {
    theta += dt;
    phi = clamp(phi + dp, PHI[0], PHI[1]);
    render();
    canvas.dispatchEvent(new Event("stage:turn"));
  };

  // Drag: horizontal orbits, vertical tilts a little. Pointer capture keeps the drag alive outside the canvas;
  // touch-action pan-y on the canvas keeps vertical page scroll working on phones.
  const offs: (() => void)[] = [];
  if (o.drag) {
    let last: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (last) return; // one pointer at a time: a second finger never makes the model jump
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!last || e.pointerId !== last.id) return;
      turn(-(e.clientX - last.x) * 0.4, -(e.clientY - last.y) * 0.2);
      last = { ...last, x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      if (last?.id === e.pointerId) last = null;
    };
    const keys = (e: KeyboardEvent) => {
      const k = ({ ArrowLeft: [15, 0], ArrowRight: [-15, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] } as Record<string, [number, number]>)[e.key];
      if (!k) return;
      e.preventDefault();
      turn(...k);
    };
    const pairs: [string, EventListener][] = [
      ["pointerdown", down as EventListener],
      ["pointermove", move as EventListener],
      ["pointerup", up as EventListener],
      ["pointercancel", up as EventListener],
      ["keydown", keys as EventListener],
    ];
    pairs.forEach(([k, f]) => canvas.addEventListener(k, f));
    offs.push(() => pairs.forEach(([k, f]) => canvas.removeEventListener(k, f)));
  }

  // Render modes. Feature edges (creases over 30 degrees) are built the first time they are asked for and kept.
  const solid = new Map(meshes.map((m) => [m, m.material as T.Material]));
  let edges: T.LineSegments[] | null = null;
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const ghost = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false });
  const occluder = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const setMode = (mode: Mode, line: string) => {
    lineMat.color.set(line);
    ghost.color.set(line);
    if (mode !== "solid" && !edges) {
      edges = meshes.map((m) => {
        const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), lineMat);
        m.add(l);
        return l;
      });
    }
    edges?.forEach((l) => (l.visible = mode !== "solid"));
    // Edges: the solids still fill the depth buffer but draw no colour, so hidden lines drop out like a drawing.
    // X-ray: the solids turn to faint glass (normal blending, no glow) and every edge shows through.
    for (const m of meshes) m.material = mode === "solid" ? solid.get(m)! : mode === "edges" ? occluder : ghost;
    render();
  };

  // Compile shaders asynchronously where the browser allows it, then show the first frame.
  await renderer.compileAsync(scene, camera).catch(() => {});
  render();
  canvas.dataset.ready = "";

  return {
    setExplode(p) {
      explode = p;
      at(p);
      render();
    },
    setAngles(t, p) {
      theta = t;
      if (p !== undefined) phi = p;
      render();
    },
    turnBy: turn,
    setMode,
    angles: () => ({ theta, phi }),
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      offs.forEach((f) => f());
      canvas.removeEventListener("webglcontextlost", onLost);
      mixer?.stopAllAction();
      scene.traverse((n) => {
        if ((n as T.Mesh).isMesh || (n as T.LineSegments).isLineSegments) (n as T.Mesh).geometry.dispose();
      });
      new Set(solid.values()).forEach((x) => x.dispose());
      replaced.forEach((x) => x.dispose());
      [lineMat, ghost, occluder, env].forEach((x) => x.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      delete canvas.dataset.ready;
    },
  };
}

// Finishes. "aluminium" repaints every part as machined aluminium, keeping each part's lightness so the assembly
// still reads part by part. "anodized" keeps the CAD's colour grouping in the bay's palette: grey parts machined
// aluminium, blues dark anodized grey, greens oxide, warm colours sodium amber. Returns the export's own materials,
// which the stage no longer uses, so they can be freed.
function applyFinish(THREE: typeof import("three"), root: T.Object3D, finish: Finish, physical: boolean): T.Material[] {
  const cache = new Map<T.Material, T.Material>();
  const paint = (mat: T.MeshStandardMaterial, h: number, s: number, l: number, metalness: number, roughness: number) => {
    mat.color.setHSL(h, s, l);
    mat.metalness = metalness;
    mat.roughness = roughness;
  };
  root.traverse((n) => {
    const m = n as T.Mesh;
    if (!m.isMesh) return;
    const src = m.material as T.MeshStandardMaterial;
    let out = cache.get(src);
    if (!out) {
      const { h, s, l } = src.color.getHSL({ h: 0, s: 0, l: 0 });
      const base = { map: src.map, vertexColors: src.vertexColors };
      const mat = physical ? new THREE.MeshPhysicalMaterial({ ...base, clearcoat: 0.25, clearcoatRoughness: 0.5 }) : new THREE.MeshStandardMaterial(base);
      if (finish === "aluminium") paint(mat, 0.58, 0.03, 0.5 + l * 0.3, 0.85, 0.32);
      else if (s < 0.15) paint(mat, 0.58, 0.03, 0.42 + l * 0.35, 0.85, 0.34);
      else if (h > 0.45 && h < 0.8) paint(mat, 0.6, 0.05, 0.085, 0.45, 0.42);
      else if (h > 0.2) paint(mat, 0.08, 0.35, 0.32, 0.5, 0.5);
      else paint(mat, 0.085, 0.9, 0.4, 0.25, 0.4);
      out = mat;
      cache.set(src, out);
    }
    m.material = out;
  });
  return [...cache.keys()];
}

/** "60deg 65deg auto" (a media.json orbit) to degrees. */
export function parseOrbit(s?: string, fallback = { theta: 40, phi: 65 }) {
  const [t, p] = (s ?? "").split(/\s+/).map((x) => parseFloat(x));
  return { theta: Number.isFinite(t) ? t : fallback.theta, phi: Number.isFinite(p) ? p : fallback.phi };
}

// A CSS custom property (any colour syntax, oklch included) as "#rrggbb" for three.js, through one reused 1 px canvas.
let probe: CanvasRenderingContext2D | null = null;
export function cssColor(el: Element, prop: string, fallback = "#e8e3d6") {
  const v = getComputedStyle(el).getPropertyValue(prop).trim();
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!v || !probe) return fallback;
  probe.fillStyle = v;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
