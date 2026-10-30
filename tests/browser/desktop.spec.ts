import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
  test(`four-column layout and pinned Generate at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Make room for better work.' })).toBeVisible();
    for (const name of ['Website preview', 'Presets', 'Generated', 'CSS inspector']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    const generate = page.getByRole('button', { name: 'Generate', exact: true });
    await expect(generate).toBeVisible();
    await expect(generate).toBeEnabled();
    const panels = await page.locator('.workspace-panel').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
    }));
    expect(panels).toHaveLength(4);
    expect(panels[0]!.width / viewport.width).toBeGreaterThan(.5);
    for (let index = 1; index < panels.length; index++) {
      expect(panels[index]!.left).toBeCloseTo(panels[index - 1]!.right, 0);
      expect(panels[index]!.top).toEqual(panels[0]!.top);
    }
    expect(panels[3]!.right).toBeLessThanOrEqual(viewport.width);
    expect(await page.evaluate(() => ({
      width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    }))).toEqual({ width: viewport.width, height: viewport.height });
    const inspector = page.getByRole('region', { name: 'Scrollable CSS declarations', exact: true });
    await inspector.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await inspector.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    const buttonRect = await generate.boundingBox();
    expect(buttonRect!.y + buttonRect!.height).toBeLessThan(viewport.height);
    expect(buttonRect!.y).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
    // Restore initial view for visual QA.
    await inspector.evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: `test-results/m2-desktop-${viewport.width}.png` });
  });
}

test('preview interactions work without sending AI or external requests', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  const health = await page.request.get('/api/health');
  expect(await health.json()).toEqual({ status: 'ok', service: 'styler-local' });
  await page.getByRole('button', { name: 'Find your space' }).click();
  const preview = page.getByRole('region', { name: 'Scrollable website preview' });
  await expect.poll(() => preview.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  const details = page.getByRole('button', { name: 'Take a closer look' }).first();
  await details.click();
  await expect(details).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('A private desk, reading lamp, and a view of the garden.')).toBeVisible();
  const quiet = page.getByRole('switch', { name: 'Quiet hours' });
  await expect(quiet).toBeChecked();
  await quiet.uncheck();
  await expect(quiet).not.toBeChecked();
  await page.getByRole('textbox', { name: 'Email address' }).fill('hello@example.com');
  await page.getByRole('button', { name: 'Keep me posted' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'No email was sent.' })).toHaveText('You’re on the sample list. No email was sent.');
  expect(requests.filter(url => !url.startsWith(`${test.info().project.use.baseURL}/`))).toEqual([]);
  expect(requests.filter(url => /interactions|generate|voice-token/.test(url))).toEqual([]);
});

test('each column scrolls independently when its content exceeds the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const names = ['Scrollable website preview', 'Scrollable predefined styles', 'Scrollable generated styles', 'Scrollable CSS declarations'];
  // M2 has one reference per rail. Add test-only overflow to verify the layout contract.
  for (const name of names.slice(1, 3)) {
    await page.getByRole('region', { name, exact: true }).evaluate(element => {
      const sample = element.querySelector('.style-card')!;
      for (let index = 0; index < 20; index++) element.append(sample.cloneNode(true));
    });
  }
  for (const name of names) {
    for (const resetName of names) await page.getByRole('region', { name: resetName, exact: true }).evaluate(element => { element.scrollTop = 0; });
    const region = page.getByRole('region', { name, exact: true });
    await region.hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => region.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    for (const other of names.filter(other => other !== name)) {
      expect(await page.getByRole('region', { name: other, exact: true }).evaluate(element => element.scrollTop)).toBe(0);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible();
  }
});

test('keyboard users can reach the preview controls and email form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const email = page.getByRole('textbox', { name: 'Email address' });
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.type('keyboard@example.com');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Keep me posted' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'No email was sent.' })).toContainText('No email was sent.');
});
