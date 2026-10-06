import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './site.config';

// Automated checks cannot judge meaning (is this alt text useful, does this focus order make sense).
// Passing this is required, and is not the same as being accessible:
// the manual keyboard and screen-reader pass in TESTING.md still applies.
// v5 is dark only (controls.spec checks that a saved v4 light preference changes nothing), so one pass per page.
for (const route of routes) {
  test(`axe WCAG 2.2 AA: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} nodes] e.g. ${v.nodes[0]?.target}`);
    expect(summary, 'axe violations').toEqual([]);
  });
}

// The home page once the first machine is solid (its brief and link showing), checked as a visitor sees it then.
test('axe WCAG 2.2 AA: / with the first machine solid', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'needs the console live (desktop starts it at once)');
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.lc-dot.is-on').first()).toBeVisible({ timeout: 60_000 });
  // Scroll alone forms the machine now: scroll into the first one's solid stretch.
  await page.mouse.move(720, 450);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 300);
  await expect(page.locator('.lc-brief')).toHaveClass(/is-on/, { timeout: 15_000 });
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} e.g. ${v.nodes[0]?.target}`)).toEqual([]);
});
