# Web (Public site + Member portal) – Changelog

- 2026-10-13 – Created memory folder.
- 2026-10-13 – Initialized git repo (branch main), added .gitignore and .gitattributes.
- 2026-10-13 – Added admin-control/settings/flags scope; research-first and testing rules.
- 2026-10-13 – Added build order/module plan; admin glass theme; SQL data layer references.
- 2026-10-13 – Added integration slots (SMS gateway, email gateway, Stripe).
- 2026-10-13 – W0: design/tokens (themes.json, build-theme.mjs, theme.css), w0-theme-preview.html, screenshots, research note.
- 2026-10-13 – W1: prototype/ (base.css, layout.css/js, mock CMS site.js, review tools, w1-home/inner pages), tests 20/20, research note W1.
- 2026-10-13 – Next.js app: package.json, configs, src/ (layout, header, mobile menu, theme toggle, announcement, footer, newsletter + API route, site-config contract, theme engine), tests/e2e (15), README, api-contract.md.
- 2026-10-13 – W2 home (CMS-driven, photos), content pages (CMS blocks), plans, news list, W4 join flow + API routes (otp, lookup, applications), image downloader, tests 49 e2e.
- 2026-10-13 – Home layouts: classic (default, owner pick) + zones, admin section order; admin default dark mode; tests cover both layouts.
- 2026-10-13 – Demo service (no API); join v2 (live summary, smart helpers); feedback/complaint/verify forms; 4-column footer; CMS page hero images; bylaws PDF; layout back to zones.
- 2026-10-13 – Join v3: Continue with Google (demo), auth box, visual polish, nav breakpoint 1140px; tests 66/66.
- 2026-10-13 – Footer v2: CTA + countdown, contact icons, open-now badge, newsletter row, helpful widget, back to top, pattern edge; tests 68/68.
- 2026-10-13 – Branding: logo marks + favicons + manifest in public/brand; BrandMark component; metadata icons/OG/themeColor from site-config.branding; tests 69/69.
- 2026-10-13 – Smart loader (all forms), giving content contract + /give /impact /needs, home verse/impact/needs sections, join "why" section, Amiri Arabic font, nav Give menu, dialog centering fix; tests 84 passed (+ giving.spec.ts).
- 2026-10-13 – Home heart line (hadith) section; tests 85 passed.
- 2026-10-13 – W5 demo: /sign-in, /portal member home, /membership/renew info page, header 'My membership'; tests 94 passed.
- 2026-10-13 – Demo store reader, admin preview bridge, frame-ancestors CSP, data-URL branding.

- 2026-10-13 – Member portal family tree (/portal/family) + member home tile.
- 2026-10-14 – Join flow reads the admin's form: extra questions and steps, rules, ID scan, renewal prefill, save and continue later; API validates answers; 109 tests.
- 2026-10-15 – SaaS: website serves every organization by address; starter content per organization; "temporarily unavailable" / "not in use" pages; preview bridge accepts the org's own admin; 109 tests.
