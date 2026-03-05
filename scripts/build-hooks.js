#!/usr/bin/env node
/**
 * Copy GSD hooks to dist for installation.
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join(__dirname, '..', 'hooks');
const DIST_DIR = path.join(HOOKS_DIR, 'dist');

// Discover hooks dynamically — any gsd-*.js file in hooks/ is shipped
const allFiles = fs.readdirSync(HOOKS_DIR);
const hooksToCopy = allFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.js'));

function build() {
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Copy hooks to dist
  for (const hook of hooksToCopy) {
    const src = path.join(HOOKS_DIR, hook);
    const dest = path.join(DIST_DIR, hook);

    if (!fs.existsSync(src)) {
      console.warn(`Warning: ${hook} not found, skipping`);
      continue;
    }

    console.log(`Copying ${hook}...`);
    fs.copyFileSync(src, dest);
    console.log(`  → ${dest}`);
  }

  console.log('\nBuild complete.');
}

build();
