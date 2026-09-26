// npm run media [-- <slug>] [-- --force]
// Reads content/work/<slug>/media.json, turns raw files into web files in public/work/<slug>/,
// and records sizes in content/work/<slug>/media.generated.json for the pages to read.
// The handler is picked by file extension. Field reference: scripts/media/README.md.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Document, Logger, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, quantize, weld } from '@gltf-transform/functions';
import ffmpeg from 'ffmpeg-static';
import { MeshoptEncoder } from 'meshoptimizer';
import occtimportjs from 'occt-import-js';
import sharp from 'sharp';

sharp.cache(false); // on Windows a cached handle keeps files locked, so they could not be moved or deleted
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.find((a) => !a.startsWith('--'));
const PYTHON = path.join('.venv-media', 'Scripts', 'python.exe');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'media-'));
let occt; // STEP reader, loaded on first use
const WIDTHS = [640, 828, 1200]; // width copies of every WebP; keep in sync with src/lib/image-widths.ts
const HANDLERS = { '.png': image, '.jpg': image, '.jpeg': image, '.pdf': image, '.step': model, '.stp': model, '.mov': video, '.mp4': video };

try {
  for (const slug of fs.readdirSync('content/work')) {
    const listPath = path.join('content/work', slug, 'media.json');
    if ((only && slug !== only) || !fs.existsSync(listPath)) continue;
    const outDir = path.join('public/work', slug);
    fs.mkdirSync(outDir, { recursive: true });
    const manifestPath = path.join('content/work', slug, 'media.generated.json');
    const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
    const manifest = {};
    for (const item of JSON.parse(fs.readFileSync(listPath, 'utf8'))) {
      const hash = createHash('sha1').update(JSON.stringify(item)).digest('hex').slice(0, 10);
      const posterless = HANDLERS[path.extname(item.src).toLowerCase()] === model && !old[item.out]?.poster;
      if (!force && old[item.out]?.hash === hash && !posterless) {
        manifest[item.out] = old[item.out];
        continue;
      }
      const handler = HANDLERS[path.extname(item.src).toLowerCase()];
      if (!handler) throw new Error(`${slug}/${item.out}: no handler for ${item.src}`);
      if (!fs.existsSync(item.src)) throw new Error(`${slug}/${item.out}: source missing: ${item.src}`);
      manifest[item.out] = { ...(await handler(item, slug, outDir)), ...(item.alt && { alt: item.alt }), hash };
      console.log(`${slug}/${item.out}`, JSON.stringify(manifest[item.out]));
    }
    // ponytail: stale files in public/work/<slug>/ are not deleted; clear the folder and rerun if it matters.
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    await widths(manifest);
  }
} finally {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ponytail: a locked temp folder is left for the OS to clear; never mask the real error
  }
}

