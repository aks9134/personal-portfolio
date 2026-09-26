import { test, expect } from '@playwright/test';

// 3D viewers: nothing loads until asked, every model loads from this site (decoder included),
// and keyboard focus lands on the loaded model, or on the Explode slider for a model that comes apart.
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

  const buttons = page.getByRole('button', { name: /^(Load 3D model|Take it apart)/ });
  await expect(buttons).toHaveCount(count);
  for (let i = 0; i < count; i++) {
    await buttons.first().click();
    const viewer = page.locator('model-viewer').nth(i);
    await expect.poll(() => viewer.evaluate((el) => (el as HTMLElement & { loaded: boolean }).loaded), { timeout: 30_000 }).toBe(true);
    const slider = viewer.locator('xpath=ancestor::div[2]').getByLabel('Explode');
    if (await slider.count()) await expect(slider).toBeFocused();
    else await expect(viewer).toBeFocused();
  }

  expect(models).toHaveLength(count);
  expect(problems, 'console errors and failed requests').toEqual([]);
  expect([...thirdParty], 'third-party origins contacted').toEqual([]);
});

type MV = HTMLElement & { loaded: boolean; currentTime: number; getCameraOrbit: () => { theta: number } };

// The take-apart model on the home page: the slider scrubs the baked "explode" animation and the readout follows.
test('home: the drive module comes apart on the slider', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop only: 248 parts in software WebGL is slow');
  test.slow();
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Take it apart/ }).click();
  const slider = page.getByLabel('Explode');
  await expect(slider).toBeFocused({ timeout: 60_000 });
  await slider.fill('100');
  await expect(page.locator('output')).toContainText(/[1-9]\d* mm apart/);
  await expect(slider).toHaveAttribute('aria-valuetext', /millimetres apart/);
  const t = await page.locator('article.sheet-invert model-viewer').evaluate((el) => (el as MV).currentTime);
  expect(t).toBeGreaterThan(0.99);
  expect(problems).toEqual([]);
});

// Reduced motion covers script-driven motion too, which getAnimations() cannot see: no demo explode after
// loading, and the hero hand does not turn when the page scrolls.
test('reduced motion: nothing moves on its own (3D)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.slow();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  const hand = page.locator('header model-viewer');
  await expect.poll(() => hand.evaluate((el) => (el as MV).loaded), { timeout: 60_000 }).toBe(true);
  const before = await hand.evaluate((el) => (el as MV).getCameraOrbit().theta);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(600);
  expect(await hand.evaluate((el) => (el as MV).getCameraOrbit().theta)).toBeCloseTo(before, 5);

  await page.getByRole('button', { name: /^Take it apart/ }).click();
  await expect(page.getByLabel('Explode')).toBeFocused({ timeout: 60_000 });
  await page.waitForTimeout(1800);
  const t = await page.locator('article.sheet-invert model-viewer').evaluate((el) => (el as MV).currentTime);
  expect(t).toBe(0);
  await expect(page.getByLabel('Explode')).toHaveValue('0');
});
