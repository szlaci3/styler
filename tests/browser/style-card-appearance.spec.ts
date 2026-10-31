import { test, expect, type Page } from '@playwright/test';
import { presets, seedStyle } from '../../src/styles/presets.ts';
import { constrainStyle } from '../../shared/constraints.ts';
import { parseGenerationRequest } from '../../server/generation.ts';
import { ENABLED_EXPRESSIONS } from '../../shared/generation.ts';

async function mockInspiredGeneration(page: Page) {
  const requests: ReturnType<typeof parseGenerationRequest>[] = [];
  await page.route('**/api/generate', async route => {
    const request = parseGenerationRequest(route.request().postDataJSON());
    requests.push(request);
    await route.fulfill({ json: { style: constrainStyle({
      ...(request.inspiration ?? seedStyle), id: request.id, provenance: 'antigravity',
    }, request.snapshot) } });
  });
  return requests;
}

for (const scenario of [
  { properties: ['background-color'], colorScheme: 'light' },
  { properties: ['color'], colorScheme: 'dark' },
  { properties: ['background-color', 'color'], colorScheme: 'dark' },
] as const) {
  test(`S3-inspired Playful swatch matches preview with ${scenario.properties.join(' and ')} Unset in ${scenario.colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scenario.colorScheme });
    const requests = await mockInspiredGeneration(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
    await page.getByRole('button', { name: 'Use S3 as inspiration', exact: true }).click();
    for (const property of scenario.properties) {
      await page.getByRole('button', { name: `Unset button ${property}`, exact: true }).click();
    }
    const generate = page.getByRole('button', { name: 'Generate', exact: true });
    await generate.click();
    await expect(generate).toBeEnabled();
    expect(requests).toHaveLength(ENABLED_EXPRESSIONS.length);
    const request = requests.find(entry => entry.expression === 'Playful')!;
    expect(request.inspiration?.id).toBe('S3');
    for (const property of scenario.properties) {
      expect(request.snapshot).toContainEqual({ selectorId: 'button', property, state: 'unset' });
    }

    const card = page.locator(`[data-slot="${request.id}"] .style-card`);
    const swatch = card.locator('.style-sample-button');
    const storedColors = await swatch.evaluate(element => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    await card.click();
    const preview = page.locator('.preview-host .sample-button').first();
    await expect(preview).toHaveCSS('background-color', storedColors.background);
    await expect(preview).toHaveCSS('color', storedColors.color);
    const selectedCss = await page.locator('.preview-host').evaluate(host =>
      host.shadowRoot!.querySelector('[data-preview-selected]')!.textContent!);
    const buttonRule = selectedCss.match(/\.preview-root \.sample-button \{([^}]*)\}/)?.[1];
    expect(buttonRule).toBeDefined();
    for (const property of scenario.properties) {
      expect(buttonRule).not.toMatch(new RegExp(`(^|;\\s*)${property}:`));
    }
    expect(selectedCss).not.toContain('unset');
    if (scenario.colorScheme === 'light') {
      await page.screenshot({ path: 'test-results/style-card-playful-unset.png' });
    }

    // A card represents its saved style independently of the selected preview.
    await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
    await expect(preview).toHaveCSS('background-color', 'rgb(214, 177, 239)');
    await expect(swatch).toHaveCSS('background-color', storedColors.background);
    await expect(swatch).toHaveCSS('color', storedColors.color);
  });
}

test('style cards show one centered name or expression with the requested rail spacing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockInspiredGeneration(page);
  await page.goto('/');
  for (const style of [...presets, seedStyle]) {
    const card = page.getByRole('button', {
      name: `${style.id}: ${style.name}${style.provenance === 'seed' ? ' (seed)' : ''}`, exact: true,
    });
    await expect(card.locator('.style-card-id')).toHaveText(style.name);
    await expect(card.locator('.style-sample-button')).toHaveText(style.id);
  }
  const generate = page.getByRole('button', { name: 'Generate', exact: true });
  await generate.click();
  await expect(generate).toBeEnabled();
  for (const [index, expression] of ['Joker', 'Harlequin', ...ENABLED_EXPRESSIONS].entries()) {
    const card = page.locator(`[data-slot="G${index + 2}"] .style-card`);
    await expect(card.locator('.style-card-id')).toHaveText(expression);
  }
  await expect(page.locator('.rail-caption')).toHaveCount(0);
  for (const label of await page.locator('.style-card-id').all()) {
    await expect(label).toHaveCSS('text-align', 'center');
  }
  for (const wrapper of await page.locator('.style-card-wrapper').all()) {
    await expect(wrapper).toHaveCSS('margin-bottom', '18px');
  }
  await page.locator('[data-slot="G5"] .style-card').click();
  await expect(page.locator('[data-slot="G5"] .style-card-id')).toHaveText('Playful');
  await page.screenshot({ path: 'test-results/style-card-labels.png' });
});
