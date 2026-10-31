import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderSubtitles } from './subtitle-introduction.mjs';

// Deliberate live recording: one real batch, no mocked results or automatic retry.
const out = path.resolve('docs/video');
await mkdir(out, { recursive: true });
const ffmpeg = process.env.FFMPEG_PATH;
if (!ffmpeg) throw new Error('Set FFMPEG_PATH to an FFmpeg executable with libx264. Start npm run dev first.');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const responses = [], errors = [], chapters = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.url().endsWith('/api/generate')) responses.push({ status: r.status() }); });
const encoder = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '20', '-vcodec', 'png', '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, 'styler-introduction.mp4')], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
let encoderError = ''; encoder.stderr.on('data', b => encoderError += b);
const completion = once(encoder, 'close');
let frames = 0, cursor = { x: 650, y: 100 };
async function frame(n = 1) {
  const png = await page.screenshot();
  for (let i = 0; i < n; i++) { if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain'); frames++; }
}
async function caption(text) {
  chapters.push({ seconds: frames / 20, text });
  await page.locator('#video-caption').evaluate((e, t) => e.textContent = t, text);
  console.log(text);
}
async function hold(seconds = 2) { await page.waitForTimeout(450); await frame(Math.round(seconds * 20)); }
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const start = { ...cursor };
  for (let i = 1; i <= 12; i++) {
    const t = i / 12, ease = t * t * (3 - 2 * t);
    cursor = { x: start.x + (target.x - start.x) * ease, y: start.y + (target.y - start.y) * ease };
    await page.locator('#video-cursor').evaluate((e, p) => { e.style.left = `${p.x}px`; e.style.top = `${p.y}px`; }, cursor);
    await frame();
  }
  await page.locator('#video-cursor').evaluate(e => e.style.filter = 'drop-shadow(0 0 9px #ffc56d)');
  await locator.click(); await frame(6);
  await page.locator('#video-cursor').evaluate(e => e.style.filter = 'drop-shadow(0 2px 3px #0008)');
}
async function revealImages(animated = true) {
  const rail = page.locator('.preview-scroll');
  const target = await page.locator('.sample-space-image').first().evaluate(img => {
    const rail = document.querySelector('.preview-scroll');
    return Math.max(0, rail.scrollTop + img.getBoundingClientRect().bottom - rail.getBoundingClientRect().bottom + 26);
  });
  const start = await rail.evaluate(e => e.scrollTop);
  for (let i = 1; i <= (animated ? 30 : 1); i++) {
    const t = animated ? i / 30 : 1;
    await rail.evaluate((e, y) => e.scrollTop = y, start + (target - start) * t * t * (3 - 2 * t));
    if (animated) await frame();
  }
}
try {
  await page.goto(process.env.STYLER_VIDEO_URL || 'http://127.0.0.1:5173');
  await page.locator('.sample-space-image').first().waitFor();
  await page.addStyleTag({ content: '.styler-app{height:900px!important} #video-caption{position:fixed;left:0;right:0;top:900px;height:100px;display:flex;align-items:center;justify-content:center;background:#10151e;color:#f2eee5;font:28px "Segoe UI",sans-serif;z-index:999999;pointer-events:none} #video-cursor{position:fixed;z-index:1000000;pointer-events:none;width:26px;height:34px;filter:drop-shadow(0 2px 3px #0008)}' });
  await page.evaluate(() => {
    const caption = document.createElement('div'); caption.id = 'video-caption'; document.body.append(caption);
    const cursor = document.createElement('div'); cursor.id = 'video-cursor'; cursor.style.left = '650px'; cursor.style.top = '100px';
    cursor.innerHTML = '<svg viewBox="0 0 26 34"><path d="M2 2 L2 27 L9 21 L15 32 L20 29 L14 19 L24 19 Z" fill="white" stroke="#172131" stroke-width="2"/></svg>'; document.body.append(cursor);
  });
  await caption('Styler — explore a new look for the same website.'); await hold(3);
  await caption('Choose a preset. Colors, type and surfaces change together.');
  await click(page.getByRole('button', { name: /^S2:/ })); await hold(2.5);
  await click(page.getByRole('button', { name: /^S3:/ })); await hold(2.5);
  await click(page.getByRole('button', { name: /^S1:/ })); await hold(1.5);
  await caption('Scroll the preview to bring both studio illustrations into view.');
  await revealImages(); await hold(3);
  await page.screenshot({ path: path.join(out, 'preview-images.png') });
  await caption('Use this design as inspiration, then generate fresh variations.');
  await click(page.getByRole('button', { name: 'Use S1 as inspiration', exact: true }));
  await click(page.locator('.generate-button'));
  await caption('Joker and Harlequin arrive instantly. Four AI styles are on their way.'); await hold(2);
  const pausedAt = Date.now(); console.log('Recording paused: waiting for all four real AI results.');
  await page.waitForFunction(() => !document.querySelector('.generate-button').disabled, undefined, { timeout: 220000 });
  const failed = await page.locator('.generation-slot').count();
  if (failed || responses.length !== 4 || responses.some(r => r.status !== 200)) throw new Error(`Batch did not complete successfully: ${JSON.stringify({ failed, responses })}. No retry performed.`);
  const waitOmittedSeconds = (Date.now() - pausedAt) / 1000;
  await caption('All four AI styles are ready. Explore each result.'); await hold(2);
  for (const [id, label] of [['G4', 'Professional'], ['G5', 'Playful'], ['G6', 'Commercial'], ['G7', 'Artistic']]) {
    await caption(`${label} — a different interpretation of the same inspiration.`);
    await click(page.getByRole('button', { name: new RegExp(`^${id}:`) }));
    await page.waitForTimeout(450); await revealImages(false); await hold(3.5);
    await page.screenshot({ path: path.join(out, `${label.toLowerCase()}.png`) });
  }
  await caption('Compare ideas. Keep exploring. Find your style.'); await hold(3);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  encoder.stdin.end(); const [code] = await completion;
  if (code !== 0) throw new Error(encoderError);
  await writeFile(path.join(out, 'recording.json'), JSON.stringify({ width: 1600, height: 1000, fps: 20, durationSeconds: frames / 20, waitOmittedSeconds, responses, errors, chapters, provider: 'antigravity-preview-09-2026', source: 'real local application; no mocked generation', recording: 'UI captured as PNG frames; holds and cursor timing edited; no frames captured during AI wait' }, null, 2));
  await renderSubtitles();
  console.log(`Saved ${frames / 20}s video; omitted ${waitOmittedSeconds.toFixed(1)}s wait.`);
} finally { if (!encoder.stdin.writableEnded) encoder.kill(); await browser.close(); }
