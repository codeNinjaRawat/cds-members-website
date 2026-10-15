# Web – design files (phase 1, module W0)

| File | What |
|---|---|
| `tokens/themes.json` | **Single source of truth** for website colors, fonts and corners (3 themes × light/dark) |
| `tokens/build-theme.mjs` | `node build-theme.mjs` → checks WCAG contrast, then writes `theme.css` (no npm needed) |
| `tokens/theme.css` | Generated CSS variables (shadcn/ui names) – the Next.js app will import this |
| `w0-theme-preview.html` | Open in a browser: sample page + theme switcher (Bayou / Iznik / Dusk, light / dark) |
| `screenshots/` | Rendered previews |

Change a color → edit `themes.json` → run `node tokens/build-theme.mjs` → refresh the preview.
Later the admin **Website theme editor** (module A8) edits the same structure from the browser.
