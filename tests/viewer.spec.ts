import { test, expect } from '@playwright/test';

// 3D viewers: nothing loads until asked, every model loads from this site (decoder included),
// and the loaded model takes keyboard focus.
const pages = [
  { route: '/work/gravity-storage-drive', models: 3 },
  { route: '/work/robotic-arm', models: 1 },
];

for (const { route, models: count } of pages)
test(`${route}: 3D viewers load on click with zero third-party requests`, async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const thirdParty = new Set<string>();
  const problems: string[] = [];
  const models: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== origin) thirdParty.add(u.origin);
    if (u.pathname.endsWith('.glb')) models.push(u.pathname);
  });
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`));

  await page.goto(route, { waitUntil: 'networkidle' });
  expect(models, 'models fetched before any click').toEqual([]);

  const buttons = page.getByRole('button', { name: /^Load 3D model/ });
  await expect(buttons).toHaveCount(count);
  for (let i = 0; i < count; i++) {
    await buttons.first().click();
    const viewer = page.locator('model-viewer').nth(i);
    await expect.poll(() => viewer.evaluate((el) => (el as HTMLElement & { loaded: boolean }).loaded), { timeout: 30_000 }).toBe(true);
    await expect(viewer).toBeFocused();
  }

  expect(models).toHaveLength(count);
  expect(problems, 'console errors and failed requests').toEqual([]);
  expect([...thirdParty], 'third-party origins contacted').toEqual([]);
});
