import { test, expect, type Locator, type Page } from '@playwright/test';

// The 3D. Two engines: the Console (home page and the machine at the top of each project: point clouds, scan, explode,
// driven by scroll) and the case-study stage further down a project (engine.ts: data-ready, data-theta, data-phi,
// data-explode). Every "nothing moves" check has a twin that proves the same thing does move when motion is allowed,
// so a broken feature can't pass as a restrained one.
test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'WebGL checks run on the desktop profile'));
test.slow();

const live = (page: Page) => expect(page.locator('.lc-dot.is-on').first()).toBeVisible({ timeout: 90_000 });
const title = (page: Page) => page.locator('.lc-title .sr-only').textContent();
const consoleCanvas = (page: Page) => page.locator('main canvas').first();
/** Two captures of the console canvas a second apart, with the pointer still: equal means nothing moved. */
async function still(page: Page) {
  const a = await consoleCanvas(page).screenshot();
  await page.waitForTimeout(1200);
  const b = await consoleCanvas(page).screenshot();
  return a.equals(b);
}
async function motionOff(page: Page) {
  await page.addInitScript(() => localStorage.setItem('pref-motion', 'off'));
}
/** The case-study stage further down a project page. */
const stage = (page: Page) => page.locator('figure canvas').first();
const ready = (c: Locator, timeout = 60_000) => expect(c).toHaveAttribute('data-ready', '', { timeout });
const theta = (page: Page) => stage(page).getAttribute('data-theta').then(Number);

test('home: every model loads from this site and the console goes live without errors', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign = new Set<string>();
  const problems: string[] = [];
  const glbs: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== origin) foreign.add(u.origin);
    if (u.pathname.endsWith('.glb')) glbs.push(u.pathname);
  });
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  expect(glbs.length, 'the console loads its models').toBeGreaterThanOrEqual(3);
  expect([...foreign]).toEqual([]);
  expect(problems).toEqual([]);
});

test('home: scrolling moves the console from one machine to the next (motion allowed)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  await expect.poll(() => title(page)).toBe('Robotic hand');
  await page.mouse.move(720, 450);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 300);
  await expect.poll(() => title(page), { timeout: 10_000 }).not.toBe('Robotic hand');
  expect(await still(page), 'the canvas moves on its own when motion is allowed').toBe(false);
});

for (const how of ['OS setting', 'site switch'] as const)
  test(`motion off (${how}): the console holds still, and scrolling still changes the machine`, async ({ page }) => {
    if (how === 'OS setting') await page.emulateMedia({ reducedMotion: 'reduce' });
    else await motionOff(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await live(page);
    await page.mouse.move(720, 450);
    // Still, but not blank: a frozen scene is a detailed picture, a dead canvas compresses to almost nothing.
    expect((await consoleCanvas(page).screenshot()).length, 'the canvas has drawn the scene').toBeGreaterThan(30_000);
    expect(await still(page), 'nothing moves by itself').toBe(true);
    // The twin: the content still answers the scroll.
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 300);
    await expect.poll(() => title(page), { timeout: 10_000 }).not.toBe('Robotic hand');
  });

/** At the top the scattered field shows and stays; a scroll forms the machine; back at the top it is the field again. */
async function scrollForms(page: Page) {
  const phase = page.locator('.lc-scan span').first();
  await page.waitForTimeout(3000);
  await expect(phase, 'nothing forms by itself').toHaveText('Acquiring');
  await page.mouse.move(720, 450);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 300);
  await expect(phase).toHaveText('Solid', { timeout: 8_000 });
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(phase, 'back at the top, the field again').toHaveText('Acquiring', { timeout: 8_000 });
}

test('home: the page opens on the scattered field and scroll alone forms the first machine; solid at once under reduced motion', async ({ page, browser }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  await expect(page.locator('.lc-brief')).not.toHaveClass(/is-on/);
  await scrollForms(page);
  expect(await title(page)).toBe('Robotic hand');
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const reduced = await ctx.newPage();
  await reduced.goto('/', { waitUntil: 'networkidle' });
  await live(reduced);
  await expect(reduced.locator('.lc-scan span').first()).toHaveText('Solid', { timeout: 1_500 });
  await ctx.close();
});

