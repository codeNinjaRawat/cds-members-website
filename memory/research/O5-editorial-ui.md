# Research note – R6.5 · The new UI: isgh.org reimagined ("Editorial Paper") – first pass

Date: 2026-10-21 · Owner: "the `isgh-org` folder is the brief – re-create that website with a modern look." · Status: BUILT (theme + home + shell polish); route-by-route visual pass continues in the browser (needs demo mode).

## 1. What isgh.org is, in one look (from `isgh-org/README.md`)
A hamburger menu, five full-width buttons (Friday schedule, Become a member, Support causes, Support ISGH, Election), a slider, then footer. Everything else lives one click away or inside flyer images. The content is good; the surface is 2016 WordPress with leaked shortcodes.

## 2. Design decisions
| Topic | Decision |
|---|---|
| Theme | New theme **Editorial Paper**: warm paper background `#FAF7F1`, ink `#1B1A17`, forest green primary `#0F5B4A`, saffron highlight `#A85A16` (light) / `#F0B35A` (dark), deep hero `#0F2E29`. Passes the contrast gate (WCAG AA) in light and dark. Added to `design/tokens/themes.json`; set as the starter theme (admins can switch back to Bayou / Iznik / Dusk in Website › Theme). Fonts stay Bricolage Grotesque + Public Sans (already distinctive; one font change later via tokens). |
| Home | New layout **editorial**: photo hero with kicker, headline, lead, and the five quick actions as tiles (primary / accent / dark / light tones) – isgh.org's buttons, made beautiful and admin-editable. Then live sections in admin-chosen order: Today (prayer strip + next Jumuah), Voting deadline, This week (activity), Our masajid (cards by zone), Services (tiles), Programs & events, Give (campaigns + Zakat/Sadaqah/masjid buttons, dark band), News, Election, Verse, Closing. Every section is a live block – the same renderers as CMS pages. |
| Admin | CMS › Home page: layout picker gains "Editorial (website v2)"; new "Editorial hero" tab (kicker, headline, lead, photo, quick actions, home masjid for the prayer strip, service tiles, giving text). Sections list includes the new live sections. |
| Shell | Editorial theme polish: frosted solid header, soft card shadows, tighter display tracking, accent glow on the current masjid chip. Header/footer structure (W1) unchanged; menus from Website › Menus. |
| Masjid pages | Already built in O3 with the band + chip menu; under the editorial theme they inherit the paper background, green/saffron accents and the masjid's own accent color. |

## 3. Phone-first
- Hero: photo 56 vh, headline ≤ 14 ch at `clamp(2.3rem, 7.5vw, 5rem)`, lead ≤ 56 ch, quick actions stack (1 col → 2 → 5), 72 px tall tiles.
- Sections: 3 rem rhythm, headline + "More →" on one row (wraps on phones), one column everywhere at 390 px; grids open at 640 / 760 / 900 / 1000 / 1100 px.
- Give band: dark hero color for contrast with the page; campaign cards restyled for the dark surface.

## 4. Still to do in this module
Browser pass of every route under the new theme (needs `start-demo-3010.cmd`); mega-menu groups in the starter menu (Prayer · Masajid · Services · Programs · Give · Membership · About) and a footer v2 column set from the isgh.org trace; photography set for the hero and masjid bands (media library R6.1d).
