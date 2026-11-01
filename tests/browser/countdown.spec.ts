import { test, expect, type Page } from '@playwright/test';
import { parseGenerationRequest } from '../../server/generation.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { seedStyle } from '../../src/styles/presets.ts';

async function openWithPausedClock(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await page.goto('/');
  await expect(page.getByRole('switch', { name: 'Auto (8 sec)' })).toBeEnabled();
  await page.clock.pauseAt(new Date('2026-10-30T12:01:00Z'));
}

function successfulStyle(input: unknown) {
  const request = parseGenerationRequest(input);
  return constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot);
}

test('browser-test server has no paid provider credential', async ({ request }) => {
  const response = await request.post('/api/generate', { data: { id: 'G999', snapshot: [] } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ error: 'Missing server API key.' });
});

test('eight-second boundary, final 3/2/1 labels and one automatic six-slot batch', async ({ page }) => {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON()); requests.push(request);
    await route.fulfill({ json: { style: successfulStyle(request) } });
  });
  await openWithPausedClock(page);
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  const generate = page.locator('.generate-button');
  await page.clock.runFor(4999);
  await expect(generate).toHaveAccessibleName('Generate');
  expect(requests).toHaveLength(0);
  await page.clock.runFor(1);
  await expect(generate).toHaveAccessibleName('Sending in 3…');
  await page.screenshot({ path: 'test-results/m16-countdown.png' });
  await page.clock.runFor(1000);
  await expect(generate).toHaveAccessibleName('Sending in 2…');
  await page.clock.runFor(1000);
  await expect(generate).toHaveAccessibleName('Sending in 1…');
  await page.clock.runFor(999);
  expect(requests).toHaveLength(0);
  await page.clock.runFor(1);
  await page.clock.runFor(10);
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  await expect(generate).toHaveAccessibleName('Generate');
  expect(requests).toHaveLength(4);
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  for (const request of requests) expect(request.snapshot).toEqual([{ selectorId: 'button', property: 'color', state: 'locked', value: '#fcfbf7' }]);
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(4);
  await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S1');
});

test('CSS states and cross-rail inspiration changes/clears reset one shared deadline', async ({ page }) => {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON()); requests.push(request);
    await route.fulfill({ json: { style: successfulStyle(request) } });
  });
  await openWithPausedClock(page);
  const generate = page.locator('.generate-button');
  const advance = async (ms: number, label: string) => {
    await page.clock.runFor(ms); await expect(generate).toHaveAccessibleName(label); expect(requests).toHaveLength(0);
  };
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await advance(6000, 'Sending in 2…');
  await page.getByRole('button', { name: 'Unset button color', exact: true }).click();
  await advance(5000, 'Sending in 3…');
  await page.getByRole('button', { name: 'Unset button color', exact: true }).click(); // Free
  await advance(6000, 'Sending in 2…');
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  await advance(5000, 'Sending in 3…');
  await page.getByRole('button', { name: 'Use S3 as inspiration', exact: true }).click();
  await advance(6000, 'Sending in 2…');
  await page.getByRole('button', { name: 'Clear inspiration', exact: true }).click();
  await advance(5000, 'Sending in 3…');
  await page.getByRole('button', { name: 'Use G1 as inspiration', exact: true }).click();
  await advance(7000, 'Sending in 1…');
  await page.getByRole('button', { name: 'Use G1 as inspiration', exact: true }).click(); // Clear via card
  await advance(7999, 'Sending in 1…');
  await page.clock.runFor(11);
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  expect(requests).toHaveLength(4);
  for (const request of requests) { expect(request.snapshot).toEqual([]); expect(request.inspiration).toBeNull(); }
});

test('preview selection, hover, scrolling and sample controls do not arm or postpone the timer', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => { calls++; await route.fulfill({ json: { style: successfulStyle(route.request().postDataJSON()) } }); });
  await openWithPausedClock(page);
  const interact = async () => {
    await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('countdown@example.com');
    await page.getByRole('switch', { name: 'Quiet hours' }).uncheck();
    await page.getByText('Can I come for just one day?', { exact: true }).click();
    await page.getByRole('region', { name: 'Scrollable predefined styles', exact: true }).evaluate(element => { element.scrollTop = 100; });
    await page.locator('[data-declaration="page:color"]').hover();
  };
  await interact();
  await page.clock.runFor(60_000);
  expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Lock button background-color', exact: true }).click();
  await page.clock.runFor(4000);
  await interact();
  await page.clock.runFor(1000);
  await expect(page.locator('.generate-button')).toHaveAccessibleName('Sending in 3…');
  await page.clock.runFor(3010);
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  expect(calls).toBe(4);
  await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('countdown@example.com');
});

test('manual Generate and manual Retry cancel pending countdowns without duplicate batches', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => { calls++; await route.fulfill({ status: 503, json: { error: 'Provider unavailable.' } }); });
  await openWithPausedClock(page);
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.clock.runFor(7000);
  const generate = page.locator('.generate-button');
  await expect(generate).toHaveAccessibleName('Sending in 1…');
  await generate.focus(); await page.keyboard.press('Enter');
  await page.clock.runFor(10);
  await expect(page.getByRole('button', { name: 'Retry G4' })).toBeEnabled();
  await page.clock.runFor(60_000);
  expect(calls).toBe(4);
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  await page.clock.runFor(6000);
  await expect(generate).toHaveAccessibleName('Sending in 2…');
  await page.getByRole('button', { name: 'Retry G4' }).click();
  await expect(page.getByRole('button', { name: 'Retry G4' })).toBeEnabled();
  await page.clock.runFor(60_000);
  expect(calls).toBe(5);
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  await expect(generate).toHaveAccessibleName('Generate');
});

test('active-batch edits never arm or queue a timer; a later fresh edit can start one', async ({ page }) => {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  const releases: (() => void)[] = [];
  let released = false;
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON()); requests.push(request);
    if (!released) await new Promise<void>(resolve => { releases.push(resolve); });
    await route.fulfill({ json: { style: successfulStyle(request) } });
  });
  await openWithPausedClock(page);
  await page.getByRole('button', { name: 'Use S4 as inspiration', exact: true }).click();
  await page.clock.runFor(8010);
  await expect.poll(() => requests.length).toBe(2);
  await expect(page.locator('.generate-button')).toHaveAccessibleName('Generating…');
  await expect(page.locator('.generate-button')).toBeDisabled();
  await page.getByRole('switch', { name: 'Auto (8 sec)' }).uncheck();
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  await page.getByRole('switch', { name: 'Auto (8 sec)' }).check();
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(2);
  released = true; releases.forEach(resolve => resolve());
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  await expect(page.locator('.generate-button')).toHaveAccessibleName('Generate');
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(4);
  for (const request of requests) { expect(request.snapshot).toEqual([]); expect(request.inspiration?.id).toBe('S4'); }
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.clock.runFor(8010);
  await expect(page.locator('[data-slot="G13"] .style-card')).toBeAttached();
  expect(requests).toHaveLength(8);
});
