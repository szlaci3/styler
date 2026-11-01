import { test, expect, type Page } from '@playwright/test';
import { seedStyle } from '../../src/styles/presets.ts';
import { constrainStyle } from '../../shared/constraints.ts';

const autoSwitch = (page: Page) => page.getByRole('switch', { name: 'Auto (8 sec)' });
async function savedPreference(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('styler-presets');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<boolean | undefined>((resolve, reject) => {
        const request = db.transaction('settings').objectStore('settings').get('autoGeneration');
        request.onsuccess = () => resolve(request.result?.value); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}
async function open(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-11-01T12:00:00Z') });
  await page.goto('/');
  await expect(autoSwitch(page)).toBeEnabled();
  await page.clock.pauseAt(new Date('2026-11-01T12:01:00Z'));
}

test('Auto defaults on, cancels a countdown when off, and only fresh edits arm it after enabling', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => {
    calls++;
    const body = route.request().postDataJSON();
    await route.fulfill({ json: { style: constrainStyle({ ...seedStyle, id: body.id, provenance: 'antigravity' }, body.snapshot) } });
  });
  await open(page);
  const auto = autoSwitch(page), generate = page.locator('.generate-button');
  await expect(auto).toBeChecked();
  const row = await page.locator('.generation-actions').boundingBox();
  const button = await generate.boundingBox();
  expect(button!.width).toBeCloseTo(row!.width / 2, 0);
  expect(await page.locator('.generation-actions').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/auto-generation.png' });
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.clock.runFor(7000);
  await expect(generate).toHaveAccessibleName('Sending in 1…');
  await auto.uncheck();
  await expect(generate).toHaveAccessibleName('Generate');
  await page.getByRole('button', { name: 'Use S2 as inspiration', exact: true }).click();
  const edit = page.getByRole('textbox', { name: 'Edit button color', exact: true });
  await edit.fill('#123456'); await edit.press('Enter');
  await page.clock.runFor(60_000);
  expect(calls).toBe(0);
  await generate.click();
  await expect(page.locator('[data-slot="G7"] .style-card')).toBeAttached();
  expect(calls).toBe(4);
  await auto.focus(); await page.keyboard.press('Space');
  await expect(auto).toBeChecked();
  await page.clock.runFor(60_000);
  expect(calls).toBe(4);
  await page.getByRole('button', { name: 'Clear inspiration', exact: true }).click();
  await page.clock.runFor(8010);
  await expect(page.locator('[data-slot="G13"] .style-card')).toBeAttached();
  expect(calls).toBe(8);
});

test('Auto preference survives reload in both states without generation on load', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/generate', async route => { calls++; await route.fulfill({ status: 503, json: { error: 'Provider unavailable.' } }); });
  await open(page);
  // Saved presets continue to coexist with settings in the upgraded database.
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Preset storage' })).toHaveText('Saved as S8.');
  await autoSwitch(page).uncheck();
  await expect.poll(() => savedPreference(page)).toBe(false);
  await page.reload();
  await expect(autoSwitch(page)).toBeEnabled();
  await expect(autoSwitch(page)).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'S8: Tidal Atelier', exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Lock button color', exact: true }).click();
  await page.clock.runFor(60_000);
  expect(calls).toBe(0);
  await autoSwitch(page).check();
  await expect.poll(() => savedPreference(page)).toBe(true);
  await page.clock.runFor(60_000);
  expect(calls).toBe(0);
  await page.reload();
  await expect(autoSwitch(page)).toBeEnabled();
  await expect(autoSwitch(page)).toBeChecked();
  await page.clock.runFor(60_000);
  expect(calls).toBe(0);
});

test('a failed preference write leaves Auto off for this session and reports the failure', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function() { throw new DOMException('Quota exhausted', 'QuotaExceededError'); };
  });
  await autoSwitch(page).uncheck();
  await expect(autoSwitch(page)).not.toBeChecked();
  await expect(page.getByRole('status', { name: 'Auto preference storage' })).toContainText('was not saved');
});

test('upgrading the existing presets database preserves saved styles and defaults Auto on', async ({ page }) => {
  await page.goto('/api/health');
  await page.evaluate(async style => {
    await new Promise<void>((resolve, reject) => {
      // Dexie schema version 1 corresponds to IndexedDB version 10.
      const request = indexedDB.open('styler-presets', 10);
      request.onupgradeneeded = () => request.result.createObjectStore('presets', { keyPath: 'number' });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('presets', 'readwrite');
        transaction.objectStore('presets').add({ number: 8, style, layers: [style] });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });
  }, { ...seedStyle, id: 'S8', provenance: 'preset' });
  await page.goto('/');
  await expect(autoSwitch(page)).toBeEnabled();
  await expect(autoSwitch(page)).toBeChecked();
  await expect(page.getByRole('button', { name: `S8: ${seedStyle.name}`, exact: true })).toBeAttached();
  await autoSwitch(page).uncheck();
  await expect.poll(() => savedPreference(page)).toBe(false);
});
