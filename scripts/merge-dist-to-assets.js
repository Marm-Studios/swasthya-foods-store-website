// node scripts/merge-dist-to-assets.js
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dist = path.join(projectRoot, 'dist');
const assets = path.join(projectRoot, 'assets');

if (!fs.existsSync(dist)) {
  console.error('dist directory not found — run pnpm build first');
  process.exit(1);
}

if (!fs.existsSync(assets)) fs.mkdirSync(assets, { recursive: true });

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else {
      const dest = path.join(assets, path.basename(full));
      fs.copyFileSync(full, dest);
      console.log('COPY', full, '->', dest);
    }
  }
}

walk(dist);

const manifestSrc = path.join(dist, 'manifest.json');
const manifestDest = path.join(assets, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('COPIED', manifestSrc, '->', manifestDest);
}

console.log('Done.');
