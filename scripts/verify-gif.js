#!/usr/bin/env node
/**
 * Verify that every demo defined in scripts/demos.json has a corresponding
 * GIF in public/images/{category}/{id}.gif.
 *
 * Usage: npm run verify:gifs
 * Exit code 1 if any GIFs are missing.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const config = JSON.parse(readFileSync(new URL('./demos.json', import.meta.url), 'utf8'));

console.log('🔍 Verifying demo GIFs…\n');

let missing = 0;
let present = 0;

for (const demo of config.demos) {
  const gifPath = join(rootDir, 'public', 'images', demo.category, `${demo.id}.gif`);
  if (existsSync(gifPath)) {
    console.log(`  ✓ ${demo.category}/${demo.id}.gif`);
    present++;
  } else {
    console.log(`  ✗ ${demo.category}/${demo.id}.gif  ← MISSING`);
    missing++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✓ Present: ${present}`);
if (missing) {
  console.log(`✗ Missing: ${missing}`);
  console.log(`\nRun npm run generate:demos to record missing GIFs.`);
}
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

if (missing) process.exit(1);
