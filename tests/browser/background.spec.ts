import { test, expect } from '@playwright/test';
import { parseGenerationRequest } from '../../server/generation.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { seedStyle } from '../../src/styles/presets.ts';

test('background polling survives a minute, retains two lanes and captured inputs, and retries only manually', async ({ page }) => {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  const jobs = new Map<string, ReturnType<typeof parseGenerationRequest>>();
  let ready = false, polls = 0;
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON());
    requests.push(request);
    const jobId = `1761825600000-${requests.length.toString(16).padStart(64, '0')}`;
    jobs.set(jobId, request);
    await route.fulfill({ status: 202, json: { jobId, status: 'pending' } });
  });
  await page.route('**/api/generation-status?*', async route => {
    polls++;
    const jobId = new URL(route.request().url()).searchParams.get('job')!;
    const request = jobs.get(jobId)!;
    if (!ready) await route.fulfill({ status: 202, json: { status: 'pending' } });
    else if (request.id === 'G4' && requests.filter(r => r.id === 'G4').length === 1) {
      await route.fulfill({ status: 504, json: { error: 'Generation timed out.' } });
    } else await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, provenance: 'antigravity' }, request.snapshot) } });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-30T12:01:00Z'));
  const generate = page.locator('.generate-button');
  await page.getByRole('button', { name: 'Use S4 as inspiration', exact: true }).click();
  await page.getByRole('button', { name: 'Lock button background-color', exact: true }).click();
  await generate.click();
  await page.clock.runFor(10);
  await expect.poll(() => requests.length).toBe(2);
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  // Let each mocked network read finish before advancing past its fetch timeout.
  for (let tick = 0; tick < 35; tick++) {
    await page.clock.runFor(2000);
    await expect.poll(() => polls).toBeGreaterThanOrEqual((tick + 1) * 2);
    await page.evaluate(() => Promise.resolve());
  }
  await expect.poll(() => polls).toBeGreaterThan(1);
  expect(requests).toHaveLength(2);
  await expect(generate).toBeDisabled();
  await expect(page.locator('[data-slot="G2"] .style-card')).toBeAttached();
  ready = true;
  for (let wave = 0; wave < 3; wave++) {
    await page.clock.runFor(2010);
    await expect.poll(() => requests.length).toBe(Math.min(4, 4 + wave));
  }
  await expect(generate).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Retry G4', exact: true })).toBeEnabled();
  for (const request of requests) {
    expect(request.inspiration?.id).toBe('S4');
    expect(request.snapshot).toEqual(requests[0]!.snapshot);
  }
  await expect(page.getByRole('status', { name: 'Generation constraints', exact: true })).toContainText('have not been used');
  await page.clock.runFor(60_000);
  expect(requests).toHaveLength(4);
  const finalPolls = polls;
  await page.clock.runFor(10_000);
  expect(polls).toBe(finalPolls);
  await page.getByRole('button', { name: 'Retry G4', exact: true }).click();
  await expect.poll(() => requests.length).toBe(5);
  await page.clock.runFor(2010);
  await expect(generate).toBeEnabled();
  await expect(page.locator('[data-slot="G4"] .style-card')).toBeAttached();
  expect(requests[4]).toEqual(requests[0]);
  await expect(page.locator('[data-slot]')).toHaveCount(7);
});

test('malformed background acknowledgements and failed status reads do not resubmit paid requests', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => {
    calls++;
    await route.fulfill({ status: 202, json: { jobId: 'https://evil.example/steal', status: 'pending' } });
  });
  await page.goto('/');
  await page.locator('.generate-button').click();
  await expect(page.getByRole('button', { name: 'Retry G4', exact: true })).toBeEnabled();
  expect(calls).toBe(4);
  await expect(page.locator('[data-slot="G4"]')).toContainText('Invalid generated style.');
  await page.route('**/api/generate', async route => {
    calls++;
    await route.fulfill({ status: 202, json: { jobId: `1761825600000-${'a'.repeat(64)}`, status: 'pending' } });
  });
  await page.route('**/api/generation-status?*', async route => { await route.abort('failed'); });
  await page.getByRole('button', { name: 'Retry G4', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry G4', exact: true })).toBeEnabled();
  expect(calls).toBe(5);
  await expect(page.locator('[data-slot="G4"]')).toContainText('Generation failed. Retry manually.');
});
