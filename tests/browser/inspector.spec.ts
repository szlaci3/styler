import { test, expect } from '@playwright/test';

test('effective inspector includes inherited and conditional values and settles after selection', async ({ page }) => {
  await page.goto('/');
  const row = page.locator('.css-rule').filter({ has: page.locator('.css-selector', { hasText: /^\.sample-heading \{/ }) }).locator('.css-declaration').filter({ has: page.locator('dt', { hasText: /^color:/ }) });
  await expect(row.locator('dd')).toHaveText('rgb(37, 53, 46);');
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(row.locator('dd')).toHaveText('rgb(243, 234, 247);');
  await page.getByRole('switch').uncheck();
  await expect(page.locator('.css-rule').filter({ has: page.locator('.css-selector', { hasText: '.sample-switch-label input:checked' }) })).toContainText('background-color');
});

test('locking an interpolated font weight captures the current appearance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'S2: Blueprint', exact: true }).click();
  const captured = await page.locator('.sample-heading').evaluate(element => {
    for (const animation of element.getAnimations()) { animation.pause(); animation.currentTime = 160; }
    return String(Math.round(Number(getComputedStyle(element).fontWeight) * 100) / 100);
  });
  expect(Number(captured)).toBeGreaterThan(400);
  expect(Number(captured)).toBeLessThan(700);
  const lock = page.getByRole('button', { name: 'Lock heading font-weight', exact: true });
  await lock.click();
  await expect(lock).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-declaration="heading:font-weight"] dd')).toHaveText(`${captured};`);
  await page.locator('.sample-heading').evaluate(element => { for (const animation of element.getAnimations()) animation.finish(); });
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await expect(page.locator('.sample-heading')).toHaveCSS('font-weight', captured);
});
