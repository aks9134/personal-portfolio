// The 3D stage: one self-hosted three.js scene per canvas, for Allen's CAD exports (meshopt GLBs from
// scripts/media). Framework-free so any component can drive it: set the explode amount, turn the camera, switch the
// render mode, and it draws only when something changed. three.js and the loaders are imported on first use, off
// the critical path. The canvas carries its state as data attributes (data-ready, data-explode, data-theta) for tests.
import type * as T from "three";

export type Finish = "cad" | "graphite" | "aluminium" | "anodized";
export type Mode = "solid" | "edges" | "xray";

export type StageOptions = {
  src: string;
  /** Camera angles in degrees, model-viewer's convention: theta around the vertical axis, phi down from the top. */
  theta?: number;
  phi?: number;
  /** Distance as a share of the auto framing; below 1 pulls in. */
  frame?: number;
  finish?: Finish;
  exposure?: number;
  /** Frame the camera on the exploded pose (long assemblies grow a lot). */
  frameExploded?: boolean;
  /** Drag to turn (zoom and pan stay off, so the page scroll is never trapped) and arrow keys on the focused canvas. */
  drag?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  /** The GPU dropped the context (memory pressure on phones): the caller shows its poster again. */
  onLost?: () => void;
};

export type Stage = {
  /** 0 = assembled, 1 = fully apart. No-op for models without an "explode" clip. */
  setExplode: (p: number) => void;
  setAngles: (theta: number, phi?: number) => void;
  /** A turn made by the visitor (buttons): moves the camera and fires "stage:turn" on the canvas, like a drag does. */
  turnBy: (dTheta: number, dPhi?: number) => void;
  /** Camera distance as a share of the fitted distance (1 = the whole framed pose fits). */
  setZoom: (k: number) => void;
  /** Solid shading, feature edges only (like a line drawing), or see-through with edges. */
  setMode: (mode: Mode, line?: string) => void;
  angles: () => { theta: number; phi: number };
  hasExplode: boolean;
  parts: number;
  dispose: () => void;
};

const deg = Math.PI / 180;

