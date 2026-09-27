import { test, expect, type Locator, type Page } from '@playwright/test';

// The three.js stage. Each canvas reports its state as data attributes (engine.ts): data-ready once the model is
// drawn, data-theta (camera angle) and data-explode (0 to 1). Every "nothing moves" check has a twin that proves the
// same thing does move when motion is allowed, so a broken feature can't pass as a restrained one.
test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'WebGL checks run on the desktop profile'));
test.slow();

const hero = (page: Page) => page.locator('section[aria-labelledby="name"] canvas');
const drive = (page: Page) => page.locator('#terrament canvas');
const theta = (page: Page) => hero(page).getAttribute('data-theta').then(Number);
/** The stage has drawn its model (engine.ts sets data-ready). */
const ready = (c: Locator, timeout = 60_000) => expect(c).toHaveAttribute('data-ready', '', { timeout });
const apart = (page: Page) => drive(page).getAttribute('data-explode').then(Number);

async function motionOff(page: Page) {
  await page.addInitScript(() => localStorage.setItem('pref-motion', 'off'));
}

async function toDrive(page: Page, at: number) {
  await page.evaluate((at) => {
    const s = document.getElementById('terrament')!;
    const top = s.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + at * (s.offsetHeight - innerHeight), behavior: 'instant' });
  }, at);
}

test('home: every model loads from this site, and the hero replaces its poster', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign = new Set<string>();
  const problems: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== origin) foreign.add(u.origin);
  });
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  await page.goto('/', { waitUntil: 'networkidle' });
  await ready(hero(page));
  await expect(page.locator('section[aria-labelledby="name"] img')).toHaveCSS('opacity', '0');
  expect([...foreign]).toEqual([]);
  expect(problems).toEqual([]);
});

test('home: scrolling through the drive takes it apart (motion allowed)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await toDrive(page, 0);
  await ready(drive(page));
  // The parts themselves move: measured from the geometry, the drive is larger apart than together. (The explode
  // attribute alone once read 0.8 while every part sat assembled.)
  expect(Number(await drive(page).getAttribute('data-spread'))).toBeGreaterThan(1.1);
  await toDrive(page, 0.8);
  await expect.poll(() => apart(page)).toBeGreaterThan(0.6);
  await expect(page.locator('#terrament')).toContainText(/[1-9]\d* mm/);
  // The slider is the same control: moving it scrolls the page to the matching point.
  const y = await page.evaluate(() => scrollY);
  await page.getByRole('slider', { name: 'Explode' }).fill('200');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(y);
  await expect.poll(() => apart(page)).toBeLessThan(0.3);
});

test('home: the hero turns with scroll when motion is allowed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await ready(hero(page));
  const before = await theta(page);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => theta(page)).not.toBeCloseTo(before, 1);
});

for (const how of ['OS setting', 'site switch'] as const)
  test(`motion off (${how}): hero, scope and drive hold still, and the controls still work`, async ({ page }) => {
    if (how === 'OS setting') await page.emulateMedia({ reducedMotion: 'reduce' });
    else await motionOff(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await ready(hero(page));
    const before = await theta(page);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);
    expect(await theta(page)).toBeCloseTo(before, 1);
    // Turn buttons still turn it (the twin).
    await page.locator('section[aria-labelledby="name"]').getByRole('button', { name: 'Turn left' }).click();
    await expect.poll(() => theta(page)).toBeCloseTo(before + 30, 0);

    // The scope shows one still frame.
    const scope = page.locator('.scope-screen canvas');
    await scope.scrollIntoViewIfNeeded();
    const a = await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.waitForTimeout(500);
    expect(await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(a);

    // The drive section is a normal figure: scrolling past it doesn't take it apart, the slider does.
    const h = await page.locator('#terrament').evaluate((s) => s.getBoundingClientRect().height);
    expect(h).toBeLessThan(await page.evaluate(() => innerHeight * 1.5));
    await page.locator('#terrament').scrollIntoViewIfNeeded();
    await ready(drive(page));
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    expect(await apart(page)).toBe(0);
    await page.getByRole('slider', { name: 'Explode' }).fill('900');
    await expect.poll(() => apart(page)).toBeGreaterThan(0.85);
  });

test('home: the scope trace moves when motion is allowed, and Hold stops it', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const scope = page.locator('.scope-screen canvas');
  await scope.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const a = await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(300);
  expect(await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(a);
  await page.getByRole('button', { name: 'Hold' }).click();
  await page.waitForTimeout(200);
  const b = await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(400);
  expect(await scope.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(b);
});

test('keyboard: a focused model turns with the arrow keys', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await ready(hero(page));
  const before = await theta(page);
  await hero(page).focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => theta(page)).toBeCloseTo(before + 15, 0);
});

