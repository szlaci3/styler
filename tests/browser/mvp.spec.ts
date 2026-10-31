import { test, expect } from '@playwright/test';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseStyle } from '../../shared/style.ts';
import { parseGenerationRequest } from '../../server/generation.ts';
import { seedStyle } from '../../src/styles/presets.ts';

// A valid sparse addition exercises declarations that curated presets omit.
function resultFor(input: unknown) {
  const request = parseGenerationRequest(input);
  return constrainStyle(parseStyle({ ...seedStyle, id: request.id, name: 'Acceptance style', provenance: 'antigravity',
    rules: seedStyle.rules.map(rule => rule.selectorId === 'heading' ? { ...rule, declarations: [...rule.declarations,
      { id: 'heading:background-color', property: 'background-color', value: '#ddeeff' }] } : rule),
  }), request.snapshot);
}

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`complete MVP journey with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    const requests: ReturnType<typeof parseGenerationRequest>[] = [];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    let release!: () => void;
    await page.route('**/api/generate', async route => {
      const request = parseGenerationRequest(route.request().postDataJSON());
      requests.push(request);
      if (requests.length === 1) {
        await new Promise<void>(resolve => { release = resolve; });
        await route.fulfill({ status: 429, json: { error: 'Quota exceeded.' } });
      } else await route.fulfill({ json: { style: resultFor(request) } });
    });
    await page.goto('/');
    expect(requests).toHaveLength(0);
    const website = page.locator('.sample-page');
    const identity = await website.elementHandle();
    const previewButton = page.getByRole('button', { name: 'Find your space' });
    await page.getByRole('textbox', { name: 'Email address' }).fill('acceptance@example.com');
    await page.getByRole('switch', { name: 'Quiet hours' }).uncheck();
    await page.getByRole('button', { name: 'Take a closer look' }).first().click();

    const backgroundLock = page.getByRole('button', { name: 'Lock button background-color', exact: true });
    await backgroundLock.focus(); await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Lock card padding-top', exact: true }).click();
    await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
    await expect(previewButton).toHaveCSS('background-color', 'rgb(52, 78, 65)');
    await expect(page.locator('.sample-card').first()).toHaveCSS('padding-top', '14px');
    const unsetPadding = page.getByRole('button', { name: 'Unset card padding-top', exact: true });
    await unsetPadding.focus(); await page.keyboard.press('Enter');
    await expect(unsetPadding).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.sample-card').first()).toHaveCSS('padding-top', '20px');

    const generate = page.getByRole('button', { name: 'Generate', exact: true });
    await generate.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot]')).toHaveCount(7);
    await expect(page.locator('[data-slot="G2"] .style-card')).toBeVisible();
    await expect(page.locator('[data-slot="G3"]')).toContainText('Generating…');
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('S3');
    await expect.poll(() => requests.length).toBe(5);
    const captured = requests[0]!;
    expect(captured.snapshot).toEqual([
      { selectorId: 'button', property: 'background-color', state: 'locked', value: '#344e41' },
      { selectorId: 'card', property: 'padding-top', state: 'unset' },
    ]);
    await page.locator('[data-slot="G2"] .style-card').click();
    await expect(previewButton).toHaveCSS('background-color', 'rgb(52, 78, 65)');
    const jokerCss = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-selected]')!.textContent!);
    expect(jokerCss).not.toMatch(/\.sample-card\s*\{[^}]*padding-top:/);
    expect(jokerCss).toContain('background-color: #344e41;');

    // Live edits are allowed, but the pending AI and its retry keep the old snapshot.
    await backgroundLock.click();
    await expect(backgroundLock).toHaveAttribute('aria-pressed', 'false');
    release();
    const retry = page.getByRole('button', { name: 'Retry G3' });
    await expect(retry).toBeEnabled();
    await expect(page.locator('[data-slot="G3"]')).toContainText('Quota exceeded.');
    await retry.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot="G3"] .style-card')).toBeVisible();
    expect(requests.filter(r => r.id === 'G3')[1]).toEqual(captured);
    await expect(page.locator('[data-slot]')).toHaveCount(7);
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('G2');
    const ai = page.locator('[data-slot="G3"] .style-card');
    await ai.focus(); await page.keyboard.press('Space');
    await expect(previewButton).toHaveCSS('background-color', 'rgb(52, 78, 65)');
    const aiCss = await page.locator('.preview-host').evaluate(host => host.shadowRoot!.querySelector('[data-preview-selected]')!.textContent!);
    expect(aiCss).not.toMatch(/\.sample-card\s*\{[^}]*padding-top:/);

    const addedRow = page.locator('[data-declaration="heading:background-color"]');
    await expect(addedRow.locator('dd')).toHaveText('rgb(221, 238, 255);');
    const addedLock = page.getByRole('button', { name: 'Lock heading background-color', exact: true });
    await addedLock.focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'S2: Blueprint', exact: true }).click();
    await expect(addedLock).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.sample-heading')).toHaveCSS('background-color', 'rgb(221, 238, 255)');
    await addedLock.click();
    await expect(page.locator('.sample-heading')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(addedRow.locator('dd')).toHaveText('rgba(0, 0, 0, 0);');
    await ai.click();
    await expect(page.locator('.sample-heading')).toHaveCSS('background-color', 'rgb(221, 238, 255)');
    await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('acceptance@example.com');
    await expect(page.getByRole('switch', { name: 'Quiet hours' })).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Take a closer look' }).first()).toHaveAttribute('aria-expanded', 'true');
    expect(await identity!.evaluate(element => element.isConnected)).toBe(true);

    for (let index = 0; index < 3; index++) {
      await generate.click(); await expect(generate).toBeEnabled();
      await expect(page.locator(`[data-slot="G${13 + index * 6}"] .style-card`)).toBeAttached();
    }
    await page.getByRole('button', { name: `G1: ${seedStyle.name} (seed)`, exact: true }).click();
    const rail = page.getByRole('region', { name: 'Scrollable generated styles', exact: true });
    await rail.evaluate(element => { element.scrollTop = 0; });
    const otherRails = page.locator('.preview-scroll, .style-panel:not(.generated-panel) .rail-scroll, .inspector-scroll');
    const positions = await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop));
    await generate.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot]')).toHaveCount(31);
    await expect(page.locator('[data-slot="G26"]')).toBeInViewport();
    await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect(await otherRails.evaluateAll(elements => elements.map(element => element.scrollTop))).toEqual(positions);
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText('G1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/m12-journey-${reducedMotion}.png` });
  });
}

