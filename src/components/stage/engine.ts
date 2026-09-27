// The 3D stage: one self-hosted three.js scene per canvas, for Allen's CAD exports (meshopt GLBs from
// scripts/media). Framework-free so any component can drive it: set the explode amount, turn the camera, and it
// draws only when something changed. three.js and the loaders are imported on first use, off the critical path.
import type * as T from "three";

export type Finish = "cad" | "graphite" | "aluminium";

export type StageOptions = {
  src: string;
  /** Camera angles in degrees: theta around the vertical axis, phi down from the top. */
  theta?: number;
  phi?: number;
  /** Distance as a share of the auto framing; below 1 pulls in. */
  frame?: number;
  finish?: Finish;
  /** Tone-mapped exposure. */
  exposure?: number;
  /** Frame the camera on the exploded pose (long assemblies grow a lot). */
  frameExploded?: boolean;
  /** Drag to turn; zoom and pan stay off so the page scroll is never trapped. */
  drag?: boolean;
  onProgress?: (loaded: number, total: number) => void;
};

export type Stage = {
  /** 0 = assembled, 1 = fully apart. No-op for models without an "explode" clip. */
  setExplode: (p: number) => void;
  /** Camera distance as a share of the fitted distance (1 = the whole framed pose fits). */
  setZoom: (k: number) => void;
  /** Absolute camera angles in degrees. */
  setAngles: (theta: number, phi?: number) => void;
  angles: () => { theta: number; phi: number };
  hasExplode: boolean;
  parts: number;
  /** Farthest part travel in model units (mm for these exports) at full explode. */
  travel: number;
  render: () => void;
  dispose: () => void;
  canvas: HTMLCanvasElement;
};

const deg = Math.PI / 180;

export async function createStage(canvas: HTMLCanvasElement, o: StageOptions): Promise<Stage> {
  const THREE = await import("three");
  const [{ GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 4, 3);
  const rim = new THREE.DirectionalLight(0xffe2cc, 0.9);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(key, rim, new THREE.HemisphereLight(0xe6ebf0, 0x202226, 0.35));

  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(o.src, (e) => o.onProgress?.(e.loaded, e.total));
  const model = gltf.scene;
  applyFinish(THREE, model, o.finish ?? "cad");
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
  const at = (p: number) => clip && mixer?.setTime(clip.duration * 0.999 * Math.min(1, Math.max(0, p)));

  // Frame: bounding sphere of the pose the camera must hold (exploded for long assemblies), centred on the pivot.
  at(o.frameExploded ? 1 : 0);
  const box = new THREE.Box3().setFromObject(model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  let travel = 0;
  if (clip) {
    const rest = new THREE.Box3();
    at(0);
    rest.setFromObject(model);
    at(1);
    const apart = new THREE.Box3().setFromObject(model);
    travel = Math.max(apart.getSize(new THREE.Vector3()).length() - rest.getSize(new THREE.Vector3()).length(), 0) / 2;
  }
  at(0);
  model.position.sub(sphere.center);
  // Distance that fits the bounding sphere in both directions; recomputed when the canvas changes shape.
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

  let parts = 0;
  model.traverse((n) => {
    if ((n as T.Mesh).isMesh) parts++;
  });

  let theta = o.theta ?? 40;
  let phi = o.phi ?? 65;
  let zoom = 1;
  let dirty = true;
  let raf = 0;
  const place = () => {
    const t = theta * deg;
    const p = phi * deg;
    // model-viewer's convention (theta from +Z toward +X, phi down from +Y), so media.json orbits carry over.
    const d = fit * zoom;
    camera.position.set(d * Math.sin(p) * Math.sin(t), d * Math.cos(p), d * Math.sin(p) * Math.cos(t));
    camera.lookAt(0, 0, 0);
  };
  const size = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      refit();
    }
  };
  const draw = () => {
    raf = 0;
    if (!dirty) return;
    dirty = false;
    size();
    place();
    renderer.render(scene, camera);
  };
  const render = () => {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(draw);
  };
  const ro = new ResizeObserver(render);
  ro.observe(canvas);

  // Drag to turn: horizontal drag orbits, vertical drag tilts a little. Pointer capture keeps the drag alive
  // outside the canvas; vertical page scroll on touch still works because touch-action is pan-y.
  let cleanupDrag = () => {};
  if (o.drag) {
    let last: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (last) return;
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!last || e.pointerId !== last.id) return;
      theta -= (e.clientX - last.x) * 0.4;
      phi = Math.min(95, Math.max(20, phi - (e.clientY - last.y) * 0.2));
      last = { ...last, x: e.clientX, y: e.clientY };
      render();
    };
    const up = (e: PointerEvent) => {
      if (last?.id === e.pointerId) last = null;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    cleanupDrag = () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }

  render();

  return {
    canvas,
    hasExplode: Boolean(clip),
    parts,
    travel,
    setExplode(p) {
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
    angles: () => ({ theta, phi }),
    render,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cleanupDrag();
      mixer?.stopAllAction();
      scene.traverse((n) => {
        const m = n as T.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

// Finishes: "cad" keeps the export's colors with a satin metal response; "graphite" and "aluminium" repaint
// every part in one material family, keeping each part's lightness so the assembly still reads part by part.
function applyFinish(THREE: typeof import("three"), root: T.Object3D, finish: Finish) {
  const cache = new Map<T.Material, T.Material>();
  root.traverse((n) => {
    const m = n as T.Mesh;
    if (!m.isMesh) return;
    const src = m.material as T.MeshStandardMaterial;
    let out = cache.get(src);
    if (!out) {
      const c = src.color.clone();
      const hsl = c.getHSL({ h: 0, s: 0, l: 0 });
      const mat = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.45, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.5 });
      if (finish === "graphite") {
        mat.color.setHSL(0.6, 0.04, 0.12 + hsl.l * 0.35);
        mat.metalness = 0.6;
        mat.roughness = 0.42;
      } else if (finish === "aluminium") {
        mat.color.setHSL(0.58, 0.03, 0.55 + hsl.l * 0.3);
        mat.metalness = 0.85;
        mat.roughness = 0.32;
      }
      out = mat;
      cache.set(src, out);
    }
    m.material = out;
  });
}

/** "60deg 65deg auto" (a media.json orbit) to degrees. */
export function parseOrbit(s?: string, fallback = { theta: 40, phi: 65 }) {
  const [t, p] = (s ?? "").split(/\s+/).map((x) => parseFloat(x));
  return { theta: Number.isFinite(t) ? t : fallback.theta, phi: Number.isFinite(p) ? p : fallback.phi };
}
