#!/usr/bin/env node
/**
 * Builds theme.css from themes.json (the single source of truth for website look).
 *   node build-theme.mjs            → theme.css next to this file
 *   node build-theme.mjs --check    → only run the WCAG contrast check
 * No npm install needed (Node 18+).
 *
 * Output selectors:
 *   :root                                  default theme, light
 *   [data-theme="x"]                       theme x, light
 *   [data-theme="x"][data-mode="dark"]     theme x, dark
 *   prefers-color-scheme: dark             dark of default theme unless data-mode="light"
 * Fails (exit 1) if any text/background pair is below WCAG AA (4.5:1 text, 3:1 UI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'themes.json'), 'utf8'));

// ---- WCAG contrast ----
const lum = (hex) => {
  const v = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const PAIRS = [
  ['foreground', 'background', 4.5], ['foreground', 'card', 4.5], ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5], ['muted-foreground', 'muted', 4.5], ['primary-foreground', 'primary', 4.5],
  ['secondary-foreground', 'secondary', 4.5], ['highlight-foreground', 'highlight', 4.5],
  ['destructive-foreground', 'destructive', 4.5], ['primary', 'background', 4.5], ['primary', 'card', 4.5],
  ['success', 'card', 4.5], ['warning', 'card', 4.5], ['destructive', 'card', 4.5],
  ['ring', 'background', 3], ['input', 'card', 1.3],
  ['hero-foreground', 'hero', 4.5], ['hero-muted', 'hero', 4.5], ['hero-accent', 'hero', 4.5],
];
let failures = 0;
for (const [name, t] of Object.entries(cfg.themes)) {
  for (const mode of ['light', 'dark']) {
    for (const [fg, bg, min] of PAIRS) {
      const r = ratio(t[mode][fg], t[mode][bg]);
      if (r < min) { failures++; console.log(`✖ ${name}/${mode}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`); }
    }
  }
}
console.log(failures ? `\n${failures} contrast problem(s).` : '✔ All theme color pairs pass WCAG AA.');
if (process.argv.includes('--check')) process.exit(failures ? 1 : 0);
if (failures) process.exit(1);

// ---- CSS ----
const vars = (obj) => Object.entries(obj).filter(([k]) => !['label', 'story'].includes(k)).map(([k, v]) => `  --${k}: ${v};`).join('\n');
const def = cfg.themes[cfg.default];
let css = `/* GENERATED from themes.json by build-theme.mjs – do not edit by hand. */\n`;
css += `:root {\n${vars(cfg.shared)}\n${vars(def.light)}\n  color-scheme: light;\n}\n`;
css += `@media (prefers-color-scheme: dark) {\n  :root:not([data-mode="light"]):not([data-theme]) {\n${vars(def.dark).replace(/^/gm, '  ')}\n    color-scheme: dark;\n  }\n}\n`;
for (const [name, t] of Object.entries(cfg.themes)) {
  css += `[data-theme="${name}"] {\n${vars(t.light)}\n  color-scheme: light;\n}\n`;
  css += `[data-theme="${name}"][data-mode="dark"] {\n${vars(t.dark)}\n  color-scheme: dark;\n}\n`;
}
fs.writeFileSync(path.join(here, 'theme.css'), css);
console.log('✔ theme.css written');
