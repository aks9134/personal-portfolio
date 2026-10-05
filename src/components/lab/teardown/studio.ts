// Direction C, offline renderer: an infinite-white studio (shadow-only floor, soft key, fill, rim, machine-shop reflections) for one CAD model, rendered frame
// by frame for a scroll image sequence. Each output frame averages many passes with the key light and the camera's
// sub-pixel offset jittered, which gives soft shadows and clean edges without a path tracer. Used only by
// scripts/render-teardown.mjs through /lab/render; visitors download the finished WebP frames, not this code.
import * as THREE from "three";
import { applyFinish } from "../../stage/engine";
import { clamp01, fit, loadEnv, loadModel, partsOf, smooth } from "../load";

export type Shot = {
  src: string;
  finish: "aluminium" | "anodized";
  size: number; // largest dimension in metres in the studio
  lift: number; // height of the model's base above the floor
  theta: [number, number]; // camera yaw over the sequence, degrees
  phi: [number, number]; // camera elevation, degrees above the horizon
  dist: [number, number]; // camera distance at the start and end (pulls back as the parts spread)
  explode: [number, number]; // explode over the sequence (0-1), from the GLB clip or a radial spread
  spread?: number; // radial spread in metres for models without a clip
  look: number; // look-at height
};

export async function createStudio(canvas: HTMLCanvasElement, shot: Shot, w: number, h: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const paper = new THREE.Color(0xf1efe9);
  scene.background = paper;
  // Reflections from a real machine shop (Poly Haven, CC0), so the metal has something true to mirror.
  scene.environment = await loadEnv(renderer, "/lab/env/machine_shop_02_1k.hdr");
  scene.environmentIntensity = 1.0;

  // Infinite white: the floor only catches shadows, so it melts into the background at every camera angle.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x2a2620, opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xfff3e6, 0.5);
  fill.position.set(-5, 3, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(-2, 4, -6);
  scene.add(fill, rim);

  const m = await loadModel(shot.src);
  const model = m.scene;
  applyFinish(THREE, model, shot.finish, true);
  const holder = new THREE.Group();
  holder.add(model);
  const mixer = m.clip ? new THREE.AnimationMixer(model) : null;
  const action = m.clip && mixer ? mixer.clipAction(m.clip).play() : null;
  if (action) action.paused = true;
  const clipAt = (p: number) => {
    if (!action || !mixer || !m.clip) return;
    action.time = m.clip.duration * 0.999 * clamp01(p);
    mixer.update(0);
  };
  clipAt(0);
  fit(model, shot.size);
  holder.position.y = shot.lift;
  scene.add(holder);
  model.traverse((n) => {
    const mesh = n as THREE.Mesh;
    if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true;
  });
  scene.updateMatrixWorld(true);
  // Radial spread for models without an explode clip: each part moves away from the centre in its parent's frame.
  const centre = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const spread = partsOf(model).map((p) => {
    const d = p.centre.clone().sub(centre);
    const dir = d.lengthSq() > 1e-8 ? d.normalize() : new THREE.Vector3(0, 1, 0);
    const par = p.mesh.parent!;
    const off = par.worldToLocal(p.centre.clone().addScaledVector(dir, shot.spread ?? 0)).sub(par.worldToLocal(p.centre.clone()));
    return { mesh: p.mesh, home: p.mesh.position.clone(), off };
  });

  const camera = new THREE.PerspectiveCamera(24, w / h, 0.05, 80);
  const deg = Math.PI / 180;

  // Pose for sequence position t (0-1).
  const pose = (t: number) => {
    const e = shot.explode[0] + (shot.explode[1] - shot.explode[0]) * smooth(t);
    if (m.clip) clipAt(e);
    else for (const s of spread) s.mesh.position.copy(s.home).addScaledVector(s.off, e);
    const th = (shot.theta[0] + (shot.theta[1] - shot.theta[0]) * smooth(t)) * deg;
    const ph = (shot.phi[0] + (shot.phi[1] - shot.phi[0]) * smooth(t)) * deg;
    const dist = shot.dist[0] + (shot.dist[1] - shot.dist[0]) * smooth(t);
    camera.position.set(Math.sin(th) * Math.cos(ph) * dist, shot.look + Math.sin(ph) * dist, Math.cos(th) * Math.cos(ph) * dist);
    camera.lookAt(0, shot.look, 0);
  };

  // One output frame: the running average of `passes` renders with jittered key light and sub-pixel camera shift.
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const g = out.getContext("2d")!;
  const frame = (t: number, passes = 24) => {
    pose(t);
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < passes; k++) {
      const a = (k / passes) * Math.PI * 2 * 3.1;
      const r = 2.2 * Math.sqrt((k + 0.5) / passes);
      key.position.set(3.5 + Math.cos(a) * r, 7 + Math.sin(a) * r * 0.5, 4.5 + Math.sin(a) * r);
      key.target.position.set(0, shot.look * 0.5, 0);
      camera.setViewOffset(w, h, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, w, h);
      renderer.render(scene, camera);
      g.globalAlpha = 1 / (k + 1);
      g.drawImage(canvas, 0, 0);
    }
    camera.clearViewOffset();
    g.globalAlpha = 1;
    return out.toDataURL("image/png");
  };
  return { frame };
}
