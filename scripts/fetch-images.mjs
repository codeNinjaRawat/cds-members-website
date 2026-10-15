#!/usr/bin/env node
/**
 * Downloads the website's stock images (no API key needed) into public/images/.
 *   node scripts/fetch-images.mjs            download missing images
 *   node scripts/fetch-images.mjs --force    re-download all
 * Images: Pexels (https://www.pexels.com/license/) – free for commercial use, no attribution required (we credit anyway).
 * Every image was chosen for respectful, community-appropriate content; review before publishing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/images.manifest.json'), 'utf8'));
const outDir = path.join(root, 'public/images');
const force = process.argv.includes('--force');
let ok = 0, skipped = 0, failed = 0;

for (const img of manifest.images) {
  const dest = path.join(outDir, img.file);
  if (!force && fs.existsSync(dest)) { skipped++; continue; }
  const url = `https://images.pexels.com/photos/${img.pexelsId}/pexels-photo-${img.pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=${img.width}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++; console.log('✔', img.file);
  } catch (e) { failed++; console.error('✖', img.file, e.message); }
}

const credits = ['# Image credits', '', 'All photos from [Pexels](https://www.pexels.com/license/) (free to use).', '', '| File | Used for | Source |', '|---|---|---|',
  ...manifest.images.map((i) => `| ${i.file} | ${i.use} | [Pexels photo ${i.pexelsId}](${i.page}) |`)];
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'CREDITS.md'), credits.join('\n') + '\n');
console.log(`\nDone: ${ok} downloaded, ${skipped} already present, ${failed} failed.`);
process.exit(failed ? 1 : 0);