test('project file: opens on the scattered field, the scroll forms its machine, and the top returns to the field', async ({ page }) => {
  await page.goto('/work/micro-vibration-canceller', { waitUntil: 'networkidle' });
  // The scene has loaded and measured its model before anything is judged.
  await expect(page.locator('.lc-tele')).not.toContainText('measuring', { timeout: 60_000 });
  await scrollForms(page);
});

test('home without WebGL: says so, shows the brief, and leaves no empty scroll run', async ({ page }) => {
  await page.addInitScript(() => {
    // A browser without WebGL: every webgl context request comes back empty.
    const proto = HTMLCanvasElement.prototype as unknown as { getContext: (type: string, ...rest: unknown[]) => unknown };
    const get = proto.getContext;
    proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : get.call(this, type, ...rest);
    };
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.lc-status')).toContainText('3D view unavailable', { timeout: 30_000 });
  await expect(page.locator('.lc-brief')).toHaveClass(/is-on/);
  await expect(page.locator('.lc-brief a')).toBeVisible();
  const run = await page.evaluate(() => (document.querySelector('main > div') as HTMLElement).offsetHeight - innerHeight);
  expect(run, 'the run collapses to one screen').toBeLessThanOrEqual(2);
  await expect(page.locator('.lc-targets')).toBeHidden();
});

test('home: keys 1 to 4 jump to their machine, and not while the jump menu is open', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  for (const [key, name] of [['3', 'Micro-vibration canceller'], ['4', 'Linear harmonic drive'], ['2', 'Geared module']] as const) {
    await page.keyboard.press(key);
    await expect.poll(() => title(page), { timeout: 10_000 }).toBe(name);
  }
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Jump to' })).toBeVisible();
  await page.keyboard.type('1');
  await page.waitForTimeout(1500);
  expect(await title(page)).toBe('Geared module');
});

test('home: Index glides down without racing the machines; reduced motion lands at once', async ({ page, browser }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  await page.keyboard.press('2');
  await expect.poll(() => title(page), { timeout: 10_000 }).toBe('Geared module');
  await page.evaluate(() => {
    const w = window as unknown as { __s: [number, number, string | null][] };
    w.__s = [];
    const t0 = performance.now();
    const loop = () => {
      w.__s.push([performance.now() - t0, scrollY, document.querySelector('.lc-title .sr-only')?.textContent ?? null]);
      if (w.__s.length < 300) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  // A direct click: the test tool would first scroll the link into view.
  await page.evaluate(() => (document.querySelector('.lc-top a[href="#index"]') as HTMLElement).click());
  await page.waitForTimeout(2200);
  const s = await page.evaluate(() => (window as unknown as { __s: [number, number, string | null][] }).__s);
  const moving = s.filter((x, i) => i > 0 && x[1] !== s[i - 1][1]);
  expect(moving.at(-1)![0] - moving[0][0], 'a glide, not a jump (at most 0.7 s since 2026-10-06)').toBeGreaterThan(300);
  expect(s.some((x, i) => i > 0 && x[1] < s[i - 1][1] - 1), 'never backwards').toBe(false);
  expect(new Set(s.filter((x) => x[1] < s.at(-1)![1] - 2).map((x) => x[2])).size, 'the console holds one machine').toBe(1);
  await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('index')!.getBoundingClientRect().top))).toBeLessThan(4);

  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const reduced = await ctx.newPage();
  await reduced.goto('/', { waitUntil: 'networkidle' });
  await reduced.evaluate(() => (document.querySelector('.lc-top a[href="#index"]') as HTMLElement).click());
  await reduced.waitForTimeout(150);
  expect(await reduced.evaluate(() => Math.abs(document.getElementById('index')!.getBoundingClientRect().top))).toBeLessThan(4);
  await ctx.close();
});

test('phone: the console waits for the first touch before loading models', async ({ browser }) => {
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

test('touchscreen laptop: the console and a project machine start as the page loads, with no touch', async ({ browser }) => {
  // A touch pointer on a laptop-sized screen: only phones wait for the first touch.
  const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 1440, height: 900 }, screen: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'the browser reports a touch pointer').toBe(true);
  await page.goto('/', { waitUntil: 'networkidle' });
  await live(page);
  await page.goto('/work/micro-vibration-canceller', { waitUntil: 'networkidle' });
  await expect(page.locator('.lc-tele')).not.toContainText('measuring', { timeout: 60_000 });
  await ctx.close();
});

