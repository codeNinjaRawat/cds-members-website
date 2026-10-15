# Web UI prototype (phase 1)

Clickable prototypes of the website, built module by module with mock data. They use the same theme tokens
(`../tokens/theme.css`) and are structured to become React components in the Next.js app.

| Module | Files | Status |
|---|---|---|
| W1 Public layout | `w1-home.html` (header over hero), `w1-inner.html` (solid header) | Delivered for approval |

- `content/site.js` – mock CMS + settings + feature flags (same shape as the future API)
- `assets/base.css` – base design system; `assets/layout.css` + `assets/layout.js` – W1 layout
- `assets/review.*` – review controls (theme + simulated admin flags), not part of the site
- `tests/w1.test.cjs` – automated tests (`npm i -D playwright` then `node tests/w1.test.cjs`); report in `tests/W1-TEST-REPORT.md`
- `screenshots/`
