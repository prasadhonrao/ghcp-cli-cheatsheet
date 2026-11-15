#!/usr/bin/env node
/**
 * Validate every narrated demo video.
 *
 * For each demo in scripts/demos.json that has a "narration":
 *   - the fallback GIF exists and decodes, and the MP4 + VTT exist
 *   - the MP4 has one H.264 video and one AAC audio stream of equal length, long enough
 *     for the narration (and, with speedUp, matching the sped-up GIF)
 *   - captions are valid WebVTT: ordered, non-overlapping, inside the video
 *   - sync: every narration segment's captions start at (or just after) its "at" time
 *     and the audio is really audible while each caption is shown
 *   - the command's JSON entry points at the video and captions
 *
 * Usage:
 *   npm run verify:video                       # all narrated demos
 *   npm run verify:video -- --id autopilot     # one demo
 *   npm run verify:video -- --category chat
 *
 * Exit code 1 if any check fails.
 */

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const config = JSON.parse(readFileSync(new URL('./demos.json', import.meta.url), 'utf8'));

const MAX_DELAY_S = 1.0; // a caption may start this much later than its "at" before it counts as out of sync
const EARLY_TOLERANCE_S = 0.15;
const MIN_AUDIBLE_DB = -45; // mean volume while a caption is on screen
const DURATION_TOLERANCE_S = 0.25;
const TAIL_PADDING_S = 1;

const args = process.argv.slice(2);
const filterIds = [];
const filterCategories = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--id' && args[i + 1]) filterIds.push(args[++i]);
  else if (args[i] === '--category' && args[i + 1]) filterCategories.push(args[++i]);
}

const run = (bin, a) => execFileSync(bin, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const probeDuration = (file) =>
  parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());

function probeStreams(file) {
  const out = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', file]));
  return out.streams.map((s) => ({ type: s.codec_type, codec: s.codec_name, duration: parseFloat(s.duration) }));
}

function audibleDb(file, start, duration) {
  const res = spawnSync(
    'ffmpeg',
    ['-v', 'info', '-ss', String(start), '-t', String(duration), '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' }
  );
  const m = `${res.stderr}`.match(/mean_volume: (-?[\d.]+|-inf) dB/);
  return m ? (m[1] === '-inf' ? -Infinity : parseFloat(m[1])) : -Infinity;
}

function parseVtt(file) {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (!text.startsWith('WEBVTT')) throw new Error('missing WEBVTT header');
  const toSec = (t) => {
    const [h, m, s] = t.split(':');
    return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s);
  };
  return text
    .split(/\n\n+/)
    .slice(1)
    .filter((b) => b.trim())
    .map((block) => {
      const [timing, ...lines] = block.split('\n');
      const m = timing.match(/^(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})$/);
      if (!m) throw new Error(`bad cue timing: ${timing}`);
      return { start: toSec(m[1]), end: toSec(m[2]), text: lines.join(' ').trim() };
    });
}

function commandEntry(demo) {
  const file = join(rootDir, 'src', 'data', 'categories', `${demo.category}.json`);
  const gif = `images/${demo.category}/${demo.id}.gif`;
  return JSON.parse(readFileSync(file, 'utf8')).find((c) => c.terminalDemo === gif);
}

const segmentsOf = (n) => (typeof n === 'string' ? [{ at: 0, text: n }] : n);

