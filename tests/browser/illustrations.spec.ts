import { test, expect } from '@playwright/test';

test('dark styles use the effective page background and light styles restore HSL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/');
  const art = page.locator('.sample-hero-art, .sample-space-image');
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  for (const element of await art.all()) await expect(element).toHaveCSS('background-color', 'rgb(33, 30, 44)');
  // A typed page-background lock must also determine detection and the tint.
  const background = page.getByRole('textbox', { name: 'Edit page background-color', exact: true });
  await background.fill('#102030'); await background.press('Enter');
  await page.getByRole('button', { name: 'S2: Blueprint', exact: true }).click();
  for (const element of await art.all()) await expect(element).toHaveCSS('background-color', 'rgb(16, 32, 48)');
  await page.getByRole('button', { name: 'Reset page background-color', exact: true }).click();
  await expect(page.locator('.sample-page')).not.toHaveAttribute('style', /--dark-illustration-background/);
  // OS dark preference must not classify a light selected style as dark.
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const element of await art.all()) await expect(element).not.toHaveCSS('background-color', 'rgb(16, 32, 48)');
});

test('transparent illustration layers take the S5 green and S2 blue palettes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const backgrounds: string[][] = [];
  const palettes: number[][][] = [];
  for (const [id, name] of [['S5', 'Foundation'], ['S2', 'Blueprint']]) {
    await page.getByRole('button', { name: `${id}: ${name}`, exact: true }).click();
    const art = page.locator('.sample-hero-art, .sample-space-image');
    backgrounds.push(await art.evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundColor)));
    const samples = await page.locator('img.sample-image').evaluateAll(async elements => Promise.all(elements.map(async element => {
      const img = element as HTMLImageElement;
      await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 500;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = getComputedStyle(img).backgroundColor; ctx.fillRect(0, 0, 800, 500);
      ctx.drawImage(img, 0, 0);
      const points = img.src.includes('quiet') ? [[140, 270], [680, 202]] : [[500, 260], [722, 278]];
      return points.map(([x, y]) => Array.from(ctx.getImageData(x!, y!, 1, 1).data).slice(0, 3));
    })));
    palettes.push(samples.flat());
    await page.screenshot({ path: `test-results/illustrations-${id}-hero.png` });
    await page.locator('img.sample-image').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/illustrations-${id}-studios.png` });
  }
  expect(backgrounds[0]).not.toEqual(backgrounds[1]);
  for (const colors of backgrounds) expect(new Set(colors).size).toBe(1);
  // Warm translucent highlights can mix yellow into the green/blue base.
  // Every sampled hill/leaf must still shift toward blue with S2.
  for (let i = 0; i < palettes[0]!.length; i++) {
    const green = palettes[0]![i]!, blue = palettes[1]![i]!;
    expect(blue).not.toEqual(green);
    expect(blue[2]! - blue[0]!).toBeGreaterThan(green[2]! - green[0]!);
  }
});
