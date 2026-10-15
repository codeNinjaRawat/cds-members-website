#!/usr/bin/env node
/**
 * Copies the design source of truth (design/tokens/themes.json) into the app fallback theme
 * (src/lib/theme/default-themes.json) and regenerates design/tokens/theme.css – only if all colors pass WCAG AA.
 * In production the live theme comes from the BE (admin Website theme editor); this file is the fallback.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'design/tokens/themes.json');
execFileSync(process.execPath, [path.join(root, 'design/tokens/build-theme.mjs')], { stdio: 'inherit' }); // exits non-zero on contrast failure
fs.copyFileSync(src, path.join(root, 'src/lib/theme/default-themes.json'));
console.log('✔ src/lib/theme/default-themes.json updated');
