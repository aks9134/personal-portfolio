import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

// The PDF is printed from /resume by `npm run resume:pdf`. If the resume's sources changed since, reprint it.
test('resume PDF matches the current resume sources', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  const meta = JSON.parse(fs.readFileSync('public/allen-sun-resume.pdf.json', 'utf8')) as { sources: string[]; hash: string };
  const hash = createHash('sha1').update(meta.sources.map((f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')).join('\0')).digest('hex').slice(0, 12);
  expect(hash, 'resume changed since the PDF was printed: run npm run resume:pdf').toBe(meta.hash);
  const res = await request.get('/allen-sun-resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('pdf');
});
