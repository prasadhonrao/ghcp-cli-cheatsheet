#!/usr/bin/env node
/**
 * Generate .tape files from scripts/demos.json
 *
 * Each tape launches Copilot CLI, types the command, waits for real output,
 * and records the result. VHS writes the GIF directly to
 * public/demos/{category}/images/{id}.gif from the project root.
 *
 * Usage:
 *   npm run create:tape                            # all demos
 *   npm run create:tape -- --category agents       # only the agents category
 *   npm run create:tape -- --id autopilot          # single demo by ID
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const config = JSON.parse(readFileSync(new URL('./demos.json', import.meta.url), 'utf8'));

/**
 * Convert a steps array entry into one or more VHS tape lines.
 *
 * Supported step shapes:
 *   { "type": "text" }          → Type "text"  (no Enter)
 *   { "key": "Enter" }          → Enter
 *   { "key": "Down" }           → Down
 *   { "key": "Up" }             → Up
 *   { "key": "Tab" }            → Tab
 *   { "key": "Escape" }         → Escape
 *   { "key": "Ctrl+C" }         → Ctrl+C
 *   { "wait": 2 }               → Sleep 2s
 */
function stepToTapeLines(step) {
  if ('type' in step) {
    const safe = String(step.type).replace(/"/g, '\\"');
    return `Type "${safe}"`;
  }
  if ('key' in step) {
    return step.key;
  }
  if ('wait' in step) {
    return `Sleep ${step.wait}s`;
  }
  return `# unknown step: ${JSON.stringify(step)}`;
}

function generateTapeContent(demo, settings) {
  const s = { ...settings, ...demo };

  // Relative output path — VHS runs from repo root.
  const outputPath = `public/images/${demo.category}/${demo.id}.gif`;

  const header = `# ${demo.description}
# Auto-generated from scripts/demos.json — edit that file, then re-run npm run create:tape

Output ${outputPath}

Set FontSize ${s.fontSize}
Set Width ${s.width}
Set Height ${s.height}
Set Theme "${s.theme}"
Set Padding 20
Set BorderRadius 8
Set Margin 10
Set MarginFill "#282a36"
Set Framerate ${s.framerate}
Set TypingSpeed ${s.typingSpeed}

# First visible command in the recording must be 'copilot'.
# Trust the folder once manually before first recording session:
#   copilot   (pick option 2 to remember)
Type "copilot"
Enter
Sleep ${s.startupWait}s
`;

  let body;
  if (demo.steps) {
    // ── Steps-based interactive flow ─────────────────────────────────────────
    body = demo.steps.map(stepToTapeLines).join('\n') + '\n';
  } else {
    // ── Simple command + wait (backward-compatible) ───────────────────────────
    const safeCommand = demo.command.replace(/"/g, '\\"');
    body = `# Run: ${demo.command}
Type "${safeCommand}"
Sleep 3s
Enter
Sleep 0.8s

# Wait for the real response
Sleep ${demo.responseWait}s
`;
  }

  const footer = `
# End of recording
Sleep ${s.exitWait}s
`;

  return header + body + footer;
}

console.log('📝 Creating tape files from scripts/demos.json…\n');

// ── CLI arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filterCategories = [];
const filterIds = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) filterCategories.push(args[++i]);
  else if (args[i] === '--id' && args[i + 1]) filterIds.push(args[++i]);
}

const demos = config.demos.filter(demo => {
  if (filterIds.length && !filterIds.includes(demo.id)) return false;
  if (filterCategories.length && !filterCategories.includes(demo.category)) return false;
  return true;
});

let created = 0;

for (const demo of demos) {
  const tapesDir = join(__dirname, 'tapes', demo.category);
  const tapePath = join(tapesDir, `${demo.id}.tape`);

  if (!existsSync(tapesDir)) {
    mkdirSync(tapesDir, { recursive: true });
    console.log(`  Created: scripts/tapes/${demo.category}/`);
  }

  const content = generateTapeContent(demo, config.settings);
  writeFileSync(tapePath, content);
  console.log(`  ✓ scripts/tapes/${demo.category}/${demo.id}.tape`);
  created++;
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✓ Created ${created} tape file(s)`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log('\nNext: npm run create:gif');
