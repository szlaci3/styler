import { test, expect } from '@playwright/test';
import { seedStyle } from '../../src/styles/presets.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseGenerationRequest } from '../../server/generation.ts';
import { EXPRESSIONS } from '../../shared/generation.ts';

test('six slots settle progressively with two AI lanes, immutable context, partial failures and one-slot retry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  const releases = new Map<string, (success: boolean) => void>();
  let running = 0, peak = 0;
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON());
    requests.push(request);
    peak = Math.max(peak, ++running);
    const success = await new Promise<boolean>(resolve => { releases.set(request.id, resolve); });
    running--;
    if (!success) await route.fulfill({ status: 429, json: { error: 'Quota exceeded.' } });
    else await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot) } });
  });
  await page.goto('/');
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  const generate = page.getByRole('button', { name: 'Generate', exact: true });
  await generate.click();
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  await expect(page.locator('[data-slot="G2"] .style-card')).toBeVisible();
  for (const [index, expression] of EXPRESSIONS.entries()) {
    await expect(page.locator(`[data-slot="G${index + 3}"] .generation-slot strong`)).toHaveText(`G${index + 3} · ${expression}`);
  }
  await expect.poll(() => requests.map(r => r.id)).toEqual(['G3', 'G4']);
  const original = requests[0]!;
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  releases.get('G4')!(true);
  await expect(page.locator('[data-slot="G4"] .style-card')).toBeAttached();
  await expect.poll(() => requests.map(r => r.id)).toEqual(['G3', 'G4', 'G5']);
  // Additional work progresses while the quick slot is still pending.
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generating…');
  await expect(page.getByRole('button', { name: 'Generating…', exact: true })).toBeDisabled();
  const rail = page.getByRole('region', { name: 'Scrollable generated styles', exact: true });
  const startScroll = await rail.evaluate(element => element.scrollTop);
  releases.get('G5')!(false);
  await expect(page.getByRole('button', { name: 'Retry G5' })).toBeDisabled();
  await expect.poll(() => requests.at(-1)?.id).toBe('G6');
  releases.get('G3')!(true);
  await expect.poll(() => requests.at(-1)?.id).toBe('G7');
  releases.get('G7')!(true);
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Generating…', exact: true })).toBeDisabled();
  expect(await rail.evaluate(element => element.scrollTop)).toBe(startScroll);
  releases.get('G6')!(true);
  await expect(generate).toBeEnabled();
  expect(requests).toHaveLength(5);
  expect(peak).toBe(2);
  expect(requests.map(r => r.expression)).toEqual(EXPRESSIONS);
  for (const request of requests) expect(request.snapshot).toEqual(original.snapshot);
  expect(original.snapshot).toContainEqual({ selectorId: 'button', property: 'color', state: 'locked', value: '#fcfbf7' });
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
  await expect(page.locator('[data-slot="G5"]')).toContainText('Quota exceeded.');
  const failed = requests.find(r => r.id === 'G5');
  await page.getByRole('button', { name: 'Retry G5' }).click();
  await expect.poll(() => requests.length).toBe(6);
  expect(requests[5]).toEqual(failed);
  releases.get('G5')!(true);
  await expect(page.locator('[data-slot="G5"] .style-card')).toBeAttached();
  await expect(generate).toBeEnabled();
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  await expect(page.locator('[data-slot] .style-card')).toHaveCount(7);
  for (const [index, expression] of EXPRESSIONS.entries()) {
    await expect(page.locator(`[data-slot="G${index + 3}"] .style-card-id > span`)).toHaveText(expression);
  }
  await page.locator('[data-slot="G3"] .style-card').click();
  await expect(page.locator('[data-slot="G3"] .style-card-id > span')).toHaveText('Professional');
  await expect(page.locator('[data-slot="G2"] .style-card-id > span')).toHaveText('Joker');
  await page.screenshot({ path: 'test-results/expressions-ready.png' });
  expect(requests).toHaveLength(6); // Five original calls, one manual retry; no dedup/regeneration.
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`history scrolls only the generated rail to the start of a tall batch with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.route('**/api/generate', async route => {
      const body = route.request().postDataJSON();
      await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: body.id, provenance: 'antigravity' }, body.snapshot) } });
    });
    await page.goto('/');
    const generate = page.getByRole('button', { name: 'Generate', exact: true });
    for (let index = 0; index < 3; index++) { await generate.click(); await expect(generate).toBeEnabled(); }
    await expect(page.locator('[data-slot]')).toHaveCount(19);
    await page.getByRole('button', { name: `G1: ${seedStyle.name} (seed)`, exact: true }).click();
    const rail = page.getByRole('region', { name: 'Scrollable generated styles', exact: true });
    await rail.evaluate(el => { el.scrollTop = 0; });
    const otherRails = page.locator('.preview-scroll, .style-panel:not(.generated-panel) .rail-scroll, .inspector-scroll');
    const previous = await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop));
    await generate.click();
    await expect(page.locator('[data-slot]')).toHaveCount(25);
    await expect(page.locator('[data-slot="G20"]')).toBeInViewport();
    await expect.poll(() => page.locator('[data-slot="G20"]').evaluate(element => {
      const rail = element.closest('.rail-scroll')!;
      return Math.abs(element.getBoundingClientRect().top - rail.getBoundingClientRect().top - 19);
    })).toBeLessThan(2);
    await expect(page.locator('[data-slot="G25"]')).not.toBeInViewport();
    expect(await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop))).toEqual(previous);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('G1');
    await page.screenshot({ path: `test-results/m15-history-${reducedMotion}.png` });
  });
}

test('same-tick double clicks create one six-slot batch and invalid AI output leaves siblings intact', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => {
    calls++;
    const body = route.request().postDataJSON();
    const style = body.id === 'G3' ? { ...seedStyle, id: body.id, provenance: 'antigravity', rules: [
      { selectorId: 'page', declarations: [{ id: 'page:color', property: 'color', value: 'url(https://unsafe.example)' }] },
    ] } : { ...seedStyle, id: body.id, provenance: 'antigravity' };
    await route.fulfill({ json: { style } });
  });
  await page.goto('/');
  await page.locator('.generate-button').evaluate((element: HTMLButtonElement) => { element.click(); element.click(); });
  await expect(page.getByRole('button', { name: 'Retry G3' })).toBeEnabled();
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  expect(calls).toBe(5);
  await expect(page.locator('[data-slot] .style-card')).toHaveCount(6);
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generation failed. Retry manually.');
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeEnabled();
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
});
