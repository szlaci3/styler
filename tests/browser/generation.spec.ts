import { test, expect } from '@playwright/test';
import { seedStyle } from '../../src/styles/presets.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseGenerationRequest } from '../../server/generation.ts';
import { ENABLED_EXPRESSIONS } from '../../shared/generation.ts';

test('only Joker and Professional are reserved; incomplete AI retains Joker and retries its original context', async ({ page }) => {
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
    if (!success) await route.fulfill({ status: 502, json: { error: 'Generation incomplete.' } });
    else await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot) } });
  });
  await page.goto('/');
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  const generate = page.getByRole('button', { name: 'Generate', exact: true });
  await generate.click();
  await expect(page.locator('[data-slot]')).toHaveCount(3);
  await expect(page.locator('[data-slot="G2"] .style-card')).toBeVisible();
  for (const [index, expression] of ENABLED_EXPRESSIONS.entries()) {
    await expect(page.locator(`[data-slot="G${index + 3}"] .generation-slot strong`)).toHaveText(`G${index + 3} · ${expression}`);
  }
  await expect.poll(() => requests.map(r => r.id)).toEqual(['G3']);
  const original = requests[0]!;
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generating…');
  await expect(page.getByRole('button', { name: 'Generating…', exact: true })).toBeDisabled();
  releases.get('G3')!(false);
  await expect(generate).toBeEnabled();
  expect(requests).toHaveLength(1);
  expect(peak).toBe(1);
  expect(requests.map(r => r.expression)).toEqual(ENABLED_EXPRESSIONS);
  for (const request of requests) expect(request.snapshot).toEqual(original.snapshot);
  expect(original.snapshot).toContainEqual({ selectorId: 'button', property: 'color', state: 'locked', value: '#fcfbf7' });
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generation incomplete.');
  await page.getByRole('button', { name: 'Retry G3' }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toEqual(original);
  releases.get('G3')!(true);
  await expect(page.locator('[data-slot="G3"] .style-card')).toBeAttached();
  await expect(generate).toBeEnabled();
  await expect(page.locator('[data-slot]')).toHaveCount(3);
  await expect(page.locator('[data-slot] .style-card')).toHaveCount(3);
  for (const [index, expression] of ENABLED_EXPRESSIONS.entries()) {
    await expect(page.locator(`[data-slot="G${index + 3}"] .style-card-id > span`)).toHaveText(expression);
  }
  await page.locator('[data-slot="G3"] .style-card').click();
  await expect(page.locator('[data-slot="G3"] .style-card-id > span')).toHaveText('Professional');
  await expect(page.locator('[data-slot="G2"] .style-card-id > span')).toHaveText('Joker');
  await page.screenshot({ path: 'test-results/expressions-ready.png' });
  expect(requests).toHaveLength(2); // One original call and one explicit retry.
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
    await expect(page.locator('[data-slot]')).toHaveCount(7);
    await page.getByRole('button', { name: `G1: ${seedStyle.name} (seed)`, exact: true }).click();
    const rail = page.getByRole('region', { name: 'Scrollable generated styles', exact: true });
    await rail.evaluate(el => { el.scrollTop = 0; });
    const otherRails = page.locator('.preview-scroll, .style-panel:not(.generated-panel) .rail-scroll, .inspector-scroll');
    const previous = await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop));
    await generate.click();
    await expect(page.locator('[data-slot]')).toHaveCount(9);
    await expect(page.locator('[data-slot="G8"]')).toBeInViewport();
    // A two-card batch can fit in the rail: scrolling naturally clamps at its end.
    await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect(await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop))).toEqual(previous);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('G1');
    await page.screenshot({ path: `test-results/m15-history-${reducedMotion}.png` });
  });
}

test('same-tick double clicks create one pair and invalid AI output leaves Joker intact', async ({ page }) => {
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
  await expect(page.locator('[data-slot]')).toHaveCount(3);
  expect(calls).toBe(1);
  await expect(page.locator('[data-slot] .style-card')).toHaveCount(2);
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generation failed. Retry manually.');
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeEnabled();
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
});