// Photos, renders, figures -> WebP. Optional: pdfObject, crop [left, top, width, height], cutout, trim, width.
async function image(item, slug, outDir) {
  const input = item.pdfObject ? pdfJpeg(item.src, item.pdfObject) : fs.readFileSync(item.src);
  let img = sharp(input).rotate(); // apply EXIF orientation; metadata (GPS) is dropped on output
  if (item.crop) {
    const [left, top, width, height] = item.crop;
    img = img.extract({ left, top, width, height });
  }
  // alpha: make the background see-through without letting the page color into the object (modes in cutout.py).
  const mode = item.alpha ?? (item.cutout ? "cutout" : null);
  if (mode) {
    const a = path.join(tmp, "in.png");
    const b = path.join(tmp, "out.png");
    await img.png().toFile(a);
    const fill = item.fill ? [item.fill === true ? "fill" : `fill:${item.fill}`] : [];
    execFileSync(PYTHON, ["scripts/media/cutout.py", a, b, mode, ...fill], { stdio: ["ignore", "ignore", "inherit"] });
    img = sharp(fs.readFileSync(b));
  }
  if (item.trim ?? Boolean(mode)) img = sharp(await img.trim().toBuffer());
  const file = path.join(tmp, "out.webp");
  const info = await img
    .resize({ width: item.width ?? 1600, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(file);
  // alpha: see-through background. Pages put these straight on the stock (on a plate in dark mode).
  const alpha = !(await sharp(file).stats()).isOpaque;
  return { src: publish(file, slug, outDir, item.out, "webp"), width: info.width, height: info.height, ...(alpha && { alpha }) };
}

// A JPEG embedded in a PDF (the old portfolio holds photos that exist nowhere else).
function pdfJpeg(file, obj) {
  const buf = fs.readFileSync(file);
  const text = buf.toString('latin1');
  const m = new RegExp(`(?:^|\\s)${obj}\\s+0\\s+obj\\s*<<((?:(?!endobj)[\\s\\S])*?)>>\\s*stream\\r?\\n`).exec(text);
  if (!m || !/DCTDecode/.test(m[1])) throw new Error(`${file}: object ${obj} is not a JPEG image`);
  const start = m.index + m[0].length;
  return buf.subarray(start, text.indexOf('endstream', start));
}

// STEP -> compressed GLB, one mesh per solid, CAD colors kept unless `color` overrides.
// Optional: deflection (smaller = finer mesh), color "#rrggbb", metallic, roughness, orbit (camera angle for the
// poster and the page viewer, model-viewer camera-orbit syntax, e.g. "60deg 65deg auto").
async function model(item, slug, outDir) {
  occt ??= await occtimportjs();
  const res = occt.ReadStepFile(new Uint8Array(fs.readFileSync(item.src)), {
    linearUnit: 'millimeter',
    linearDeflectionType: 'bounding_box_ratio',
    linearDeflection: item.deflection ?? 0.002,
    angularDeflection: 0.5,
  });
  if (!res.success) throw new Error(`${item.src}: STEP read failed`);
  const doc = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = doc.createBuffer();
  const scene = doc.createScene();
  const materials = new Map();
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const centres = new Map(); // node -> world centre of its mesh, for the exploded-view animation
  for (const m of res.meshes) {
    const rgb = item.color ? hexToRgb(item.color) : (m.color ?? [0.7, 0.7, 0.72]);
    if (!materials.has(rgb.join())) {
      materials.set(rgb.join(), doc.createMaterial().setBaseColorFactor([...rgb, 1])
        .setMetallicFactor(item.metallic ?? 0.2).setRoughnessFactor(item.roughness ?? 0.55));
    }
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', accessor('VEC3', new Float32Array(m.attributes.position.array)))
      .setIndices(accessor('SCALAR', new Uint32Array(m.index.array)))
      .setMaterial(materials.get(rgb.join()));
    if (m.attributes.normal) prim.setAttribute('NORMAL', accessor('VEC3', new Float32Array(m.attributes.normal.array)));
    const node = doc.createNode(m.name).setMesh(doc.createMesh(m.name).addPrimitive(prim));
    scene.addChild(node);
    // A solid with no triangles has no centre; it stays put rather than turning the whole assembly's centre into NaN.
    if (item.explode && m.attributes.position.array.length) centres.set(node, boxCentre(m.attributes.position.array));
  }
  await MeshoptEncoder.ready;
  await doc.transform(dedup(), weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  if (item.explode) explodeAnimation(doc, centres, item.explode);
  const file = path.join(tmp, "out.glb");
  await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder }).write(file, doc);
  const bytes = fs.statSync(file).size;
  const poster = await modelPoster(file, item.orbit, Boolean(item.explode));
  return {
    src: publish(file, slug, outDir, item.out, "glb"),
    poster: publish(poster.file, slug, outDir, `${item.out}-poster`, "webp"),
    width: poster.width,
    height: poster.height,
    parts: res.meshes.length,
    bytes,
    ...(item.orbit && { orbit: item.orbit }),
    ...(item.explode && { explode: true }),
  };
}

function boxCentre(p) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[i + k]); hi[k] = Math.max(hi[k], p[i + k]); }
  return lo.map((v, k) => (v + hi[k]) / 2);
}

// Optional `explode: { along, across }`: bakes an animation named "explode" into the GLB, one second long, that
// moves every part away from the assembly's centre, like an exploded drawing: `along` scales its distance along
// the assembly's longest axis (the shaft on a drive), `across` its distance off that axis. A part on the centre
// stays put, so shafts hold still while bearings slide off them and blocks drop away. The page scrubs it with
// model-viewer's currentTime. The file's resting pose is the exploded one, because model-viewer frames the camera
// on the resting pose; the page and the poster set time 0 to show it assembled. Added last, after meshopt(): quantize() and meshopt() both rewrite node translations,
// and each keyframe starts from the node's final translation. The two small animation accessors stay uncompressed.
function explodeAnimation(doc, centres, { along = 0.8, across = 0.35 }) {
  const all = [...centres.values()];
  const lo = [0, 1, 2].map((k) => Math.min(...all.map((c) => c[k])));
  const hi = [0, 1, 2].map((k) => Math.max(...all.map((c) => c[k])));
  const mid = lo.map((v, k) => (v + hi[k]) / 2);
  const axis = [0, 1, 2].reduce((a, k) => (hi[k] - lo[k] > hi[a] - lo[a] ? k : a), 0);
  const buffer = doc.getRoot().listBuffers()[0];
  const times = doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0, 1])).setBuffer(buffer);
  const anim = doc.createAnimation('explode');
  for (const [node, c] of centres) {
    const t0 = node.getTranslation();
    const t1 = t0.map((v, k) => v + (c[k] - mid[k]) * (k === axis ? along : across));
    const out = doc.createAccessor().setType('VEC3').setArray(new Float32Array([...t0, ...t1])).setBuffer(buffer);
    node.setTranslation(t1); // resting pose = fully exploded, so the viewer's auto-framing leaves room for it
    const sampler = doc.createAnimationSampler().setInput(times).setOutput(out).setInterpolation('LINEAR');
    anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('translation').setSampler(sampler));
  }
}

