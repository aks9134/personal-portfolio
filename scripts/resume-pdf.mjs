// npm run resume:pdf [-- <baseUrl>]   (after npm run build)
// Prints /resume to public/allen-sun-resume.pdf, so the PDF is the web page and can't drift from it.
// Also writes the resume sources' fingerprint next to it; tests/resume.spec.ts fails when they change
// without a reprint. With no base URL it starts its own `next start` on port 3107 and stops it after.
import { spawn, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const SOURCES = ['src/lib/resume.ts', 'src/lib/site.ts', 'src/app/resume/page.tsx', 'src/app/globals.css'];
const OUT = 'public/allen-sun-resume.pdf';
const hash = createHash('sha1').update(SOURCES.map((f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')).join('\0')).digest('hex').slice(0, 12);

// The PDF comes from the built site, so a build older than the resume sources would print a stale resume.
const built = fs.existsSync('.next/BUILD_ID') ? fs.statSync('.next/BUILD_ID').mtimeMs : 0;
const stale = SOURCES.filter((f) => fs.statSync(f).mtimeMs > built);
if (stale.length) throw new Error(`Build is older than ${stale.join(', ')}: run npm run build first.`);

let base = process.argv[2];
let server;
try {
  if (!base) {
    base = 'http://localhost:3107';
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3107'], { stdio: 'ignore' });
    for (let i = 0; ; i++) {
      if (server.exitCode !== null) throw new Error('next start exited; is port 3107 in use?');
      try { if ((await fetch(base + '/resume')).ok) break; } catch {}
      if (i > 60) throw new Error('next start did not come up on 3107');
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(base + '/resume', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ path: OUT, format: 'Letter', preferCSSPageSize: true, printBackground: false });
  await browser.close();
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  fs.writeFileSync(OUT + '.json', JSON.stringify({ sources: SOURCES, hash }, null, 2) + '\n');
  console.log(`${OUT}: ${pages} page(s), ${pdf.length} bytes, sources ${hash}`);
  if (pages > 1) console.warn('The resume runs past one page. Tighten src/lib/resume.ts or the print styles.');
} finally {
  if (server) execSync(process.platform === 'win32' ? `taskkill /PID ${server.pid} /T /F` : `kill ${server.pid}`, { stdio: 'ignore' });
}
