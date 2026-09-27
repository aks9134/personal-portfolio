import { test, expect } from '@playwright/test';
import { resume } from '../src/lib/resume';
import { site } from '../src/lib/site';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'runs once'));

test('jump menu: Ctrl+K opens it, typing filters, Enter goes, Escape closes and gives focus back', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const trigger = page.locator('header').getByRole('button', { name: /Jump to/ });
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

test('switches: Lights changes the sheet and is remembered across pages', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', 'light');
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  await page.locator('header').getByRole('button', { name: 'Lights' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).not.toBe(bg);
  await page.goto('/about');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('header').getByRole('button', { name: 'Lights' })).toHaveAttribute('aria-pressed', 'true');
});

test('switches: Motion off stops CSS animation site-wide (and on is the default)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const motion = page.locator('header').getByRole('button', { name: 'Motion' });
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
