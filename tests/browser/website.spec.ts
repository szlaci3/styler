import { test, expect } from '@playwright/test';
import { presets } from '../../src/styles/presets.ts';

const rgb = (hex: string) => `rgb(${[1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`;

for (const width of [1280, 1440, 1920]) {
  test(`expanded website retains content, images and controls through every preset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const remoteRequests: string[] = [];
    page.on('request', request => {
      if (!request.url().startsWith(`${test.info().project.use.baseURL}/`) || request.url().includes('/api/generate')) remoteRequests.push(request.url());
    });
    await page.goto('/');
    const preview = page.getByRole('region', { name: 'Scrollable website preview', exact: true });
    await page.getByRole('button', { name: 'Membership', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'A little space. On your terms.' })).toBeInViewport();
    const plan = page.getByRole('radio', { name: /Find a rhythm/ });
    await plan.check();
    await page.getByRole('button', { name: 'Come and say hello' }).click();
    await expect(page.getByRole('heading', { name: 'See how it feels.' })).toBeInViewport();
    await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Casey');
    await page.getByRole('combobox', { name: 'Your corner' }).selectOption('common');
    await page.getByRole('combobox', { name: 'Preferred day' }).selectOption('Thursday');
    await page.getByRole('textbox', { name: 'Anything we should know?' }).fill('A desk for drawing, please.');
    await page.getByRole('button', { name: 'Preview my visit' }).click();
    const confirmation = page.getByRole('status').filter({ hasText: 'Thanks, Casey.' });
    await expect(confirmation).toHaveText('Thanks, Casey. Your sample Thursday tour is set for the common ground with the Find a rhythm plan. No booking was sent.');
    const faq = page.getByText('Is there space for a small team?', { exact: true });
    await faq.focus(); await page.keyboard.press('Enter');
    await expect(faq.locator('..')).toHaveAttribute('open', '');
    const website = page.locator('.sample-page');
    const content = await website.textContent();
    const select = await page.getByRole('combobox', { name: 'Your corner' }).elementHandle();
    const images = page.locator('img.sample-image');
    const sources = await images.evaluateAll(elements => elements.map(element => (element as HTMLImageElement).src));
    await expect(images).toHaveCount(2);
    expect(await images.evaluateAll(elements => elements.every(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth === 800))).toBe(true);
    for (const style of presets) {
      await page.getByRole('button', { name: `${style.id}: ${style.name}`, exact: true }).click();
      await expect(plan).toBeChecked();
      await expect(page.getByRole('combobox', { name: 'Your corner' })).toHaveValue('common');
      await expect(page.getByRole('combobox', { name: 'Preferred day' })).toHaveValue('Thursday');
      await expect(page.getByRole('textbox', { name: 'Your name', exact: true })).toHaveValue('Casey');
      await expect(page.getByRole('textbox', { name: 'Anything we should know?' })).toHaveValue('A desk for drawing, please.');
      await expect(faq.locator('..')).toHaveAttribute('open', '');
      await expect(confirmation).toContainText('No booking was sent.');
      expect(await website.textContent()).toEqual(content);
      expect(await select!.evaluate(element => element.isConnected)).toBe(true);
      expect(await images.evaluateAll(elements => elements.map(element => (element as HTMLImageElement).src))).toEqual(sources);
      const inputBackground = style.rules.find(rule => rule.selectorId === 'input')!.declarations.find(entry => entry.property === 'background-color')!.value;
      await expect(page.getByRole('combobox', { name: 'Your corner' })).toHaveCSS('background-color', rgb(inputBackground));
      await expect(page.getByRole('textbox', { name: 'Anything we should know?' })).toHaveCSS('background-color', rgb(inputBackground));
      const radius = style.rules.find(rule => rule.selectorId === 'image')!.declarations.find(entry => entry.property === 'border-top-left-radius')!.value;
      await expect(images.first()).toHaveCSS('border-top-left-radius', radius);
      await expect(page.getByRole('heading', { name: 'See how it feels.' })).toHaveCSS('font-size', '26px');
      expect(await preview.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY, width: document.documentElement.scrollWidth }))).toEqual({ x: 0, y: 0, width });
      await page.getByRole('button', { name: 'Plan a visit', exact: true }).click();
      if (style.id === 'S1' || style.id === 'S3') await page.screenshot({ path: `test-results/m13-visit-${width}-${style.id}.png` });
    }
    await page.getByRole('button', { name: 'Our spaces', exact: false }).click();
    await expect(page.getByRole('heading', { name: 'A different kind of everyday.' })).toBeInViewport();
    await page.screenshot({ path: `test-results/m13-spaces-${width}.png` });
    expect(remoteRequests).toEqual([]);
  });
}

test('new controls use shared locks, native validation and editable local confirmation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const inputLock = page.getByRole('button', { name: 'Lock input background-color', exact: true });
  await inputLock.focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Lock image border-top-left-radius', exact: true }).click();
  await page.getByRole('button', { name: 'Lock subheading font-size', exact: true }).click();
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Your corner' })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('textbox', { name: 'Anything we should know?' })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('img.sample-image').first()).toHaveCSS('border-top-left-radius', '8px');
  await page.getByRole('button', { name: 'Unset input background-color', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Your corner' })).toHaveCSS('background-color', 'rgb(48, 42, 61)');
  await page.getByRole('button', { name: 'Plan a visit', exact: true }).click();
  await page.getByRole('button', { name: 'Preview my visit' }).click();
  const visitor = page.getByRole('textbox', { name: 'Your name', exact: true });
  expect(await visitor.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
  await expect(page.getByRole('status').filter({ hasText: 'Try the form.' })).toBeAttached();
  await visitor.fill('Sam');
  const corner = page.getByRole('combobox', { name: 'Your corner' });
  await corner.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(corner).toHaveValue('common');
  const submit = page.getByRole('button', { name: 'Preview my visit' });
  await submit.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Thanks, Sam.' })).toContainText('No booking was sent.');
  await page.getByRole('combobox', { name: 'Preferred day' }).selectOption('Friday');
  await expect(page.getByRole('status').filter({ hasText: 'Try the form.' })).toBeAttached();
});
