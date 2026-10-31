import { test, expect } from '@playwright/test';

test('colors, corners, borders, padding and shadows interpolate on the same preview DOM', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const website = page.getByRole('article', { name: 'Form and Field sample website' });
  const button = page.getByRole('button', { name: 'Find your space' });
  const originalColor = await button.evaluate(element => getComputedStyle(element).backgroundColor);
  const original = await website.elementHandle();
  await page.getByRole('button', { name: 'S4: Papercut', exact: true }).click();
  const midpoint = await website.evaluate(element => {
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) { animation.pause(); animation.currentTime = 160; }
    const button = element.querySelector('.sample-button')!;
    const card = element.querySelector('.sample-card')!;
    const style = getComputedStyle(button);
    const cardStyle = getComputedStyle(card);
    return {
      properties: animations.filter(animation => animation instanceof CSSTransition).map(animation => animation.transitionProperty),
      background: style.backgroundColor, radius: Number.parseFloat(style.borderTopLeftRadius),
      border: Number.parseFloat(style.borderTopWidth), padding: Number.parseFloat(cardStyle.paddingTop),
      shadow: cardStyle.boxShadow, fontFamily: style.fontFamily,
    };
  });
  for (const property of ['background-color', 'color', 'border-top-left-radius', 'border-top-width', 'padding-top', 'box-shadow']) {
    expect(midpoint.properties).toContain(property);
  }
  expect(midpoint.background).not.toBe(originalColor);
  expect(midpoint.background).not.toBe('rgb(255, 181, 69)');
  expect(midpoint.radius).toBeGreaterThan(0);
  expect(midpoint.radius).toBeLessThan(10);
  expect(midpoint.border).toBeGreaterThanOrEqual(1);
  expect(midpoint.border).toBeLessThan(2);
  expect(midpoint.padding).toBeGreaterThan(16);
  expect(midpoint.padding).toBeLessThan(18);
  expect(midpoint.shadow).not.toBe('none');
  expect(midpoint.fontFamily).toContain('Courier New');
  expect(midpoint.properties).not.toContain('font-family');
  expect(await original!.evaluate(element => element.isConnected)).toBe(true);
  await website.evaluate(element => { for (const animation of element.getAnimations({ subtree: true })) animation.finish(); });
  await expect(button).toHaveCSS('background-color', 'rgb(255, 181, 69)');
  await expect(button).toHaveCSS('border-top-left-radius', '0px');
  await expect(button).toHaveCSS('border-top-width', '2px');
});

test('one ShadowRoot, portal and stylesheet survive rapid selection changes', async ({ page }) => {
  await page.goto('/');
  const host = page.locator('.preview-host');
  await expect(page.getByRole('heading', { name: 'Make room for better work.' })).toBeVisible();
  const identity = await host.evaluateHandle(element => ({
    root: element.shadowRoot, website: element.shadowRoot!.querySelector('.sample-page'),
    selected: element.shadowRoot!.querySelector('[data-preview-selected]'),
  }));
  await page.getByRole('textbox', { name: 'Email address' }).fill('preserved@example.com');
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  await page.getByRole('button', { name: 'S4: Papercut', exact: true }).click();
  await page.getByRole('button', { name: 'S2: Blueprint', exact: true }).click();
  const stable = await host.evaluate((element, original) => ({
    root: element.shadowRoot === original.root,
    website: element.shadowRoot!.querySelector('.sample-page') === original.website,
    selected: element.shadowRoot!.querySelector('[data-preview-selected]') === original.selected,
    websites: element.shadowRoot!.querySelectorAll('.sample-page').length,
    sheets: element.shadowRoot!.querySelectorAll('style').length,
  }), identity);
  expect(stable).toEqual({ root: true, website: true, selected: true, websites: 1, sheets: 3 });
  await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('preserved@example.com');
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('background-color', 'rgb(36, 89, 200)');
});

test('preview and application CSS cannot cross the shadow boundary', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Make room for better work.' });
  await expect(heading).toHaveCSS('font-size', '56px');
  const headingColor = await heading.evaluate(element => getComputedStyle(element).color);
  const shellColor = await page.locator('.app-wordmark h1').evaluate(element => getComputedStyle(element).color);
  await page.addStyleTag({ content: `
    .preview-host { color: magenta !important; font: 70px/3 monospace !important; }
    .sample-heading { color: magenta !important; font-size: 71px !important; }
    .sample-button { padding: 44px !important; }
  ` });
  await expect(heading).toHaveCSS('font-size', '56px');
  await expect(heading).toHaveCSS('color', headingColor);
  await expect(page.getByRole('button', { name: 'Find your space' })).toHaveCSS('padding-top', '12px');
  await page.locator('.preview-host').evaluate(element => {
    const style = document.createElement('style');
    style.textContent = 'h1 { color: rgb(180, 50, 90) !important; } .app-header { background-color: red !important; }';
    element.shadowRoot!.append(style);
  });
  await expect(heading).toHaveCSS('color', 'rgb(180, 50, 90)');
  await expect(page.locator('.app-wordmark h1')).toHaveCSS('color', shellColor);
  await expect(page.locator('.app-header')).not.toHaveCSS('background-color', 'rgb(255, 0, 0)');
});

test('reduced motion removes transitions, including when preference changes during animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const website = page.getByRole('article', { name: 'Form and Field sample website' });
  const button = page.getByRole('button', { name: 'Find your space' });
  await expect(button).toHaveCSS('transition-duration', '0s');
  await page.getByRole('button', { name: 'S3: After Hours', exact: true }).click();
  expect(await button.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(214, 177, 239)');
  expect(await website.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.getByRole('button', { name: 'Find your space' }).click();
  expect(await page.getByRole('region', { name: 'Scrollable website preview' }).evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(button).toHaveCSS('transition-duration', '0.32s');
  await page.getByRole('button', { name: 'S2: Blueprint', exact: true }).click();
  // Paused transitions cannot finish naturally while the browser applies the
  // media preference. Verify cancellation after style recalculation has settled.
  expect(await website.evaluate(element => {
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) { animation.pause(); animation.currentTime = 160; }
    return animations.length;
  })).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(button).toHaveCSS('transition-duration', '0s');
  await expect(button).toHaveCSS('background-color', 'rgb(36, 89, 200)');
  await expect.poll(() => website.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
});
