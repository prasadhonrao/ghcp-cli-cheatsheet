#!/usr/bin/env node
/**
 * Build narrated demo videos from existing GIFs.
 *
 * For every demo in scripts/demos.json that has a "narration":
 *   - a string: spoken once, starting at 0s
 *   - an array of { "at": seconds, "text": "..." } segments: each one is spoken
 *     at its "at" time so the voice lines up with what is on screen
 *     (a segment is delayed if the previous one is still speaking)
 *     "at" is a time in the final video (after any speedUp below).
 *
 * A demo may also set "speedUp": { "from": s, "to": s, "factor": n } to play a
 * stretch of the GIF (source seconds), such as Copilot loading, n times faster.
 *   1. Synthesize speech with the Microsoft Edge Read Aloud voices (msedge-tts).
 *   2. Write WebVTT captions from the sentence boundaries.
 *   3. Mux the narration onto the existing GIF with ffmpeg → H.264/AAC MP4.
 *
 * The video is padded (last frame held / audio silence) so neither the
 * visuals nor the narration are cut short.
 *
 * Output:
 *   public/videos/{category}/{id}.mp4
 *   public/videos/{category}/{id}.vtt
 *
 * Usage:
 *   npm run create:video                            # all demos with narration
 *   npm run create:video -- --category agents       # one category
 *   npm run create:video -- --id autopilot          # single demo
 *   npm run create:video -- --voice en-GB-RyanNeural
 *   npm run create:video -- --rate +0%              # speech rate (default +10%, or "speechRate" in demos.json settings)
 *
 * Requirements: ffmpeg + ffprobe in PATH, and a GIF at public/images/{category}/{id}.gif
 * (run npm run create:gif first).
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const config = JSON.parse(readFileSync(new URL('./demos.json', import.meta.url), 'utf8'));

const DEFAULT_VOICE = 'en-US-AriaNeural';
const DEFAULT_RATE = '+10%'; // slightly brisk so narration keeps pace with short recordings
const TAIL_PADDING_S = 1; // silence/hold after the narration ends
const SEGMENT_GAP_S = 0.3; // minimum pause between consecutive segments
const TICKS_PER_SECOND = 10_000_000; // TTS offsets are in 100-ns units

// ── CLI arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filterCategories = [];
const filterIds = [];
let voice = config.settings?.voice ?? DEFAULT_VOICE;
let rate = config.settings?.speechRate ?? DEFAULT_RATE;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) filterCategories.push(args[++i]);
  else if (args[i] === '--id' && args[i + 1]) filterIds.push(args[++i]);
  else if (args[i] === '--voice' && args[i + 1]) voice = args[++i];
  else if (args[i] === '--rate' && args[i + 1]) rate = args[++i];
}

// ── Verify ffmpeg is installed ───────────────────────────────────────────────
for (const bin of ['ffmpeg', 'ffprobe']) {
  try {
    execFileSync(bin, ['-version'], { stdio: 'ignore' });
  } catch {
    console.error(`✗ ${bin} is not installed or not in PATH.`);
    console.error('  macOS/Linux: brew install ffmpeg');
    console.error('  Windows:     winget install Gyan.FFmpeg');
    process.exit(1);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function probeDuration(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' }
  );
  return parseFloat(out.trim());
}

function formatVttTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = String(Math.floor(ms / 3_600_000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, '0');
  const r = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${s}.${r}`;
}

function buildCues(metadataFile, offset, original) {
  const { Metadata } = JSON.parse(readFileSync(metadataFile, 'utf8'));
  return Metadata
    .filter((m) => m.Type === 'SentenceBoundary')
    .map((m) => ({
      start: offset + m.Data.Offset / TICKS_PER_SECOND,
      end: offset + (m.Data.Offset + m.Data.Duration) / TICKS_PER_SECOND,
      text: restoreSlashes(m.Data.text.Text.trim(), original),
    }));
}

// "/help" is read aloud as "slash help", but captions should keep the real command text.
const COMMAND_TOKEN = /(^|[\s(])\/(?=[A-Za-z])/g;
const toSpeech = (text) => text.replace(COMMAND_TOKEN, '$1slash ');

function restoreSlashes(captionText, original) {
  let result = captionText;
  for (const [, , name] of original.matchAll(/(^|[\s(])\/([A-Za-z][\w-]*)/g)) {
    result = result.split(`slash ${name}`).join(`/${name}`);
  }
  return result;
}

function buildVtt(cues) {
  const body = cues.map((cue, i) => {
    const next = cues[i + 1];
    const end = next ? Math.min(cue.end, next.start) : cue.end; // avoid overlapping cues
    return `${formatVttTime(cue.start)} --> ${formatVttTime(end)}\n${cue.text}`;
  });
  return `WEBVTT\n\n${body.join('\n\n')}\n`;
}

async function synthesizeOnce(text, workDir) {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
      sentenceBoundaryEnabled: true,
    });
    const { audioFilePath, metadataFilePath } = await tts.toFile(workDir, escapeXml(toSpeech(text)), { rate });
    return { audioFilePath, metadataFilePath };
  } finally {
    tts.close();
  }
}

// The Read Aloud endpoint occasionally drops a connection; retry before giving up.
async function synthesize(text, workDir) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await synthesizeOnce(text, workDir);
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

const toSegments = (narration) =>
  typeof narration === 'string' ? [{ at: 0, text: narration }] : narration;

/** Synthesize every segment and place it on the timeline without overlapping the previous one. */
async function buildTrack(narration, workDir) {
  const clips = [];
  const cues = [];
  let cursor = 0;

  for (const [i, segment] of toSegments(narration).entries()) {
    const segDir = join(workDir, String(i));
    mkdirSync(segDir);
    const { audioFilePath, metadataFilePath } = await synthesize(segment.text, segDir);
    const duration = probeDuration(audioFilePath);
    const start = Math.max(segment.at ?? 0, cursor);

    if (start - (segment.at ?? 0) > 0.5) {
      console.log(`    ! segment ${i + 1} delayed ${(start - segment.at).toFixed(1)}s (previous segment still speaking) — shorten it or move "at" later`);
    }
    clips.push({ file: audioFilePath, start });
    cues.push(...buildCues(metadataFilePath, start, segment.text));
    cursor = start + duration + SEGMENT_GAP_S;
  }

  return { clips, cues, end: cursor - SEGMENT_GAP_S };
}