test('page load and preview interactions never generate; manual send cancels countdown and reload clears session', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  let calls = 0;
  await page.route('**/api/generate', async route => {
    calls++;
    await route.fulfill({ status: 504, json: { error: 'Generation timed out.' } });
  });
  await page.goto('/');
  await page.clock.fastForward(60_000);
  expect(calls).toBe(0);
  const lock = page.getByRole('button', { name: 'Lock button color', exact: true });
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await page.getByRole('switch').uncheck();
  await page.getByRole('textbox', { name: 'Email address' }).fill('manual@example.com');
  await page.getByRole('region', { name: 'Scrollable predefined styles', exact: true }).hover();
  await page.mouse.wheel(0, 400);
  await page.clock.fastForward(60_000);
  expect(calls).toBe(0);
  await lock.focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Unset card padding-top', exact: true }).click();
  const generate = page.getByRole('button', { name: 'Generate', exact: true });
  await generate.focus(); await page.keyboard.press('Enter');
  await page.clock.runFor(10);
  await expect(page.getByRole('button', { name: 'Retry G3' })).toBeEnabled();
  await expect(page.locator('[data-slot="G3"]')).toContainText('Generation timed out.');
  await page.getByRole('button', { name: 'S1: Foundation', exact: true }).click();
  await page.clock.fastForward(60_000);
  expect(calls).toBe(5);
  await expect(page.locator('[data-slot]')).toHaveCount(7);
  await page.reload();
  await page.clock.fastForward(60_000);
  await expect(page.locator('[data-slot]')).toHaveCount(1);
  await expect(lock).toHaveAttribute('aria-pressed', 'false');
  expect(calls).toBe(5);
});
