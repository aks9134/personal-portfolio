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
