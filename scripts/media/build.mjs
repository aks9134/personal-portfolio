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

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.find((a) => !a.startsWith('--'));
const PYTHON = path.join('.venv-media', 'Scripts', 'python.exe');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'media-'));
let occt; // STEP reader, loaded on first use
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
      if (!force && old[item.out]?.hash === hash) {
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
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Photos, renders, figures -> WebP. Optional: pdfObject, crop [left, top, width, height], cutout, trim, width.
async function image(item, slug, outDir) {
  const input = item.pdfObject ? pdfJpeg(item.src, item.pdfObject) : fs.readFileSync(item.src);
  let img = sharp(input).rotate(); // apply EXIF orientation; metadata (GPS) is dropped on output
  if (item.crop) {
    const [left, top, width, height] = item.crop;
    img = img.extract({ left, top, width, height });
  }
  if (item.cutout) {
    const a = path.join(tmp, 'in.png');
    const b = path.join(tmp, 'out.png');
    await img.png().toFile(a);
    execFileSync(PYTHON, ['scripts/media/cutout.py', a, b], { stdio: ['ignore', 'ignore', 'inherit'] });
    img = sharp(fs.readFileSync(b));
  }
  // flatten: a drawing whose see-through margins should read as its white paper (not a cut-out)
  if (item.flatten) img = sharp(await img.flatten({ background: "#ffffff" }).toBuffer());
  if (item.cutout || item.trim) img = sharp(await img.trim().toBuffer());
  const file = path.join(outDir, `${item.out}.webp`);
  const info = await img
    .resize({ width: item.width ?? 1600, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(file);
  // alpha: a cut-out with see-through background. Pages put these on a neutral sheet so the page color never tints them.
  const alpha = !(await sharp(file).stats()).isOpaque;
  return { src: `/work/${slug}/${item.out}.webp`, width: info.width, height: info.height, ...(alpha && { alpha }) };
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
// Optional: deflection (smaller = finer mesh), color "#rrggbb", metallic, roughness.
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
    scene.addChild(doc.createNode(m.name).setMesh(doc.createMesh(m.name).addPrimitive(prim)));
  }
  await MeshoptEncoder.ready;
  await doc.transform(dedup(), weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const file = path.join(outDir, `${item.out}.glb`);
  await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder }).write(file, doc);
  return { src: `/work/${slug}/${item.out}.glb`, parts: res.meshes.length, bytes: fs.statSync(file).size };
}

// Video -> muted H.264 MP4 with a WebP poster. Optional: crop "w:h:x:y", start, duration (s), width, posterAt (s).
async function video(item, slug, outDir) {
  const file = path.join(outDir, `${item.out}.mp4`);
  const width = item.width ?? 1280;
  const vf = [item.crop && `crop=${item.crop}`, `scale='trunc(min(${width},iw)/2)*2':-2`].filter(Boolean).join(',');
  execFileSync(ffmpeg, [
    '-y', '-v', 'error', ...(item.start ? ['-ss', `${item.start}`] : []), '-i', item.src,
    ...(item.duration ? ['-t', `${item.duration}`] : []), '-vf', vf, '-an',
    '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file,
  ]);
  const frame = execFileSync(ffmpeg, ['-v', 'error', '-ss', `${item.posterAt ?? 0}`, '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], { maxBuffer: 64 << 20 });
  const poster = await sharp(frame).webp({ quality: 80 }).toFile(path.join(outDir, `${item.out}-poster.webp`));
  return { src: `/work/${slug}/${item.out}.mp4`, poster: `/work/${slug}/${item.out}-poster.webp`, width: poster.width, height: poster.height, bytes: fs.statSync(file).size };
}

// "#rrggbb" (sRGB) -> linear RGB, which is what glTF base colors are.
function hexToRgb(hex) {
  return [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}
