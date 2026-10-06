import { test, expect } from '@playwright/test';
import { routes } from './site.config';

// Site-wide finish: 404 page, link previews, structured data, security headers. Runs once (desktop).
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'runs once'));

test('unknown URLs get a real 404 with a way back', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Back to the home page' })).toHaveAttribute('href', '/');
});

test('every page has a JPG link preview that exists', async ({ page, request }) => {
  for (const route of routes) {
    await page.goto(route);
    const url = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(url, `${route} og:image`).toMatch(/\/og\/[\w-]+\.[0-9a-f]{8}\.jpg$/);
    const res = await request.get(new URL(url!).pathname);
    expect(res.status(), `${route} preview image`).toBe(200);
    expect(res.headers()['content-type']).toContain('image/jpeg');
  }
});

// See-through images in the dark: ink drawings and plots turn light-on-dark, and cut-out renders sit straight on the
// page (no box behind them). The twin: the cut-out is really there, loaded and drawn at size.
test('see-through images: ink inverts, cut-outs sit on the page with no box, and they still show', async ({ page }) => {
  const img = (alt: RegExp) => page.getByRole('img', { name: alt }).first();
  await page.goto('/work/micro-vibration-canceller');
  await expect(img(/^Wiring schematic/)).toHaveCSS('filter', /invert/);
  await expect(img(/^CAD of the test rig/)).toHaveCSS('filter', 'none');
  expect(await img(/^CAD of the test rig/).evaluate((i) => getComputedStyle(i.parentElement!).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await img(/^CAD of the test rig/).scrollIntoViewIfNeeded();
  // It loads lazily once near, so wait for it rather than reading it the instant it scrolls in.
  await expect
    .poll(() => img(/^CAD of the test rig/).evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width > 100), { message: 'the cut-out is loaded and drawn' })
    .toBe(true);
});

test('the old lab addresses redirect to the real pages', async ({ request }) => {
  for (const [from, to] of [['/lab/b', '/'], ['/lab/b/work/tpu-weld-rig', '/work/tpu-weld-rig'], ['/lab/b/resume', '/resume']]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(307);
    expect(new URL(res.headers()['location'], 'http://x').pathname, from).toBe(to);
  }
});

test('home page describes Allen in structured data', async ({ page }) => {
  await page.goto('/');
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data['@type']).toBe('ProfilePage');
  expect(data.mainEntity.name).toBe('Allen Sun');
});

test('security headers are set', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
});

// A srcset label that overstates a file's width makes browsers draw the image smaller than it is (this shrank
// heroes to a third on high-density screens once). Every candidate's label must match its real pixel width.
test('srcset widths are true', async ({ page }) => {
  const wrong: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    wrong.push(...(await page.evaluate(async () => {
      const bad: string[] = [];
      const cands = [...document.querySelectorAll('img[srcset]')].flatMap((i) => i.getAttribute('srcset')!.split(',').map((c) => c.trim().split(/\s+/)));
      await Promise.all(cands.map(([url, d]) => new Promise<void>((done) => {
        const im = new Image();
        im.onload = () => { if (d.endsWith('w') && im.naturalWidth !== Number(d.slice(0, -1))) bad.push(`${url} is ${im.naturalWidth}px, labelled ${d}`); done(); };
        im.onerror = () => { bad.push(`${url} failed to load`); done(); };
        im.src = url;
      })));
      return bad;
    })).map((b) => `${route}: ${b}`));
  }
  expect(wrong).toEqual([]);
});