test('phone: a project page waits for the first touch before loading its machine', async ({ browser }) => {
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const glbs: string[] = [];
  page.on('request', (r) => r.url().endsWith('.glb') && glbs.push(r.url()));
  await page.goto('/work/robotic-arm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  expect(glbs, 'models fetched before any interaction').toEqual([]);
  await page.mouse.wheel(0, 50);
  await expect.poll(() => glbs.length, { timeout: 15_000 }).toBeGreaterThan(0);
  await ctx.close();
});

test('case study: the opener loads its machine, small models load when near, the big one waits for its button', async ({ page }) => {
  const glbs: string[] = [];
  page.on('request', (r) => r.url().endsWith('.glb') && glbs.push(new URL(r.url()).pathname));
  await page.goto('/work/gravity-storage-drive', { waitUntil: 'networkidle' });
  await live(page);
  // The machine at the top is the geared module; nothing else has loaded yet.
  expect(new Set(glbs.map((g) => g.split('/').pop()!.split('.')[0]))).toEqual(new Set(['geared-module']));
  const load = page.getByRole('button', { name: /^Load 3D model \(3\.\d MB\)/ });
  await expect(load).toHaveCount(1);
  for (const c of await page.locator('figure canvas').all()) await c.scrollIntoViewIfNeeded();
  await expect.poll(() => new Set(glbs).size).toBeGreaterThanOrEqual(3);
  await load.scrollIntoViewIfNeeded();
  await load.click();
  const slider = page.getByRole('slider', { name: 'Explode' });
  const fig = page.locator('figure').filter({ has: slider });
  await ready(fig.locator('canvas'), 90_000);
  await slider.fill('1000');
  await expect(fig.locator('canvas')).toHaveAttribute('data-explode', /^0\.99|^1/);
  await expect(fig).toContainText(/213 mm apart/);
});

// (v4's tilt-over-the-top check went with the home-page hand, the one model allowed to flip; case models stop short.)
test('case study: a focused model turns with the arrow keys', async ({ page }) => {
  await page.goto('/work/robotic-arm', { waitUntil: 'networkidle' });
  await stage(page).scrollIntoViewIfNeeded();
  await ready(stage(page));
  const before = await theta(page);
  await stage(page).focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => theta(page)).toBeCloseTo(before + 15, 0);
  const phi = () => stage(page).getAttribute('data-phi').then(Number);
  const p0 = await phi();
  await page.keyboard.press('ArrowUp');
  await expect.poll(phi).toBeLessThan(p0); // and it tilts with the up arrow
});

test('case study: Turn buttons glide to the new angle when motion is allowed, and jump with motion off', async ({ page }) => {
  await page.goto('/work/robotic-arm', { waitUntil: 'networkidle' });
  const button = page.locator('figure').getByRole('button', { name: 'Turn left' }).first();
  await stage(page).scrollIntoViewIfNeeded();
  await ready(stage(page));
  await button.hover();
  await page.waitForTimeout(1500);
  const before = await theta(page);
  const seen = stage(page).evaluate((c) => {
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

test('a case-study model that keeps losing its GPU memory stops reloading and keeps its poster', async ({ page }) => {
  await page.goto('/work/robotic-arm', { waitUntil: 'networkidle' });
  const lose = () => stage(page).evaluate((c: HTMLCanvasElement) => (c.getContext('webgl2') ?? c.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext());
  await stage(page).scrollIntoViewIfNeeded();
  await ready(stage(page));
  await lose();
  await ready(stage(page)); // one loss can be passing (a tab switch): it rebuilds once
  await lose();
  await page.waitForTimeout(3000);
  await expect(stage(page)).not.toHaveAttribute('data-ready');
  await expect(page.locator('figure').filter({ has: page.locator('canvas') }).first().locator('img').first()).toHaveCSS('opacity', '1');
});
