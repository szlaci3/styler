import { test, expect } from '@playwright/test';
import { presets, seedStyle } from '../../src/styles/presets.ts';

const rgb = (hex: string) => `rgb(${[1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`;
const value = (style: typeof presets[number], selectorId: string, property: string) =>
  style.rules.find(rule => rule.selectorId === selectorId)!.declarations.find(entry => entry.property === property)!.value;

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
  test(`all presets apply without replacing content or state at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const external: string[] = [];
    const errors: string[] = [];
    page.on('request', request => { if (!request.url().startsWith(`${test.info().project.use.baseURL}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Take a closer look' }).first().click();
    await page.getByRole('switch', { name: 'Quiet hours' }).uncheck();
    await page.getByRole('textbox', { name: 'Email address' }).fill('styles@example.com');
    await page.getByRole('button', { name: 'Keep me posted' }).click();
    const website = page.getByRole('article', { name: 'Form and Field sample website' });
    const content = await website.textContent();
    await website.evaluate(element => { (window as any).originalPreview = element; });
    const headerColor = await page.locator('.app-header').evaluate(element => getComputedStyle(element).backgroundColor);
    for (const style of presets) {
      const card = page.getByRole('button', { name: `${style.id}: ${style.name}`, exact: true });
      await card.click();
      await expect(card).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.style-card[aria-pressed="true"]')).toHaveCount(1);
      await expect(page.getByRole('status', { name: 'Selected style' })).toContainText(style.name);
      await expect(website).toHaveCSS('background-color', rgb(value(style, 'page', 'background-color')));
      await expect(website).toHaveCSS('color', rgb(value(style, 'page', 'color')));
      await expect(page.locator('.sample-heading')).toHaveCSS('font-size', value(style, 'heading', 'font-size'));
      await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', rgb(value(style, 'button', 'background-color')));
      await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('border-top-left-radius', value(style, 'button', 'border-top-left-radius'));
      await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('border-top-width', value(style, 'button', 'border-top-width'));
      await expect(card.locator('.style-sample')).toHaveCSS('background-color', rgb(value(style, 'page', 'background-color')));
      await expect(card.locator('.style-sample-button')).toHaveCSS('background-color', rgb(value(style, 'button', 'background-color')));
      expect(await website.textContent()).toEqual(content);
      expect(await website.evaluate(element => element === (window as any).originalPreview)).toBe(true);
      await expect(page.getByRole('switch', { name: 'Quiet hours' })).not.toBeChecked();
      await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('styles@example.com');
      await expect(page.getByRole('button', { name: 'Take a closer look' }).first()).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('status').filter({ hasText: 'No email was sent.' })).toBeAttached();
      expect(await page.locator('.app-header').evaluate(element => getComputedStyle(element).backgroundColor)).toEqual(headerColor);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height);
      await page.getByRole('region', { name: 'Scrollable website preview' }).evaluate(element => { element.scrollTop = 0; });
      if (viewport.width === 1440) await page.screenshot({ path: `test-results/m3-${style.id}.png` });
    }
    await page.getByRole('button', { name: `G1: ${seedStyle.name} (seed)`, exact: true }).click();
    await expect(page.getByRole('status', { name: 'Selected style' })).toContainText(seedStyle.name);
    await expect(page.locator('.style-card[aria-pressed="true"]')).toHaveCount(1);
    await expect(website).toHaveCSS('background-color', rgb(value(seedStyle, 'page', 'background-color')));
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('preset cards support keyboard selection with an accessible active state', async ({ page }) => {
  await page.goto('/');
  const blueprint = page.getByRole('button', { name: 'S2: Blueprint', exact: true });
  await blueprint.focus();
  await page.keyboard.press('Enter');
  await expect(blueprint).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Use S2 as inspiration', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  const afterHours = page.getByRole('button', { name: 'S3: After Hours', exact: true });
  await expect(afterHours).toBeFocused();
  await page.keyboard.press('Space');
  await expect(afterHours).toHaveAttribute('aria-pressed', 'true');
  await expect(blueprint).toHaveAttribute('aria-pressed', 'false');
});
