import { test, expect } from '@playwright/test';
import { seedStyle } from '../../src/styles/presets.ts';
import { makeInspectionGroups } from '../../src/preview/inspection.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseGenerationRequest } from '../../server/generation.ts';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
});

test('typed values lock, stay green across selections, and Reset restores the preceding constraint', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Edit button background-color', exact: true });
  const lock = page.getByRole('button', { name: 'Lock button background-color', exact: true });
  await lock.click();
  await input.fill('#008000'); await input.press('Enter');
  await expect(input).toHaveCSS('color', 'rgb(0, 200, 0)');
  await expect(lock).toBeDisabled();
  await expect(lock).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Unset button background-color', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(0, 128, 0)');
  await page.screenshot({ path: 'test-results/v2-css-edited-value.png' });
  await input.fill('#123456'); await input.press('Enter');
  await page.getByRole('button', { name: 'Reset button background-color', exact: true }).click();
  await expect(lock).toBeEnabled();
  await expect(lock).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(36, 91, 99)');
  await lock.click();
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(214, 177, 239)');
  await page.getByRole('button', { name: 'Unset button background-color', exact: true }).click();
  await input.fill('#abcdef'); await input.press('Enter');
  await page.getByRole('button', { name: 'Reset button background-color', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unset button background-color', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('invalid edits never reach preview; added declarations use L/Del and disappear on deletion', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Edit button background-color', exact: true });
  await input.fill('url(https://example.com)'); await input.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toContainText('Unsupported value');
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(36, 91, 99)');
  await input.press('Escape');
  await expect(input).not.toHaveValue('url(https://example.com)');
  const existing = makeInspectionGroups([seedStyle]).find(group => group.selectorId === 'page')!.properties;
  const property = 'font-style', value = 'italic';
  expect(existing).not.toContain(property);
  await page.getByRole('button', { name: 'Add declaration to page', exact: true }).click();
  const form = page.locator('.css-add-form');
  const bounds = await form.locator('input, button').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, right: rect.right };
  }));
  expect(Math.max(...bounds.map(rect => rect.top))).toBeLessThan(Math.min(...bounds.map(rect => rect.bottom)));
  expect(bounds.at(-1)!.right).toBeLessThanOrEqual((await form.boundingBox())!.x + (await form.boundingBox())!.width);
  await page.screenshot({ path: 'test-results/v2-add-declaration-inline.png' });
  await expect(page.locator('.css-declaration dd > span')).toHaveCount(0);
  await page.getByLabel('New property for page', { exact: true }).fill('position');
  await page.getByRole('textbox', { name: 'New value for page', exact: true }).fill('fixed');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('supported property');
  await page.getByLabel('New property for page', { exact: true }).fill(property);
  await page.getByRole('textbox', { name: 'New value for page', exact: true }).fill(value);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const row = page.locator(`[data-declaration="page:${property}"]`);
  await expect(row.locator('dt')).toHaveCSS('color', 'rgb(0, 200, 0)');
  await expect(row.locator('input')).toHaveCSS('color', 'rgb(0, 200, 0)');
  await expect(row.getByRole('button', { name: `Lock page ${property}`, exact: true })).toBeDisabled();
  await row.getByRole('button', { name: `Delete page ${property}`, exact: true }).click();
  await expect(row).toHaveCount(0);
});

test('generation captures typed locks and active edits do not queue another batch', async ({ page }) => {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON()); requests.push(request);
    await hold;
    await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot) } });
  });
  const input = page.getByRole('textbox', { name: 'Edit button background-color', exact: true });
  await input.fill('#008000'); await input.press('Enter');
  await page.getByRole('button', { name: 'Add declaration to page', exact: true }).click();
  await page.getByLabel('New property for page', { exact: true }).fill('font-style');
  await page.getByLabel('New value for page', { exact: true }).fill('italic');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.clock.runFor(8_001);
  await expect.poll(() => requests.length).toBe(2);
  await input.fill('#123456'); await input.press('Enter');
  release();
  await page.clock.runFor(10);
  await expect(page.locator('.generate-button')).toBeEnabled();
  expect(requests).toHaveLength(4);
  for (const request of requests) {
    expect(request.snapshot).toContainEqual({ selectorId: 'button', property: 'background-color', state: 'locked', value: '#008000' });
    expect(request.snapshot).toContainEqual({ selectorId: 'page', property: 'font-style', state: 'locked', value: 'italic' });
  }
  await expect(page.locator('[data-slot="G2"] .style-card')).toBeAttached();
  await page.locator('[data-slot="G2"] .style-card').click();
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(page.getByRole('status', { name: 'Generation constraints', exact: true })).toContainText('have not been used');
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(4);
  await page.getByRole('button', { name: 'Reset button background-color', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lock button background-color', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lock button background-color', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Delete page font-style', exact: true }).click();
  // The accepted result keeps its declaration; deleting the authoring override
  // restores normal controls on a row now also discovered in session history.
  await expect(page.locator('[data-declaration="page:font-style"] dt')).not.toHaveClass('css-edited');
  await expect(page.locator('.sample-page')).toHaveCSS('font-style', 'italic');
  await page.getByRole('button', { name: 'S1: Tidal Atelier', exact: true }).click();
  await expect(page.locator('.sample-page')).toHaveCSS('font-style', 'normal');
  await page.screenshot({ path: 'test-results/v2-css-editing.png' });
});