export async function createStage(canvas: HTMLCanvasElement, o: StageOptions): Promise<Stage> {
  const THREE = await import("three");
  const [{ GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);

  // Load before creating the renderer, so a failed download never leaves a GPU context behind.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(o.src, (e) => o.onProgress?.(e.loaded, e.total));

  // Phones: standard materials, a lower pixel ratio, no clearcoat. Desktop: physical materials at up to 2x.
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
  const replaced = applyFinish(THREE, model, o.finish ?? "cad", !coarse);
  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);

  const clip = gltf.animations.find((a) => a.name === "explode");
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  if (mixer && clip) {
    const action = mixer.clipAction(clip);
    action.play();
    action.paused = true;
  }
  let explode = 0;
  const at = (p: number) => clip && mixer?.setTime(clip.duration * 0.999 * Math.min(1, Math.max(0, p)));

  // Frame: bounding sphere of the pose the camera must hold (exploded for long assemblies), centred on the pivot.
  at(o.frameExploded ? 1 : 0);
  const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
  at(0);
  model.position.sub(sphere.center);

  // Distance that fits the sphere in both directions; recomputed when the canvas changes shape.
  let fit = 1;
  const refit = () => {
    const v = (camera.fov * deg) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    fit = (sphere.radius / Math.sin(Math.min(v, h))) * (o.frame ?? 1);
    camera.near = fit / 50;
    camera.far = fit * 10;
    camera.updateProjectionMatrix();
  };
  refit();

  const meshes: T.Mesh[] = [];
  model.traverse((n) => {
    if ((n as T.Mesh).isMesh) meshes.push(n as T.Mesh);
  });

  let theta = o.theta ?? 40;
  let phi = o.phi ?? 65;
  let zoom = 1;
  let dirty = true;
  let raf = 0;
  let lost = false;
  const place = () => {
    const t = theta * deg;
    const p = phi * deg;
    const d = fit * zoom;
    camera.position.set(d * Math.sin(p) * Math.sin(t), d * Math.cos(p), d * Math.sin(p) * Math.cos(t));
    camera.lookAt(0, 0, 0);
  };
  const size = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const pr = renderer.getPixelRatio();
    // three's setSize floors the drawing buffer, so compare floored values or every frame would resize.
    if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      refit();
    }
  };
  const draw = () => {
    raf = 0;
    if (!dirty || lost) return;
    dirty = false;
    size();
    place();
    renderer.render(scene, camera);
    canvas.dataset.explode = explode.toFixed(3);
    canvas.dataset.theta = theta.toFixed(1);
  };
  const render = () => {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(draw);
  };
  const ro = new ResizeObserver(render);
  ro.observe(canvas);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    delete canvas.dataset.ready;
    o.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  // Drag turns (horizontal orbits, vertical tilts a little). Pointer capture keeps the drag alive outside the
  // canvas; touch-action pan-y on the canvas keeps vertical page scroll working on phones. Arrow keys do the same
  // for a focused canvas (the single-pointer alternative is the caller's Turn buttons).
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
      theta -= (e.clientX - last.x) * 0.4;
      phi = Math.min(95, Math.max(20, phi - (e.clientY - last.y) * 0.2));
      last = { ...last, x: e.clientX, y: e.clientY };
      render();
      canvas.dispatchEvent(new Event("stage:turn"));
    };
    const up = (e: PointerEvent) => {
      if (last?.id === e.pointerId) last = null;
    };
    const keys = (e: KeyboardEvent) => {
      const turn = ({ ArrowLeft: 15, ArrowRight: -15 } as Record<string, number>)[e.key];
      const tilt = ({ ArrowUp: -8, ArrowDown: 8 } as Record<string, number>)[e.key];
      if (turn === undefined && tilt === undefined) return;
      e.preventDefault();
      theta += turn ?? 0;
      phi = Math.min(95, Math.max(20, phi + (tilt ?? 0)));
      render();
      canvas.dispatchEvent(new Event("stage:turn"));
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
  const setMode = (mode: Mode, line = "#e8e3d6") => {
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
    hasExplode: Boolean(clip),
    parts: meshes.length,
    setExplode(p) {
      explode = p;
      at(p);
      render();
    },
    setZoom(k) {
      zoom = k;
      render();
    },
    setAngles(t, p) {
      theta = t;
      if (p !== undefined) phi = p;
      render();
    },
    turnBy(dt, dp = 0) {
      theta += dt;
      phi = Math.min(95, Math.max(20, phi + dp));
      render();
      canvas.dispatchEvent(new Event("stage:turn"));
    },
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

// Finishes: "cad" keeps the export's colours with a satin metal response; "graphite" and "aluminium" repaint every
// part in one material family, keeping each part's lightness so the assembly still reads part by part; "anodized"
// keeps the CAD's grouping but in the bay's palette: grey parts machined aluminium, blues dark anodized grey, warm
// colours sodium amber, greens oxide. Returns the export's own materials, which the stage no longer uses.
function applyFinish(THREE: typeof import("three"), root: T.Object3D, finish: Finish, physical: boolean): T.Material[] {
  const cache = new Map<T.Material, T.Material>();
  root.traverse((n) => {
    const m = n as T.Mesh;
    if (!m.isMesh) return;
    const src = m.material as T.MeshStandardMaterial;
    let out = cache.get(src);
    if (!out) {
      const { h, s: sat, l } = src.color.getHSL({ h: 0, s: 0, l: 0 });
      const base = { color: src.color.clone(), map: src.map, vertexColors: src.vertexColors, metalness: 0.45, roughness: 0.4 };
      const mat = physical ? new THREE.MeshPhysicalMaterial({ ...base, clearcoat: 0.25, clearcoatRoughness: 0.5 }) : new THREE.MeshStandardMaterial(base);
      if (finish === "graphite") {
        mat.color.setHSL(0.6, 0.04, 0.14 + l * 0.35);
        mat.metalness = 0.6;
        mat.roughness = 0.42;
      } else if (finish === "anodized") {
        if (sat < 0.15) mat.color.setHSL(0.58, 0.03, 0.42 + l * 0.35), (mat.metalness = 0.85), (mat.roughness = 0.34);
        else if (h > 0.45 && h < 0.8) mat.color.setHSL(0.6, 0.05, 0.085), (mat.metalness = 0.45), (mat.roughness = 0.42);
        else if (h > 0.2 && h <= 0.45) mat.color.setHSL(0.08, 0.35, 0.32), (mat.metalness = 0.5), (mat.roughness = 0.5);
        else mat.color.setHSL(0.085, 0.9, 0.4), (mat.metalness = 0.25), (mat.roughness = 0.4);
      } else if (finish === "aluminium") {
        mat.color.setHSL(0.58, 0.03, 0.5 + l * 0.3);
        mat.metalness = 0.85;
        mat.roughness = 0.32;
      }
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

/** A CSS custom property (any colour syntax, oklch included) as "#rrggbb" for three.js, via a 1 px canvas. */
export function cssColor(el: Element, prop: string, fallback = "#e8e3d6") {
  const v = getComputedStyle(el).getPropertyValue(prop).trim();
  if (!v) return fallback;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return fallback;
  c.fillStyle = v;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