// GLB -> see-through WebP poster, rendered by the same <model-viewer> the page loads, in the viewer's 4:3 frame,
// so the swap from poster to live model doesn't jump. Headless Chromium draws WebGL in software (SwiftShader).
async function modelPoster(glb, orbit, exploded = false) {
  const { chromium } = await import('@playwright/test');
  const [w, h] = [1200, 900];
  const files = {
    '/mv.js': 'node_modules/@google/model-viewer/dist/model-viewer.min.js',
    '/decoder.js': 'public/vendor/meshopt_decoder.js',
    '/model.glb': glb,
  };
  const html = `<!doctype html><style>html,body{margin:0;background:transparent}model-viewer{width:${w}px;height:${h}px}</style>
<script>self.ModelViewerElement = { meshoptDecoderLocation: '/decoder.js' };</script>
<script type="module" src="/mv.js"></script>
<model-viewer src="/model.glb" interaction-prompt="none"${orbit ? ` camera-orbit="${orbit}"` : ""}${exploded ? ' animation-name="explode"' : ""}></model-viewer>`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.route('http://poster.local/**', (r) => {
      const p = new URL(r.request().url()).pathname;
      if (p === '/') return r.fulfill({ contentType: 'text/html', body: html });
      return files[p] ? r.fulfill({ path: files[p] }) : r.abort();
    });
    await page.goto('http://poster.local/');
    const dataUrl = await page.evaluate(async () => {
      const mv = document.querySelector('model-viewer');
      await customElements.whenDefined('model-viewer');
      if (!mv.loaded) await new Promise((ok, fail) => { mv.addEventListener('load', ok); mv.addEventListener('error', fail); });
      if (mv.animationName) { mv.pause(); mv.currentTime = 0; } // exploded models: the poster shows them assembled
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const blob = await mv.toBlob({ mimeType: 'image/png', idealAspect: false });
      return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    });
    const file = path.join(tmp, 'poster.webp');
    const info = await sharp(Buffer.from(dataUrl.split(',')[1], 'base64')).webp({ quality: 85, alphaQuality: 100 }).toFile(file);
    return { file, width: info.width, height: info.height };
  } finally {
    await browser.close();
  }
}

// Video -> muted H.264 MP4 with a WebP poster. Optional: crop "w:h:x:y", start, duration (s), width, posterAt (s).
async function video(item, slug, outDir) {
  const file = path.join(tmp, "out.mp4");
  const width = item.width ?? 1280;
  const vf = [item.crop && `crop=${item.crop}`, `scale='trunc(min(${width},iw)/2)*2':-2`].filter(Boolean).join(',');
  execFileSync(ffmpeg, [
    '-y', '-v', 'error', ...(item.start ? ['-ss', `${item.start}`] : []), '-i', item.src,
    ...(item.duration ? ['-t', `${item.duration}`] : []), '-vf', vf, '-an',
    '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file,
  ]);
  const frame = execFileSync(ffmpeg, ['-v', 'error', '-ss', `${item.posterAt ?? 0}`, '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], { maxBuffer: 64 << 20 });
  const posterFile = path.join(tmp, "poster.webp");
  const poster = await sharp(frame).webp({ quality: 80 }).toFile(posterFile);
  const bytes = fs.statSync(file).size;
  return {
    src: publish(file, slug, outDir, item.out, "mp4"),
    poster: publish(posterFile, slug, outDir, `${item.out}-poster`, "webp"),
    width: poster.width,
    height: poster.height,
    bytes,
  };
}

// Phone- and laptop-sized copies of every WebP (<file>.w640.webp and so on), made from the published file.
// Pages list them in a srcset (src/lib/image-widths.ts), so no resizing service runs at request time.
async function widths(manifest) {
  for (const m of Object.values(manifest)) {
    for (const url of [m.src, m.poster]) {
      if (!url?.endsWith('.webp')) continue;
      const file = path.join('public', url);
      for (const w of WIDTHS) {
        const out = file.replace(/\.webp$/, `.w${w}.webp`);
        if (!fs.existsSync(out)) await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
      }
    }
  }
}

// Move a finished file into public/ as <name>.<content hash>.<ext> and delete that name's older versions (width copies too).
// A changed file gets a new URL, so no browser, CDN or image-optimizer cache can serve a stale copy.
function publish(file, slug, outDir, name, ext) {
  const hash = createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  const old = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.[0-9a-f]{8})?(\\.w\\d+)?\\.${ext}$`);
  for (const f of fs.readdirSync(outDir)) if (old.test(f)) fs.rmSync(path.join(outDir, f));
  const out = `${name}.${hash}.${ext}`;
  fs.copyFileSync(file, path.join(outDir, out));
  fs.rmSync(file);
  return `/work/${slug}/${out}`;
}

// "#rrggbb" (sRGB) -> linear RGB, which is what glTF base colors are.
function hexToRgb(hex) {
  return [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}
