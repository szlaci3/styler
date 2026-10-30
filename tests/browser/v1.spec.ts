import { test, expect, type Locator, type Page } from '@playwright/test';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseGenerationRequest } from '../../server/generation.ts';
import { seedStyle } from '../../src/styles/presets.ts';

async function activate(page: Page, control: Locator) {
  await control.focus();
  await page.keyboard.press('Enter');
}

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`V1 combined timer, inspiration, progressive results, edits, retry and history with ${reducedMotion} motion`, async ({ page }) => {
    const requests: ReturnType<typeof parseGenerationRequest>[] = [];
    const releases = new Map<string, (success: boolean) => void>();
    const errors: string[] = [];
    let hold = false, running = 0, peak = 0;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/generate', async route => {
      const request = parseGenerationRequest(route.request().postDataJSON());
      requests.push(request);
      peak = Math.max(peak, ++running);
      const success = hold ? await new Promise<boolean>(resolve => { releases.set(request.id, resolve); }) : true;
      running--;
      if (!success) await route.fulfill({ status: 429, json: { error: 'Quota exceeded.' } });
      else await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: request.id, name: 'V1 acceptance', provenance: 'antigravity' }, request.snapshot) } });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
    await page.goto('/');
    await page.clock.pauseAt(new Date('2026-10-30T12:01:00Z'));
    const identity = await page.locator('.sample-page').elementHandle();
    const generate = page.locator('.generate-button');
    const status = page.getByRole('status', { name: 'Generation constraints', exact: true });
    const selected = page.getByRole('status', { name: 'Selected style', exact: true });
    const rail = page.getByRole('region', { name: 'Scrollable generated styles', exact: true });
    await page.getByRole('textbox', { name: 'Email address' }).fill('v1@example.com');
    await page.getByRole('switch', { name: 'Quiet hours' }).uncheck();
    await page.clock.runFor(60_000);
    expect(requests).toHaveLength(0);

    // Preserve two older batches before exercising the complete V1 flow.
    for (let batch = 0; batch < 2; batch++) {
      await activate(page, generate);
      await page.clock.runFor(400);
      await expect(generate).toBeEnabled();
    }
    await expect(page.locator('[data-slot]')).toHaveCount(13);
    expect(requests).toHaveLength(10);
    await activate(page, page.getByRole('button', { name: 'Use G3 as inspiration', exact: true }));
    await activate(page, page.getByRole('button', { name: 'Lock button background-color', exact: true }));
    await activate(page, page.getByRole('button', { name: 'Unset card padding-top', exact: true }));
    await rail.evaluate(element => { element.scrollTop = 0; });
    const otherRails = page.locator('.preview-scroll, .style-panel:not(.generated-panel) .rail-scroll, .inspector-scroll');
    const otherPositions = await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop));
    hold = true;
    await page.clock.runFor(5000);
    await expect(generate).toHaveAccessibleName('Sending in 3…');
    await page.clock.runFor(1000);
    await expect(generate).toHaveAccessibleName('Sending in 2…');
    await page.clock.runFor(1999);
    await expect(generate).toHaveAccessibleName('Sending in 1…');
    expect(requests).toHaveLength(10);
    await page.clock.runFor(401);
    await expect(page.locator('[data-slot]')).toHaveCount(19);
    await expect(page.locator('[data-slot="G14"] .style-card')).toBeAttached();
    await expect.poll(() => requests.length).toBe(12);
    await expect(generate).toHaveAccessibleName('Generating…');
    await expect(generate).toBeDisabled();
    await expect(page.locator('[data-slot="G14"]')).toBeInViewport();
    expect(await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop))).toEqual(otherPositions);
    await expect(selected).toContainText('S1');
    const captured = requests[10]!;
    expect(captured.inspiration?.id).toBe('G3');
    expect(captured.snapshot).toEqual([
      { selectorId: 'button', property: 'background-color', state: 'locked', value: '#344e41' },
      { selectorId: 'card', property: 'padding-top', state: 'unset' },
    ]);

    // Active changes stay live and never affect requests that are still waiting.
    await activate(page, page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }));
    await activate(page, page.getByRole('button', { name: 'Unset card padding-bottom', exact: true }));
    await activate(page, page.getByRole('button', { name: 'S3: After Hours', exact: true }));
    await page.clock.runFor(400);
    await expect(page.getByRole('button', { name: 'Find your space', exact: true })).toHaveCSS('background-color', 'rgb(52, 78, 65)');
    await expect(status).toContainText('This batch uses earlier constraints.');
    await page.clock.runFor(10_000);
    expect(requests).toHaveLength(12);

    // Additional results may arrive before quick AI; a failed slot does not stall siblings.
    releases.get('G16')!(true);
    await expect(page.locator('[data-slot="G16"] .style-card')).toBeAttached();
    await expect.poll(() => releases.has('G17')).toBe(true);
    await expect(page.locator('[data-slot="G15"]')).toContainText('Generating…');
    releases.get('G17')!(false);
    await expect.poll(() => releases.has('G18')).toBe(true);
    await expect(page.getByRole('button', { name: 'Retry G17', exact: true })).toBeDisabled();
    releases.get('G15')!(true);
    await expect.poll(() => releases.has('G19')).toBe(true);
    releases.get('G18')!(true);
    releases.get('G19')!(true);
    await expect(generate).toBeEnabled();
    expect(requests).toHaveLength(15);
    expect(peak).toBe(2);
    for (const request of requests.slice(10)) {
      expect(request.snapshot).toEqual(captured.snapshot);
      expect(request.inspiration).toEqual(captured.inspiration);
    }
    await expect(page.locator('[data-slot] .style-card')).toHaveCount(18);
    await expect(status).toContainText('Current constraints have not been used.');
    await page.clock.runFor(60_000);
    expect(requests).toHaveLength(15);
    await expect(selected).toContainText('S3');

    hold = false;
    await activate(page, page.getByRole('button', { name: 'Retry G17', exact: true }));
    await expect(page.locator('[data-slot="G17"] .style-card')).toBeAttached();
    await expect(generate).toBeEnabled();
    expect(requests[15]).toEqual(requests.find(request => request.id === 'G17'));
    await expect(page.locator('[data-slot]')).toHaveCount(19);
    await expect(status).toContainText('have not been used');
    // Inspect an accepted old-context result while keeping the live constraints.
    await activate(page, page.locator('[data-slot="G17"] .style-card'));
    await page.clock.runFor(400);
    const css = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-selected]')!.textContent!);
    expect(css).toContain('background-color: #344e41;');
    expect(css).not.toMatch(/\.sample-card\s*\{[^}]*padding-top:/);
    await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('v1@example.com');
    await expect(page.getByRole('switch', { name: 'Quiet hours' })).not.toBeChecked();
    expect(await identity!.evaluate(element => element.isConnected)).toBe(true);

    // A fresh generated inspiration arms eight seconds; keyboard manual send cancels it.
    await activate(page, page.getByRole('button', { name: 'Use G16 as inspiration', exact: true }));
    await rail.evaluate(element => { element.scrollTop = 0; });
    await page.clock.runFor(7000);
    await expect(generate).toHaveAccessibleName('Sending in 1…');
    await activate(page, generate);
    await page.clock.runFor(400);
    await expect(generate).toBeEnabled();
    await expect(page.locator('[data-slot]')).toHaveCount(25);
    await expect(page.locator('[data-slot="G20"]')).toBeInViewport();
    for (const request of requests.slice(16)) {
      expect(request.inspiration?.id).toBe('G16');
      expect(request.snapshot).toContainEqual({ selectorId: 'card', property: 'padding-bottom', state: 'unset' });
    }
    await expect(status).not.toContainText('have not been used');
    await expect(selected).toContainText('G17');
    await page.clock.runFor(60_000);
    expect(requests).toHaveLength(21);
    await expect(page.locator('[data-slot="G3"] .style-card')).toBeAttached();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/m18-v1-${reducedMotion}.png` });
  });
}
