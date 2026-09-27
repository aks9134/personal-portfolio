import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './site.config';

// Automated checks cannot judge meaning (is this alt text useful, does this focus order make sense).
// Passing this is required, and is not the same as being accessible:
// the manual keyboard and screen-reader pass in TESTING.md still applies.
for (const route of routes) {
  // The site is dark whatever the OS says; the Lights switch (saved in localStorage) gives the light sheet.
  for (const sheet of ['dark', 'light'] as const) {
    test(`axe WCAG 2.2 AA: ${route} (${sheet})`, async ({ page }) => {
      if (sheet === 'light') await page.addInitScript(() => localStorage.setItem('pref-theme', 'light'));
      await page.goto(route, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} nodes] e.g. ${v.nodes[0]?.target}`);
      expect(summary, 'axe violations').toEqual([]);
    });
  }
}
