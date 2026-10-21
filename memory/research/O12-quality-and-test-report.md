# O12 · Quality pass and test report – website v2 (R6) – as of 2026-10-21

Status: **BUILT, verified by type checks and white-box tests; browser (black-box) verification pending** – the owner's dev server runs in live-API mode and errors on every page, and the device shell cannot run Next.js (no Linux SWC binary). Nothing is committed or deployed.

## What was verified (automated)
| Check | Result |
|---|---|
| `tsc --noEmit` web | clean |
| `tsc --noEmit` admin | clean |
| `tsc --noEmit` BE | clean |
| Unit (`cd web && npm run test:unit`) | 24 / 24 – page rules 7, masjid site 3, activity 5, search 2, khutbah 4, pages scope 2 |
| isgh.org import script | 60 pages → `isgh-org/import/pages-import.json` |

## Black-box specs written (run with the site in demo mode: `start-dev.cmd`, then in `web/`: `npx playwright test tests/e2e/cms-blocks.spec.ts tests/e2e/masjid.spec.ts`; in `admin/`: `npx playwright test tests/e2e/admin.spec.ts -g "page"`)
- `web/tests/e2e/cms-blocks.spec.ts` – every block renders at 390 px and 1280 px without horizontal scroll; drafts hidden unless `?preview=1`; embeds allow-listed; v1 pages still render; gallery columns.
- `web/tests/e2e/masjid.spec.ts` – masjid overview band + chips + live sections; every sub-route; slug redirect; 404s; screen view hides chrome; `/masajid` → masjid → zone.
- `admin/tests/e2e/admin.spec.ts` – pages (palette) and page composer (template, reorder, duplicate, remove, settings, live block).

## Phone-first review checklist (to sign per route during the browser pass)
For `/`, `/masajid`, `/masjid/<id>` (+ prayer-times, jumuah, activity, events, programs, announcements, leadership, give, gallery, visit, screen), `/zones/<id>`, `/activity`, `/khutbah`, `/programs`, `/documents`, `/services/*`, `/elections` + `/elections/<year>`, `/search`, `/style-guide?preview=1`:
1. 390 px: one column, no horizontal scroll, tap targets ≥ 44 px, sticky chip menu scrolls sideways, tables scroll inside their box with the first column sticky.
2. 768 px and 1280 px: grids open to 2 / 3 columns; hub pages use the wide column; article pages stay at 760 px.
3. Light and dark: contrast of chips, bars, cards (theme variables only – no new hex except the six masjid accents, each with a dark-mode value).
4. Keyboard: every chip, card and button reachable; focus visible; composer reorder works with ↑/↓.
5. Screen reader: block sections are landmarks/lists; prayer list has an aria-label; results tables have scope attributes.
6. Reduced motion: no animation added by v2.
7. Share: `/masjid/<id>` and `/` return an Open Graph image; `sitemap.xml` and `robots.txt` answer.
8. Print: masjid prayer-times and jumuah pages print as a compact table (no chrome).
9. Empty states: a masjid with no events/campaigns/announcements shows the admin's emptyText or nothing – never an empty box.
10. Errors: unknown masjid / sub-route / year → 404 page; inactive masjid → "no longer part of the network".

## Known limits / next
- Live mode: `getPublicElection` probes the current and previous year on the BE (no list endpoint); `/public/elections/:year` shape is mirrored, not shared code.
- Khutbah schedule per masjid uses center *names* (as prayer settings do); renaming a center in Zones and centers requires updating rows (same as iqamah rules).
- Media library (R6.1d) not built: images are still URLs/paths typed in the composer (alt text required by the schema). QR codes for short links not built.
- Activity engine is derived; "times changed yesterday"-type items need a stored log later (noted in O4).
- Visual direction: the new pages use the existing Bayou theme tokens; the "light editorial" refresh of the home page and header (O5.3) is still open.