/**
 * Optional time-lapse of a slow stretch (e.g. Copilot loading): the GIF between
 * speedUp.from and speedUp.to (source seconds) plays speedUp.factor times faster.
 */
function speedUpFilter(speedUp) {
  const { from, to, factor } = speedUp;
  return [
    'split=3[s0][s1][s2]',
    `[s0]trim=end=${from},setpts=PTS-STARTPTS[v0]`,
    `[s1]trim=start=${from}:end=${to},setpts=(PTS-STARTPTS)/${factor}[v1]`,
    `[s2]trim=start=${to},setpts=PTS-STARTPTS[v2]`,
    `[v0][v1][v2]concat=n=3:v=1:a=0,fps=${config.settings?.framerate ?? 15}`,
  ].join(';');
}

function muxVideo(gifFile, clips, outFile, sourceDuration, narrationEnd, speedUp) {
  const gifDuration = speedUp
    ? speedUp.from + (speedUp.to - speedUp.from) / speedUp.factor + (sourceDuration - speedUp.to)
    : sourceDuration;
  const total = Math.max(gifDuration, narrationEnd + TAIL_PADDING_S);
  const holdFrames = Math.max(0, total - gifDuration);
  const videoFilter = [
    holdFrames > 0 ? `tpad=stop_mode=clone:stop_duration=${holdFrames.toFixed(3)}` : null,
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    'format=yuv420p',
  ].filter(Boolean).join(',');

  const delays = clips.map((clip, i) => {
    const ms = Math.round(clip.start * 1000);
    return `[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`;
  });
  const mixInputs = clips.map((_, i) => `[a${i}]`).join('');
  const filter = [
    speedUp ? `[0:v]${speedUpFilter(speedUp)}[sped];[sped]${videoFilter}[v]` : `[0:v]${videoFilter}[v]`,
    ...delays,
    `${mixInputs}amix=inputs=${clips.length}:normalize=0,apad[a]`,
  ].join(';');

  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-i', gifFile,
    ...clips.flatMap((clip) => ['-i', clip.file]),
    '-filter_complex', filter,
    '-map', '[v]', '-map', '[a]',
    '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-c:a', 'aac', '-b:a', '96k',
    '-movflags', '+faststart',
    outFile,
  ], { stdio: 'inherit' });
}

