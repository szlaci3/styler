import { test, expect } from '@playwright/test';

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