test('hero: the hand tilts all the way over the top, not only around', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await ready(hero(page));
  const phi = () => hero(page).getAttribute('data-phi').then(Number);
  const before = await phi();
  await hero(page).focus();
  for (let i = 0; i < 25; i++) await page.keyboard.press('ArrowUp'); // 8 degrees each, 200 in all
  await expect.poll(phi).toBeLessThan(before - 150);
});

test('Turn buttons glide to the new angle when motion is allowed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await ready(hero(page));
  // Scroll and pointer turn the hero too, so bring the button into view and rest the pointer on it first.
  const button = page.locator('section[aria-labelledby="name"]').getByRole('button', { name: 'Turn left' });
  await button.scrollIntoViewIfNeeded();
  await button.hover();
  await page.waitForTimeout(1500);
  const before = await theta(page);
  const seen = hero(page).evaluate((c) => {
    const out: number[] = [];
    const end = performance.now() + 900;
    return new Promise<number[]>((done) => {
      const read = () => {
        out.push(Number(c.dataset.theta));
        if (performance.now() < end) requestAnimationFrame(read);
        else done(out);
      };
      read();
    });
  });
  await button.click();
  const values = await seen;
  expect(values.some((v) => v > before + 3 && v < before + 27), 'an in-between angle on the way').toBe(true);
  await expect.poll(() => theta(page)).toBeCloseTo(before + 30, 0);
});

test('case study: small models load when near, the big one waits for its button', async ({ page }) => {
  const glbs: string[] = [];
  page.on('request', (r) => r.url().endsWith('.glb') && glbs.push(new URL(r.url()).pathname));
  await page.goto('/work/gravity-storage-drive', { waitUntil: 'networkidle' });
  expect(glbs.filter((g) => g.includes('geared-module')), 'the 3 MB model before asking').toEqual([]);
  const load = page.getByRole('button', { name: /^Load 3D model \(3\.\d MB\)/ });
  await expect(load).toHaveCount(1);
  for (const c of await page.locator('figure canvas').all()) await c.scrollIntoViewIfNeeded();
  await expect.poll(() => glbs.length).toBeGreaterThanOrEqual(2);
  await load.scrollIntoViewIfNeeded();
  await load.click();
  const slider = page.getByRole('slider', { name: 'Explode' });
  const fig = page.locator('figure').filter({ has: slider });
  await ready(fig.locator('canvas'), 90_000);
  await slider.fill('1000');
  await expect(fig.locator('canvas')).toHaveAttribute('data-explode', /^0\.99|^1/);
  await expect(fig).toContainText(/213 mm apart/);
});

test('phone: the hero model waits for the first touch', async ({ browser }) => {
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const glbs: string[] = [];
  page.on('request', (r) => r.url().endsWith('.glb') && glbs.push(r.url()));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  expect(glbs, 'models fetched before any interaction').toEqual([]);
  await page.mouse.wheel(0, 50);
  await expect.poll(() => glbs.length, { timeout: 15_000 }).toBeGreaterThan(0);
  await ctx.close();
});
