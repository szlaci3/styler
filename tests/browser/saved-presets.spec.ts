import { test, expect } from '@playwright/test';
import { seedStyle } from '../../src/styles/presets.ts';
import { constrainStyle } from '../../shared/constraints.ts';

test('saves effective styles, preserves cascade and additions after reload, and supports inspiration and generated sources', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  const requests: { inspiration?: { id: string }; snapshot: unknown[] }[] = [];
  await page.route('**/api/generate', async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: body.id, provenance: 'antigravity' }, body.snapshot) } });
  });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Edit button color', exact: true }).fill('#123456');
  await page.getByRole('textbox', { name: 'Edit button color', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Unset button background-color', exact: true }).click();
  await page.getByRole('button', { name: 'Add declaration to page', exact: true }).click();
  await page.getByLabel('New property for page', { exact: true }).fill('font-style');
  await page.getByLabel('New value for page', { exact: true }).fill('italic');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toHaveText('Saved as S8.');
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
  expect(requests).toHaveLength(0);
  await page.reload();
  await page.getByRole('button', { name: 'S8: Tidal Atelier', exact: true }).click();
  await page.locator('.sample-button').first().evaluate(el => el.classList.add('sample-card-link'));
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('color', 'rgb(18, 52, 86)');
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(36, 91, 99)');
  await expect(page.locator('.sample-page')).toHaveCSS('font-style', 'italic');
  await expect(page.getByRole('textbox', { name: 'Edit page font-style', exact: true })).toHaveValue('italic');
  await expect(page.getByRole('button', { name: 'Lock button color', exact: true })).toHaveAttribute('aria-pressed', 'false');
  // A new lock remains above the saved layers; resetting reveals the saved value.
  const edit = page.getByRole('textbox', { name: 'Edit button color', exact: true });
  await edit.fill('#abcdef'); await edit.press('Enter');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toHaveText('Saved as S9.');
  await page.getByRole('button', { name: 'Reset button color', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('color', 'rgb(18, 52, 86)');
  await page.getByRole('button', { name: 'S9: Tidal Atelier', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('color', 'rgb(171, 205, 239)');
  await page.getByRole('button', { name: 'Use S8 as inspiration', exact: true }).click();
  await page.locator('.generate-button').click();
  await page.clock.runFor(10);
  await expect(page.locator('.generate-button')).toBeEnabled();
  expect(requests).toHaveLength(4);
  expect(requests.every(body => body.inspiration?.id === 'S8')).toBe(true);
  await page.locator('[data-slot="G4"] .style-card').click();
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toHaveText('Saved as S10.');
  // Saving must not reset/arm the shared generation countdown.
  await page.clock.runFor(10_000);
  expect(requests).toHaveLength(4);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Scrollable predefined styles' }).locator('.style-card')).toHaveCount(10);
  await expect(page.locator('[data-slot]')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/saved-presets.png' });
});

test('concurrent tabs allocate unique numbers and refresh saved cards', async ({ page, context }) => {
  await page.goto('/');
  const second = await context.newPage(); await second.goto('/');
  await expect(page.getByRole('button', { name: 'Save preset', exact: true })).toBeEnabled();
  await expect(second.getByRole('button', { name: 'Save preset', exact: true })).toBeEnabled();
  await Promise.all([page.getByRole('button', { name: 'Save preset', exact: true }).click(), second.getByRole('button', { name: 'Save preset', exact: true }).click()]);
  for (const tab of [page, second]) {
    await expect(tab.getByRole('button', { name: 'S8: Tidal Atelier', exact: true })).toBeAttached();
    await expect(tab.getByRole('button', { name: 'S9: Tidal Atelier', exact: true })).toBeAttached();
  }
});

test('failed writes show an error without a phantom preset and can be retried', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save preset', exact: true })).toBeEnabled();
  await page.evaluate(() => {
    IDBObjectStore.prototype.add = function() { throw new DOMException('Quota exhausted', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toContainText('Could not save');
  await expect(page.getByRole('region', { name: 'Scrollable predefined styles' }).locator('.style-card')).toHaveCount(7);
  await page.reload();
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toHaveText('Saved as S8.');
});
