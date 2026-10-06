import { test, expect } from '@playwright/test';
import { resume } from '../src/lib/resume';
import { site } from '../src/lib/site';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'runs once'));

test('jump menu: Ctrl+K opens it, typing filters, Enter goes, Escape closes and gives focus back', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const trigger = page.locator('footer').getByRole('button', { name: /Jump to/ });
  await trigger.focus();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Jump to' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.type('weld');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/work\/tpu-weld-rig$/);
});

// v5 is dark only. A visitor who switched v4's Lights on still has that choice saved; it must not half-apply.
test('a saved v4 light preference leaves the Console sheet dark, and the Sound switch is remembered', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pref-theme', 'light'));
  await page.goto('/about', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(5, 7, 10)');
  // The twin: a switch that does exist is saved and comes back on the next page.
  const sound = page.locator('footer').getByRole('button', { name: 'Sound' });
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await page.goto('/privacy');
  await expect(page.locator('html')).toHaveAttribute('data-sound', 'on');
  await expect(page.locator('footer').getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'true');
});

test('switches: Motion off stops CSS animation site-wide (and on is the default)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const motion = page.locator('footer').getByRole('button', { name: 'Motion' });
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await motion.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  const dur = await page.evaluate(() => getComputedStyle(document.querySelector('.link, .btn, a')!).transitionDuration);
  expect(dur.split(',').every((d) => parseFloat(d) <= 0.001)).toBe(true);
});

// Curtiss-Wright text stays inside Allen's resume (HANDOFF rules): the home page shows the resume entry verbatim and
// none of the longer About detail.
test('Curtiss-Wright on the home page is the resume text and nothing more', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main).toContainText(site.cwText);
  for (const d of site.cwDetail) await expect(main).not.toContainText(d.slice(0, 60));
  expect(resume.jobs[0].text).toBe(site.cwText);
});
