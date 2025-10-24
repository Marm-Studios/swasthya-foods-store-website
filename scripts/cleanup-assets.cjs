/**
 * scripts/cleanup-assets.js
 *
 * Usage:
 *   # dry-run: show candidates that would be deleted
 *   node scripts/cleanup-assets.js --dry
 *
 *   # delete ALL v-* prefixed assets (default behavior)
 *   node scripts/cleanup-assets.js
 *
 *   # safe mode: only delete v-* files that are NOT present in dist/manifest.json
 *   node scripts/cleanup-assets.js --safe
 *
 * Options:
 *   --dry        : dry-run, do not delete anything
 *   --safe       : keep any v-* files referenced by dist/manifest.json
 *   --assetsDir  : override assets dir (default: "assets")
 *   --distDir    : override dist dir (default: "dist")
 *   --prefix     : file prefix to target (default: "v-")
 *
 * Notes:
 * - Run this in CI (or locally) after build/merge planning.
 * - Always run with --dry first to inspect.
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const hasFlag = (f) => argv.includes(f);

const DRY = hasFlag('--dry');
const SAFE = hasFlag('--safe');
const assetsDir = (argv.find((a) => a.startsWith('--assetsDir=')) || '--assetsDir=assets').split('=')[1];
const distDir = (argv.find((a) => a.startsWith('--distDir=')) || '--distDir=dist').split('=')[1];
const prefix = (argv.find((a) => a.startsWith('--prefix=')) || `--prefix=v-`).split('=')[1];

const SAFELIST = new Set([
  // any non-generated assets you never want removed; add to this list as needed
  'logo.svg',
  'sw.js',
  'theme.json',
  // keep manifest.json itself
  'manifest.json',
]);

function log(...args) {
  console.log('[cleanup-assets]', ...args);
}

if (!fs.existsSync(assetsDir)) {
  log(`assets directory "${assetsDir}" does not exist. Nothing to clean.`);
  process.exit(0);
}

let allowedSet = new Set();

if (SAFE) {
  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log(`ERROR: SAFE mode requested but manifest not found at "${manifestPath}".`);
    log('Run the build first (pnpm build) to generate dist/manifest.json, or run without --safe.');
    process.exit(2);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // manifest entries may include .file, .css arrays, etc.
    for (const k of Object.keys(manifest)) {
      const entry = manifest[k];
      if (entry.file) allowedSet.add(path.basename(entry.file));
      if (entry.css && Array.isArray(entry.css)) entry.css.forEach((c) => allowedSet.add(path.basename(c)));
      if (entry.assets && Array.isArray(entry.assets)) entry.assets.forEach((a) => allowedSet.add(path.basename(a)));
    }
    // also allow manifest.json itself if you copy it to assets
    allowedSet.add('manifest.json');
    log(`SAFE mode: keeping ${allowedSet.size} file(s) referenced in ${manifestPath}`);
  } catch (e) {
    log('ERROR: failed to parse manifest.json:', e.message);
    process.exit(3);
  }
}

// list assets
const allFiles = fs.readdirSync(assetsDir).filter((f) => fs.statSync(path.join(assetsDir, f)).isFile());
const candidates = [];

for (const f of allFiles) {
  if (!f.startsWith(prefix)) continue;
  if (SAFELIST.has(f)) continue;
  if (SAFE && allowedSet.has(f)) {
    // keep files referenced in dist manifest
    continue;
  }
  candidates.push(f);
}

if (candidates.length === 0) {
  log('No matching prefixed files found to delete.');
  process.exit(0);
}

log('Found candidate files to delete:');
candidates.forEach((f) => log('  ', f));

if (DRY) {
  log('Dry run mode -- no files were deleted.');
  process.exit(0);
}

// Delete
let deleted = 0;
for (const f of candidates) {
  const full = path.join(assetsDir, f);
  try {
    fs.unlinkSync(full);
    log('DELETED', f);
    deleted++;
  } catch (err) {
    log('ERROR deleting', f, err.message);
  }
}

log(`Done. Deleted ${deleted} file(s).`);
process.exit(0);
