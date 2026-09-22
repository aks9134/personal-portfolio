import { test, expect } from '@playwright/test';
import { routes, widths } from './site.config';

for (const route of routes) {
  test.describe(`page ${route}`, () => {
    test('loads clean: no console errors, no failed requests, no third-party calls', async ({ page, baseURL }) => {
      const problems: string[] = [];
      const thirdParty = new Set<string>();
      const optimizer: string[] = [];
      const origin = new URL(baseURL!).origin;
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`));
      page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.protocol.startsWith('http') && u.origin !== origin) thirdParty.add(u.origin);
        if (u.pathname === '/_next/image') optimizer.push(r.url());
      });
      const res = await page.goto(route, { waitUntil: 'networkidle' });
      expect(res?.status(), 'HTTP status').toBeLessThan(400);
      expect(problems, 'console errors and failed requests').toEqual([]);
      // Default for Allen's sites is zero third-party requests (privacy, speed).
      // If a third party is approved, list it in DECISIONS-LOG.md and allow it here.
      expect([...thirdParty], 'third-party origins contacted').toEqual([]);
      // Images come pre-sized from the media pipeline (src/lib/image-widths.ts). Next's runtime optimizer
      // wedged on an aborted request under `next start` (DECISIONS-LOG 2026-09-21), so it stays off.
      expect(optimizer, 'requests to the /_next/image optimizer').toEqual([]);
    });

    test('document basics: title, description, lang, one h1, heading order, alt text', async ({ page }) => {
      await page.goto(route);
      expect((await page.title()).trim().length, 'title').toBeGreaterThan(3);
      await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{20,}/);
      await expect(page.locator('meta[name="viewport"]')).not.toHaveAttribute('content', /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\D|$)/);
      await expect(page.locator('h1')).toHaveCount(1);
      const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1], `heading jump at index ${i}: ${levels.join(',')}`).toBeLessThanOrEqual(1);
      }
      // Light DOM only: Playwright locators pierce shadow roots, and model-viewer ships its own AR anchors.
      const authored = await page.evaluate(() => ({
        noAlt: document.querySelectorAll('img:not([alt])').length,
        dead: document.querySelectorAll('a:not([href]), a[href="#"], a[href=""]').length,
      }));
      expect(authored.noAlt, 'images without alt attribute').toBe(0);
      expect(authored.dead, 'dead links').toBe(0);
    });

    test('no horizontal scroll at any width', async ({ page }) => {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
        // Pages clip sideways overflow, so a too-wide image is cut off silently instead of scrolling. Catch it here.
        const cut = await page.evaluate(() =>
          [...document.querySelectorAll('img, video, model-viewer')]
            .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
            .map((el) => el.getAttribute('src') ?? el.tagName),
        );
        expect(cut, `media cut off at ${width}px`).toEqual([]);
      }
    });

    test('keyboard: first Tab lands on something visible with a focus indicator', async ({ page, browserName }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'keyboard check runs once');
      await page.goto(route);
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        return { tag: el.tagName, outline: s.outlineStyle !== 'none' && s.outlineWidth !== '0px', shadow: s.boxShadow !== 'none' };
      });
      expect(info, 'nothing received focus').not.toBeNull();
      expect(info!.outline || info!.shadow, `focused <${info!.tag}> shows no focus ring`).toBe(true);
    });

    test('reduced motion: no running animations longer than a blink', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'runs once');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route, { waitUntil: 'networkidle' });
      const running = await page.evaluate(() =>
        document.getAnimations().filter((a) => {
          const t = a.effect?.getComputedTiming();
          return a.playState === 'running' && t && (t.iterations === Infinity || Number(t.duration) > 200);
        }).length,
      );
      expect(running, 'animations still running under prefers-reduced-motion').toBe(0);
    });

    test('screenshots for human review', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'runs once');
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: 'networkidle' });
        const name = `${route === '/' ? 'home' : route.replace(/\W+/g, '-').replace(/^-|-$/g, '')}-${width}.png`;
        await page.screenshot({ path: `test-results/review/${name}`, fullPage: true });
      }
    });
  });
}

test('internal links resolve', async ({ page, request, baseURL }) => {
  const seen = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    hrefs.filter((h) => h.startsWith(baseURL!)).forEach((h) => seen.add(h.split('#')[0]));
  }
  for (const url of seen) {
    const res = await request.get(url);
    expect(res.status(), url).toBeLessThan(400);
  }
});
