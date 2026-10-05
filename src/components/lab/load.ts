// Shared loaders for the v5 direction prototypes: Allen's meshopt GLBs and a Poly Haven HDRI as image-based light.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

export async function loadModel(src: string) {
  const g = await gltf.loadAsync(src);
  return { scene: g.scene, clip: g.animations.find((a) => a.name === "explode") ?? null };
}

/** An equirectangular HDR, prefiltered for PBR lighting. */
export async function loadEnv(renderer: THREE.WebGLRenderer, url: string) {
  const hdr = await new HDRLoader().loadAsync(url);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose();
  pmrem.dispose();
  return env;
}

/** Scales and recentres a model so its largest dimension is `size` (CAD exports are in millimetres), resting on y = 0. */
export function fit(obj: THREE.Object3D, size: number) {
  const box = new THREE.Box3().setFromObject(obj);
  const dims = box.getSize(new THREE.Vector3());
  const s = size / Math.max(dims.x, dims.y, dims.z);
  obj.scale.setScalar(s);
  const box2 = new THREE.Box3().setFromObject(obj);
  const c = box2.getCenter(new THREE.Vector3());
  obj.position.sub(new THREE.Vector3(c.x, box2.min.y, c.z));
  return s;
}

/** Every mesh in a model, with the world-space centre of each, for part-by-part animation. */
export function partsOf(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const out: { mesh: THREE.Mesh; centre: THREE.Vector3 }[] = [];
  root.traverse((n) => {
    const m = n as THREE.Mesh;
    if (!m.isMesh) return;
    out.push({ mesh: m, centre: new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()) });
  });
  return out;
}

export const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Overall scroll progress (0-1) of a tall section through the viewport. */
export function sectionProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const run = el.offsetHeight - window.innerHeight;
  return run > 0 ? clamp01(-r.top / run) : 0;
}
