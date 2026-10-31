import { test, expect, type Page } from '@playwright/test';
import { parseGenerationRequest } from '../../server/generation.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { seedStyle } from '../../src/styles/presets.ts';

async function setup(page: Page, outcome: 'success' | 'partial' | 'failure' = 'success') {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  const releases = new Map<string, () => void>();
  let hold = true;
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON());
    requests.push(request);
    if (hold) await new Promise<void>(resolve => { releases.set(request.id, resolve); });
    if (outcome === 'failure' || (outcome === 'partial' && request.id === 'G3')) {
      await route.fulfill({ status: 503, json: { error: 'Provider unavailable.' } });
    } else {
      await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot) } });
    }
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-30T12:01:00Z'));
  return { requests, releases, releaseAll: () => { hold = false; releases.forEach(resolve => resolve()); } };
}

for (const outcome of ['success', 'partial', 'failure'] as const) {
  test(`live edits retain the batch snapshot and report unused constraints after ${outcome}`, async ({ page }) => {
    const mock = await setup(page, outcome);
    const generate = page.locator('.generate-button');
    const status = page.getByRole('status', { name: 'Generation constraints', exact: true });
    await expect(status).not.toContainText('have not been used');
    await page.getByRole('button', { name: 'Use S4 as inspiration', exact: true }).click();
    await generate.click();
    await page.clock.runFor(10);
    await expect.poll(() => mock.requests.length).toBe(1);
    await page.getByRole('button', { name: 'Lock button background-color', exact: true }).click();
    const captured = await page.locator('[data-declaration="button:background-color"] dd').innerText();
    await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
    await expect(page.locator('[data-declaration="button:background-color"] dd')).toHaveText(captured);
    await expect(page.locator('.preview-host .sample-button').first()).toHaveCSS('background-color', 'rgb(36, 91, 99)');
    await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
    await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
    await expect(status).toContainText('This batch uses earlier constraints.');
    await page.clock.runFor(20_000);
    expect(mock.requests).toHaveLength(1);
    mock.releaseAll();
    await expect(generate).toBeEnabled();
    await expect(status).toHaveText('Current constraints have not been used. Generate when ready.');
    expect(mock.requests).toHaveLength(1);
    for (const request of mock.requests) {
      expect(request.snapshot).toEqual([]);
      expect(request.inspiration?.id).toBe('S4');
    }
    await page.clock.runFor(60_000);
    expect(mock.requests).toHaveLength(1);
    await expect(generate).toHaveAccessibleName('Generate');
    if (outcome === 'partial') await page.screenshot({ path: 'test-results/m17-unused-constraints.png' });
    // Manual generation consumes the live context, even after total failure.
    await generate.click();
    await page.clock.runFor(10);
    await expect(generate).toBeEnabled();
    expect(mock.requests).toHaveLength(2);
    for (const request of mock.requests.slice(1)) {
      expect(request.inspiration?.id).toBe('S2');
      expect(request.snapshot).toContainEqual({ selectorId: 'button', property: 'background-color', state: 'locked', value: '#245b63' });
      expect(request.snapshot).toContainEqual({ selectorId: 'card', property: 'padding-top', state: 'unset' });
    }
    await expect(status).not.toContainText('have not been used');
    await page.clock.runFor(60_000);
    expect(mock.requests).toHaveLength(2);
  });
}

test('reverting active CSS and inspiration edits clears the notice without scheduling work', async ({ page }) => {
  const mock = await setup(page);
  const generate = page.locator('.generate-button');
  const status = page.getByRole('status', { name: 'Generation constraints', exact: true });
  await page.getByRole('button', { name: 'Use S4 as inspiration', exact: true }).click();
  await generate.click();
  await page.clock.runFor(10);
  await expect.poll(() => mock.requests.length).toBe(1);
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  await expect(status).toContainText('earlier constraints');
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  await page.getByRole('button', { name: 'Use S4 as inspiration', exact: true }).click();
  await expect(status).not.toContainText('earlier constraints');
  mock.releaseAll();
  await expect(generate).toBeEnabled();
  await expect(status).not.toContainText('have not been used');
  await page.clock.runFor(60_000);
  expect(mock.requests).toHaveLength(1);
});

test('retry preserves unused-input status and old snapshot; a fresh edit starts the next countdown', async ({ page }) => {
  const mock = await setup(page, 'partial');
  const generate = page.locator('.generate-button');
  const status = page.getByRole('status', { name: 'Generation constraints', exact: true });
  await generate.click();
  await page.clock.runFor(10);
  await expect.poll(() => mock.requests.length).toBe(1);
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  mock.releaseAll();
  await expect(generate).toBeEnabled();
  await expect(status).toContainText('have not been used');
  await page.getByRole('button', { name: 'Retry G3' }).click();
  await expect(generate).toBeEnabled();
  expect(mock.requests[1]).toEqual(mock.requests[0]);
  await expect(status).toContainText('have not been used');
  await page.clock.runFor(60_000);
  expect(mock.requests).toHaveLength(2);
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  await page.clock.runFor(7999);
  expect(mock.requests).toHaveLength(2);
  await page.clock.runFor(11);
  await expect(generate).toBeEnabled();
  expect(mock.requests).toHaveLength(3);
  await expect(status).not.toContainText('have not been used');
  // Retrying the older batch after a new full batch cannot change its status.
  await page.getByRole('button', { name: 'Retry G3' }).click();
  await expect(generate).toBeEnabled();
  expect(mock.requests[3]).toEqual(mock.requests[0]);
  await expect(status).not.toContainText('have not been used');
  await expect(page.locator('[data-slot]')).toHaveCount(5);
});

test('an edit at the final response boundary stays unqueued and uses the original last slot', async ({ page }) => {
  const mock = await setup(page);
  const generate = page.locator('.generate-button');
  await generate.click();
  await page.clock.runFor(10);
  await expect.poll(() => mock.requests.length).toBe(1);
  // Deliver the edit and final result together while the synchronous guard is busy.
  await page.exposeFunction('finishBatch', () => { mock.releases.get('G3')!(); });
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).evaluate(async element => {
    (element as HTMLButtonElement).click();
    await (window as unknown as { finishBatch: () => Promise<void> }).finishBatch();
  });
  await expect(generate).toBeEnabled();
  await expect(page.getByRole('status', { name: 'Generation constraints', exact: true })).toContainText('have not been used');
  await page.clock.runFor(60_000);
  expect(mock.requests).toHaveLength(1);
  expect(mock.requests.at(-1)?.snapshot).toEqual([]);
});
