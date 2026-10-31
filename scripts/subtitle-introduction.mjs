import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const subtitles = [
  { seconds: 0, text: 'Styler — explore a new look for the same website.' },
  { seconds: 5, text: 'Choose a preset. Colors, type and surfaces change together.' },
  { seconds: 10, text: 'Use a design as inspiration, then generate fresh variations.' },
  { seconds: 16, text: 'Joker and Harlequin arrive instantly.' },
  { seconds: 20, text: 'Four AI styles finish in a minute or two:' },
  { seconds: 25, text: 'Professional, Playful, Commercial and Artistic.' },
  { seconds: 37, text: 'Different interpretations of the same inspiration.' },
];

export async function renderSubtitles() {
  const ffmpeg = process.env.FFMPEG_PATH;
  if (!ffmpeg) throw new Error('Set FFMPEG_PATH to FFmpeg with libx264 and drawtext.');
  const video = path.resolve('docs/video/styler-introduction.mp4');
  const scratch = path.resolve('verification-results/video-subtitles');
  await mkdir(scratch, { recursive: true });
  await copyFile(video, path.join(scratch, 'before-subtitles.mp4'));
  // Relative filter assets avoid Windows drive-letter escaping inside FFmpeg filters.
  await copyFile('C:/Windows/Fonts/segoeui.ttf', path.join(scratch, 'subtitle.ttf'));
  const filters = ['drawbox=x=0:y=900:w=iw:h=100:color=0x10151e:t=fill'];
  for (const [i, subtitle] of subtitles.entries()) {
    await writeFile(path.join(scratch, `caption-${i}.txt`), subtitle.text);
    const end = subtitles[i + 1]?.seconds ?? 999;
    filters.push(`drawtext=fontfile=subtitle.ttf:textfile=caption-${i}.txt:fontsize=28:fontcolor=black:box=1:boxcolor=0xbbbbbb:boxborderw=12:x=(w-tw)/2:y=950-th/2:enable='gte(t,${subtitle.seconds})*lt(t,${end})'`);
  }
  await writeFile(path.join(scratch, 'filter.txt'), filters.join(','));
  const child = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-filter_script:v', 'filter.txt', '-an', '-c:v', 'libx264', '-crf', '19', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'subtitled.mp4'], { cwd: scratch, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let errors = ''; child.stderr.on('data', b => errors += b);
  const [code] = await once(child, 'close');
  if (code !== 0) throw new Error(errors);
  await rename(path.join(scratch, 'subtitled.mp4'), video);
  const evidence = JSON.parse(await readFile('docs/video/recording.json', 'utf8'));
  evidence.captureChapters ??= evidence.chapters;
  evidence.chapters = subtitles;
  evidence.subtitleStyle = { color: '#000', background: '#bbb', padding: 12, sizing: 'fits text', fontSize: 28 };
  await writeFile('docs/video/recording.json', JSON.stringify(evidence, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await renderSubtitles();
