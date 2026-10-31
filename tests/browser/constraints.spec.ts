import { test, expect } from '@playwright/test';

test('locks survive selections, unset removes overrides, and originals remain intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const target = page.getByRole('button', { name: 'Find your space' });
  const lock = page.getByRole('button', { name: 'Lock button background-color', exact: true });
  await lock.click();
  await expect(lock).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Lock card padding-top', exact: true }).click();
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(target).toHaveCSS('background-color', 'rgb(36, 91, 99)');
  await expect(page.locator('.sample-card').first()).toHaveCSS('padding-top', '18px');
  await page.getByRole('button', { name: 'Unset button background-color', exact: true }).click();
  await expect(lock).toHaveAttribute('aria-pressed', 'false');
  await expect(target).toHaveCSS('background-color', 'rgb(214, 177, 239)');
  const css = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-locks]')!.textContent);
  expect(css).not.toContain('unset');
  await page.getByRole('button', { name: 'S1: Tidal Atelier', exact: true }).click();
  await expect(target).toHaveCSS('background-color', 'rgb(36, 91, 99)');
});

test('native cascade keeps specificity and source order independent of lock click order', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Real shadow-root elements intentionally overlap two bounded selector groups.
  await page.locator('.sample-button').first().evaluate(el => el.classList.add('sample-card-link'));
  const color = page.getByRole('button', { name: 'Find your space' });
  await expect(color).toHaveCSS('color', 'rgb(83, 103, 106)');
  for (const selector of ['details', 'button']) await page.getByRole('button', { name: `Lock ${selector} color`, exact: true }).click();
  const css1 = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-locks]')!.textContent);
  for (const selector of ['details', 'button']) await page.getByRole('button', { name: `Lock ${selector} color`, exact: true }).click();
  for (const selector of ['button', 'details']) await page.getByRole('button', { name: `Lock ${selector} color`, exact: true }).click();
  const css2 = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-locks]')!.textContent);
  expect(css1).toBe(css2);
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(color).toHaveCSS('color', 'rgb(83, 103, 106)');
  // An explicit child declaration still beats an inherited page lock.
  await page.getByRole('button', { name: 'Lock page color', exact: true }).click();
  await page.getByRole('button', { name: 'S1: Tidal Atelier', exact: true }).click();
  await expect(page.locator('.sample-heading')).toHaveCSS('color', 'rgb(243, 234, 247)');
  await expect(page.locator('.sample-copy').first()).toHaveCSS('color', 'rgb(83, 103, 106)');
});
