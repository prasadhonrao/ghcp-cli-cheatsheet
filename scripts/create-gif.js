#!/usr/bin/env node
/**
 * Run VHS on every .tape file to produce real-terminal GIFs.
 *
 * VHS records an actual Copilot CLI session — you must be authenticated
 * (run `copilot auth login` first) and have VHS installed:
 *   macOS/Linux:  brew install vhs
 *   Windows:      winget install charmbracelet.vhs  (requires WSL)
 *
 * Usage:
 *   npm run create:gif                            # all demos, 3 concurrent
 *   npm run create:gif -- --category agents       # only the agents category
 *   npm run create:gif -- --id agents-1           # single demo by ID
 *   npm run create:gif -- --concurrency 1         # serial (useful for debugging)
 *
 * Output GIFs land in public/images/{category}/{id}.gif as specified
 * by the Output directive inside each .tape file.
 *
 * Requirements:
 *   - VHS:        brew install vhs  /  winget install charmbracelet.vhs
 *   - Copilot CLI authenticated
 */

import { exec, execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// ── CLI arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const categories = [];
const ids = [];
let concurrency = 3;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) categories.push(args[++i]);
  else if (args[i] === '--id' && args[i + 1]) ids.push(args[++i]);
  else if (args[i] === '--concurrency' && args[i + 1]) concurrency = parseInt(args[++i], 10);
}

// ── Verify VHS is installed ──────────────────────────────────────────────────
try {
  execSync('vhs --version', { stdio: 'ignore' });
} catch {
  console.error('✗ VHS is not installed or not in PATH.');
  console.error('  macOS/Linux: brew install vhs');
  console.error('  Windows:     winget install charmbracelet.vhs  (requires WSL)');
  process.exit(1);
}

// ── Find .tape files ─────────────────────────────────────────────────────────
function findTapeFiles() {
  const tapesDir = join(__dirname, 'tapes');
  if (!existsSync(tapesDir)) return [];

  const tapeFiles = [];
  for (const category of readdirSync(tapesDir)) {
    if (categories.length > 0 && !categories.includes(category)) continue;

    const categoryDir = join(tapesDir, category);
    if (!statSync(categoryDir).isDirectory()) continue;

    for (const file of readdirSync(categoryDir)) {
      if (!file.endsWith('.tape')) continue;
      const id = file.replace('.tape', '');
      if (ids.length > 0 && !ids.includes(id)) continue;
      tapeFiles.push(join(categoryDir, file));
    }
  }
  return tapeFiles;
}

// ── Run a single tape file ────────────────────────────────────────────────────
function runVhs(tapeFile) {
    // VHS requires forward slashes even on Windows.
    const rel = relative(rootDir, tapeFile).replace(/\\/g, '/');
  return new Promise((resolve) => {
    const startTime = Date.now();
    exec(`vhs "${rel}"`, { cwd: rootDir, timeout: 300_000 }, (error, stdout, stderr) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      if (error) {
        const full = (stderr || stdout || error.message).trim();
        console.log(`  ✗ ${rel} (${elapsed}s)`);
        console.log(full.split('\n').map((l) => `      ${l}`).join('\n'));
        resolve({ success: false, path: rel });
      } else {
        console.log(`  ✓ ${rel} (${elapsed}s)`);
        resolve({ success: true, path: rel });
      }
    });
  });
}

// ── Bounded concurrency ───────────────────────────────────────────────────────
async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = task().then((r) => { executing.delete(p); return r; });
    executing.add(p);
    results.push(p);
    if (executing.size >= limit) await Promise.race(executing);
  }
  return Promise.all(results);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Generating demo GIFs with VHS…\n');
  if (categories.length) console.log(`Categories: ${categories.join(', ')}`);
  if (ids.length) console.log(`IDs:        ${ids.join(', ')}`);
  console.log(`Concurrency: ${concurrency}\n`);

  const tapeFiles = findTapeFiles();
  if (tapeFiles.length === 0) {
    console.log('No .tape files found. Run npm run create:tape first.');
    process.exit(0);
  }

  console.log(`Found ${tapeFiles.length} tape file(s):\n`);
  tapeFiles.forEach((f) => console.log('  - ' + relative(rootDir, f)));
  console.log('');

  const startTime = Date.now();
  const results = await runWithConcurrency(
    tapeFiles.map((f) => () => runVhs(f)),
    concurrency
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Success: ${succeeded}`);
  if (failed.length) {
    console.log(`✗ Failed:  ${failed.length}`);
    failed.forEach((r) => console.log(`  - ${r.path}`));
  }
  console.log(`⏱ Total:   ${totalTime}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