/**
 * Point the command's JSON entry at the generated video + captions. Matches the entry by its
 * terminalDemo GIF path and edits the text in place so the file's formatting is untouched.
 */
function linkCommandEntry(demo) {
  const file = join(rootDir, 'src', 'data', 'categories', `${demo.category}.json`);
  const gif = `images/${demo.category}/${demo.id}.gif`;
  const video = `videos/${demo.category}/${demo.id}.mp4`;
  const captions = `videos/${demo.category}/${demo.id}.vtt`;
  const source = readFileSync(file, 'utf8');

  const line = new RegExp(
    `^([ \\t]*)"terminalDemo": "${gif.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"(,?)[ \\t]*(\\r?\\n)` +
    `(?:[ \\t]*"terminalVideo": "[^"]*"(,?)[ \\t]*\\r?\\n)?` +
    `(?:[ \\t]*"terminalCaptions": "[^"]*"(,?)[ \\t]*\\r?\\n)?`,
    'm'
  );
  const match = source.match(line);
  if (!match) throw new Error(`no entry with terminalDemo "${gif}" in ${file}`);

  const [, indent, demoComma, eol, videoComma, captionsComma] = match;
  // The last original property line says whether another property follows this block.
  const comma = captionsComma ?? videoComma ?? demoComma;
  const replacement =
    `${indent}"terminalDemo": "${gif}",${eol}` +
    `${indent}"terminalVideo": "${video}",${eol}` +
    `${indent}"terminalCaptions": "${captions}"${comma}${eol}`;

  const updated = source.replace(line, replacement);
  if (updated !== source) writeFileSync(file, updated);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const demos = config.demos.filter((demo) => {
    if (!demo.narration) return false;
    if (filterIds.length && !filterIds.includes(demo.id)) return false;
    if (filterCategories.length && !filterCategories.includes(demo.category)) return false;
    return true;
  });

  console.log(`🎙️  Creating narrated videos (voice: ${voice})…\n`);
  if (demos.length === 0) {
    console.log('No demos with a "narration" field matched. Add one in scripts/demos.json.');
    return;
  }

  let created = 0;
  const failed = [];

  for (const demo of demos) {
    const label = `${demo.category}/${demo.id}`;
    const gifFile = join(rootDir, 'public', 'images', demo.category, `${demo.id}.gif`);
    if (!existsSync(gifFile)) {
      console.log(`  ✗ ${label} — missing ${gifFile} (run npm run create:gif first)`);
      failed.push(label);
      continue;
    }

    const outDir = join(rootDir, 'public', 'videos', demo.category);
    mkdirSync(outDir, { recursive: true });
    const workDir = mkdtempSync(join(tmpdir(), 'ghcp-tts-'));

    try {
      const { clips, cues, end } = await buildTrack(demo.narration, workDir);
      writeFileSync(join(outDir, `${demo.id}.vtt`), buildVtt(cues));
      muxVideo(gifFile, clips, join(outDir, `${demo.id}.mp4`), probeDuration(gifFile), end, demo.speedUp);
      console.log(`  ✓ public/videos/${label}.mp4 (+ .vtt)`);
      linkCommandEntry(demo);
      created++;
    } catch (e) {
      console.log(`  ✗ ${label} — ${e.message}`);
      failed.push(label);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Created: ${created}`);
  if (failed.length) {
    console.log(`✗ Failed:  ${failed.length}`);
    failed.forEach((l) => console.log(`  - ${l}`));
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