function checkDemo(demo) {
  const errors = [];
  const notes = [];
  const label = `${demo.category}/${demo.id}`;
  const gif = join(rootDir, 'public', 'images', demo.category, `${demo.id}.gif`);
  const mp4 = join(rootDir, 'public', 'videos', demo.category, `${demo.id}.mp4`);
  const vtt = join(rootDir, 'public', 'videos', demo.category, `${demo.id}.vtt`);

  // Fallback GIF
  let gifDuration = 0;
  if (!existsSync(gif)) errors.push('fallback GIF missing');
  else {
    try { gifDuration = probeDuration(gif); } catch { errors.push('fallback GIF does not decode'); }
    if (!(gifDuration > 1)) errors.push(`fallback GIF duration suspicious (${gifDuration})`);
  }
  if (!existsSync(mp4)) errors.push('MP4 missing');
  if (!existsSync(vtt)) errors.push('VTT missing');
  if (errors.length) return { label, errors, notes };

  // Streams and duration
  const streams = probeStreams(mp4);
  const video = streams.filter((s) => s.type === 'video');
  const audio = streams.filter((s) => s.type === 'audio');
  if (video.length !== 1 || video[0].codec !== 'h264') errors.push(`expected one h264 video stream, got ${JSON.stringify(video)}`);
  if (audio.length !== 1 || audio[0].codec !== 'aac') errors.push(`expected one aac audio stream, got ${JSON.stringify(audio)}`);
  const duration = probeDuration(mp4);
  if (video[0] && audio[0] && Math.abs(video[0].duration - audio[0].duration) > 0.15) {
    errors.push(`audio (${audio[0].duration.toFixed(2)}s) and video (${video[0].duration.toFixed(2)}s) lengths differ`);
  }

  // Captions
  let cues = [];
  try { cues = parseVtt(vtt); } catch (e) { errors.push(`VTT: ${e.message}`); }
  const segments = segmentsOf(demo.narration);
  if (cues.length < segments.length) errors.push(`only ${cues.length} caption cue(s) for ${segments.length} narration segment(s)`);
  cues.forEach((cue, i) => {
    if (!(cue.end > cue.start)) errors.push(`cue ${i + 1} has no duration`);
    if (i > 0 && cue.start < cues[i - 1].end - 0.001) errors.push(`cue ${i + 1} overlaps the previous one`);
    if (!cue.text) errors.push(`cue ${i + 1} is empty`);
  });
  const narrationEnd = cues.length ? cues[cues.length - 1].end : 0;
  if (narrationEnd > duration + 0.05) errors.push(`narration ends at ${narrationEnd.toFixed(1)}s, after the video (${duration.toFixed(1)}s)`);

  // Expected length: the (sped-up) GIF, or the narration plus padding if that is longer
  const su = demo.speedUp;
  const visual = su ? su.from + (su.to - su.from) / su.factor + (gifDuration - su.to) : gifDuration;
  const expected = Math.max(visual, narrationEnd + TAIL_PADDING_S);
  if (Math.abs(duration - expected) > DURATION_TOLERANCE_S) {
    errors.push(`video is ${duration.toFixed(2)}s, expected about ${expected.toFixed(2)}s`);
  }
  if (narrationEnd + TAIL_PADDING_S > visual + 0.05) {
    notes.push(`narration runs ${(narrationEnd + TAIL_PADDING_S - visual).toFixed(1)}s past the recording (last frame is held)`);
  }

  // Sync: each segment's first caption must start at its "at" time (allowing a short delay)
  let cursor = 0;
  for (const [i, seg] of segments.entries()) {
    const sentences = seg.text.split(/(?<=[.!?])\s+/).length;
    const own = cues.slice(cursor, cursor + sentences);
    cursor += sentences;
    if (!own.length) { errors.push(`segment ${i + 1}: no captions`); continue; }
    const delta = own[0].start - seg.at;
    if (delta < -EARLY_TOLERANCE_S) errors.push(`segment ${i + 1} starts ${(-delta).toFixed(2)}s before its "at" (${seg.at}s)`);
    if (delta > MAX_DELAY_S) errors.push(`segment ${i + 1} starts ${delta.toFixed(2)}s after its "at" (${seg.at}s) — out of sync`);
    else if (delta > 0.4) notes.push(`segment ${i + 1} delayed ${delta.toFixed(1)}s`);
  }

  // Audio really present while each caption is shown
  cues.forEach((cue, i) => {
    const from = cue.start + 0.15;
    const len = Math.max(0.2, cue.end - cue.start - 0.3);
    const db = audibleDb(mp4, from.toFixed(3), len.toFixed(3));
    if (!(db > MIN_AUDIBLE_DB)) errors.push(`cue ${i + 1} is (almost) silent in the audio (${db} dB)`);
  });

  // JSON links
  const entry = commandEntry(demo);
  if (!entry) errors.push('no command entry for this demo');
  else {
    if (entry.terminalVideo !== `videos/${demo.category}/${demo.id}.mp4`) errors.push(`terminalVideo not linked (${entry.terminalVideo})`);
    if (entry.terminalCaptions !== `videos/${demo.category}/${demo.id}.vtt`) errors.push(`terminalCaptions not linked (${entry.terminalCaptions})`);
  }

  return { label, errors, notes, duration, cues: cues.length };
}

// Orphans: files in public/videos that no demo with narration produces
function findOrphans(narrated) {
  const expected = new Set(narrated.flatMap((d) => [`${d.category}/${d.id}.mp4`, `${d.category}/${d.id}.vtt`]));
  const base = join(rootDir, 'public', 'videos');
  if (!existsSync(base)) return [];
  const found = [];
  for (const cat of readdirSync(base)) {
    for (const f of readdirSync(join(base, cat))) found.push(`${cat}/${f}`);
  }
  return found.filter((f) => !expected.has(f));
}

console.log('🔎 Verifying narrated demo videos…\n');
const all = config.demos.filter((d) => d.narration);
const demos = all.filter(
  (d) => (!filterIds.length || filterIds.includes(d.id)) && (!filterCategories.length || filterCategories.includes(d.category))
);

let failed = 0;
let withNotes = 0;
for (const demo of demos) {
  let result;
  try { result = checkDemo(demo); } catch (e) { result = { label: `${demo.category}/${demo.id}`, errors: [`check crashed: ${e.message}`], notes: [] }; }
  if (result.errors.length) {
    failed++;
    console.log(`  ✗ ${result.label}`);
    result.errors.forEach((e) => console.log(`      - ${e}`));
  } else {
    console.log(`  ✓ ${result.label} (${result.duration.toFixed(1)}s, ${result.cues} captions)`);
  }
  if (result.notes.length) {
    withNotes++;
    result.notes.forEach((n) => console.log(`      · ${n}`));
  }
}

const orphans = filterIds.length || filterCategories.length ? [] : findOrphans(all);
orphans.forEach((o) => console.log(`  ✗ orphan file public/videos/${o} (no narrated demo produces it)`));

const covered = new Set(all.map((d) => `${d.category}/${d.id}`));
const withoutNarration = config.demos.filter((d) => !covered.has(`${d.category}/${d.id}`));

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✓ Passed:  ${demos.length - failed}`);
if (failed) console.log(`✗ Failed:  ${failed}`);
if (orphans.length) console.log(`✗ Orphans: ${orphans.length}`);
if (withNotes) console.log(`· Notes:   ${withNotes} demo(s)`);
if (!filterIds.length && !filterCategories.length && withoutNarration.length) {
  console.log(`· ${withoutNarration.length} demo(s) have no narration yet: ${withoutNarration.map((d) => d.id).join(', ')}`);
}
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

if (failed || orphans.length) process.exit(1);
