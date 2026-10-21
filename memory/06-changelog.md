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
- 2026-10-15 – /events + /events/[id] with registration (waitlist, guests, codes, members-only types; API re-checks); join: payment methods, cover fees, discount code, check waiting to clear; member home follows card/directory switches; /portal/directory (off by default); 118 tests.
- 2026-10-15 – Renewal engine shared contract: src/lib/content/renewal.ts (termFor, priceFor, canRenew, timeline, standingOn, duesCoverVote); MembershipSettingsSchema now checks plan/lifecycle contradictions.
- 2026-10-15 – member-records contract (fields access, checkValues, directoryCard, findDuplicates, CSV, planImport); directory follows privacy rules.
- 2026-10-15 – Groups: getGroups loader, register API checks group membership, group event gate, member home 'Your groups', POST /api/groups/membership.
- 2026-10-15 – Communication rules (contextOf, MUST_INCLUDE, ALWAYS_ON, renewalEmails, renderHtml) + campaigns contract; /email-preferences page and PUT /api/preferences.
- 2026-10-15 – Events public copies + seats + refunds + calendar; payments.ts (checkoutTotal, receipts); member home follows card / self-service; sign-in start page.

## 2026-10-18 – Member portal: Records library, Who served, Ask or tell us
- /portal/records – public + members-only records (recordsFor 'members'), filter "my masjid and the organization" and by kind.
- /portal/leadership – every past term the organization shows (memberPastLeadership in lib/community/officials.ts: all seats incl.
  Area Representatives and Secretaries, never member IDs or emails), search by name or seat.
- /portal/requests – "Ask or tell us": categories from the admin's `work-settings` (publicHelpdesk – public part only), POST /api/tickets
  (PublicTicketSchema, honeypot, category must be on the website); my requests list (demo: this browser). Member home links all three.
- Contract lib/community/work.ts (shared with admin and BE). tsc clean. Not yet browser-tested here (the web app needs its own server).

## 2026-10-19 – from the review calls (Agent A)
- Join form: the "how are you joining" classes come from Membership rules › Member classes (names, blurbs; skipped when one
  class is offered); plans can be limited to an age range; the voting preview reads the class rule.
- Portal › Ask or tell us: one-tap "My membership record is wrong" / "My center is wrong" prefilled from the record.
- Giving: after a monthly gift the thank-you offers membership when the "monthly contributors are members" rule is on
  (`monthlyOffer`); /give passes it from the membership settings.
- Contracts (lib/community + lib/content, synced to the admin): membership classes + plan ages, queue routing + follow-ups,
  role dashboard cards, per-center money, center-change rules, two help-desk categories.

## 2026-10-21 – O1 Content model v2 + block library + live blocks (R6.1, website v2 "One site, many doors")
- `lib/content/pages.ts`: Page v2 – `scope` (org | masjid:<center id>), `template` (article | landing | hub), `seo`, `visibility` (public | members),
  `status` draft | review | scheduled | published | archived, `publishAt` / `unpublishAt` (Houston time), `owner`, `reviewedAt`. Every v1 page stays valid.
- Blocks v2: 20 static blocks (v1 eight + image, gallery, columns, cards, steps, people, buttons, documents, table, embed [allow-listed hosts only], verse, divider)
  and 10 LIVE blocks that render admin data on the server: prayer-times (today/week/month per masjid), next-jumuah, events, campaigns, leadership (board/zone/masjid),
  masjid-cards, deadline (voting record date), news, plans, form (feedback/complaint/verify). Live blocks default to the page's masjid.
- `lib/content/page-rules.ts` (shared with admin): isLive/liveReason (schedule window), effectiveSeo, blockMasjid, blockWidth, masjidPageSlug, embedAllowed.
- Renderer: `components/cms/PageView.tsx` + `blocks/StaticBlocks.tsx`, `blocks/LiveBlocks.tsx`, `blocks/inline.tsx` (**bold** and [links] only – no HTML from the CMS),
  `MembersGate.tsx` (members-only pages). `[...slug]` route: visitors see live pages only; `?preview=1` (admin preview frame) shows drafts with the reason badge;
  metadata/Open Graph from `seo`. Styles: `styles/blocks.css` (phone-first grids, sticky-column tables, 48 px buttons).
- Loaders: `getPagesDoc`, `getPage(slug, { includeUnpublished })`, `getMasjidPages(center)`.
- Starter page `style-guide` (draft) shows every block – QA page and copy source for admins. Admin: previewPaths now `?preview=1`; contracts synced (+ page-rules.ts).
- Tests: `tests/unit/page-rules.test.ts` 7/7 (node --experimental-strip-types --test); `tests/e2e/cms-blocks.spec.ts` (needs the site in demo mode – owner to run);
  tsc clean in web and admin. Research note: `memory/research/O1-content-model-and-blocks.md`.

## 2026-10-21 – O3 Masjid micro-sites (R6.3) + network directory
- `/masjid/<id>` and `/masjid/<id>/{prayer-times, jumuah, events, programs, announcements, leadership, give, gallery, visit, screen}` – built-in pages composed
  from live blocks + the masjid profile (`lib/masjid/masjid-site.ts`); an admin page at the same address replaces the built-in one; other admin pages under
  `masjid/<id>/` join the chip menu. Slugified names redirect to the id; inactive masjid → friendly page (404). `screen` = lobby signage view (no site chrome, auto-refresh 5 min).
- `CenterSchema.profile` (photo, gallery, story, accent, established, capacity, facilities, languages, hours, email, social, parking, staff) – edited in Admin › Zones and centers
  › center dialog › "Masjid page". `NewsItem.masjid` / `showOnMasjids` for per-masjid announcements. Masjid-cards live block links to `/masjid/<id>`.
- `/masajid` (directory by zone, facts, cards) and `/zones/<id>` (director, masajid, zone leaders) as built-in pages; nav "All masajid" → /masajid.
- Shell: `components/masjid/MasjidShell.tsx` (band with photo, crumbs, address/phone, sticky chip menu, accent via `--masjid-accent`), `styles/masjid.css`.
- Tests: `tests/unit/masjid-site.test.ts` 3/3 (node + `tests/unit/register.mjs` alias loader), `tests/e2e/masjid.spec.ts` (needs demo mode). tsc clean web + admin.
  Research note: `memory/research/O3-masjid-sites.md`.

## 2026-10-21 – O4 Activity engine (R6.4)
- `lib/activity/activity.ts`: activity DERIVED from public data (events, news, campaigns, officials, iqamah rule dates, special prayers, public records, masjid pages) –
  nothing stored twice; `forMasjid`, `byKind`, `thisWeek`, `toRss`. Loader `getActivity()`.
- `activity` live block (view week | feed, kinds, limit) rendered by `components/cms/blocks/ActivityBlock.tsx`; masjid overview shows "This week"; routes
  `/masjid/<id>/activity` (built-in, `?kind=`), `/activity`; RSS `/masjid/<id>/feed`, `/activity/feed`. Styles `styles/activity.css`.
- Tests: `tests/unit/activity.test.ts` 5/5 (all unit suites: `node --experimental-strip-types --import ./tests/unit/register.mjs --test tests/unit/*.test.ts`). tsc clean web + admin.

## 2026-10-21 – O2 Site shell v2 (R6.2)
- `/search` (lib/search/search.ts – pages' static text, masajid, zones, news, public events, campaigns, public records; grouped results) + header search icon.
- "My masjid" chip (components/layout/MyMasjid.tsx; localStorage, set when a masjid page is opened); masjid pages add `Mosque` JSON-LD.
- `/sitemap.xml`, `/robots.txt` (ISGH_NOINDEX aware), share images: `app/opengraph-image.tsx` (organization) and `app/masjid/[slug]/opengraph-image.tsx`.
- Nav starter: "What’s happening" → /activity. Tests: tests/unit/search.test.ts 2/2. tsc clean.

## 2026-10-21 – O6 Prayer & khutbah network-wide (R6.6)
- `prayer-times` document gains `khutbah` (enabled, rows [date, center, khateeb, topic, language, time, note], feedbackUrl, note) – old documents parse with defaults.
  Helpers `nextFriday`, `khutbahFor`, `parseKhutbahSheet` (paste from Google Sheets/Excel, TSV or CSV, any column order, US dates, center-name matching).
- Admin › Prayer times › **Friday khutbah** tab (`admin/.../KhutbahTab.tsx`): per-Friday table editor, add masjid, copy last Friday's rows, paste-from-sheet with merge/replace.
- Website: `khutbah` live block (one masjid's coming Fridays / every masjid next Friday by zone), `/khutbah` page, masjid Jumuah page shows "Coming Fridays",
  `/prayer-times/ical?masjid=<id>` calendar subscription (30 days of iqamah + Jumuah), Print button on masjid prayer/jumuah pages + print stylesheet (`styles/khutbah.css`).
- Tests: tests/unit/khutbah.test.ts 4/4. tsc clean web, admin, BE (BE reads the admin copy of the schemas).

## 2026-10-21 – O7 / O9 / O10 / O11 (R6.7, R6.9, R6.10, R6.11) + O1.5 delegated editing (R6.1c)
- O7: `/programs` (classes, youth, sisters, community – events by category, `?masjid=` filter chips); starter pages `services` hub + six service pages
  (financial assistance, Islamic education, job networking, nikah, dawah, funerals) written from the isgh.org trace, text-first.
- O9: `/documents` (public records by category from the Records library). News items carry `masjid` / `showOnMasjids` (O3).
- O10: `lib/community/public-election.ts` (public projection = BE GET /public/elections/:year shape), `election` live block (status, dates, seats/candidates,
  certified results), `/elections/<year>`; the starter `elections` page starts with the live block. Loaders `getPublicElection`, `getElectionYears`.
- O11: `site-config.redirects` (exact or `prefix*`; `lib/site-config/redirects.ts`) applied by `[...slug]` for unknown addresses – 25 starter rules for old isgh.org
  addresses; Admin › Website › Redirects and short links (try-an-address probe); Website health panel in Pages (stale, no owner, drafts, scheduled, missing alt, no description, empty);
  Import pages… (paste a pages JSON – drafts only); `tools/import-isgh-pages.mjs` → `isgh-org/import/pages-import.json` (60 current isgh.org pages as drafts with owners), `redirects-import.json`, CSV.
- O1.5: permission `center.content` now also covers the masjid's website pages; new built-in role **Masjid web editor** (center-scoped). Admin › Pages for such editors:
  only their masajid's pages, statuses draft/review, "Submit for review"; admin store API and BE `PUT /admin/documents/pages` refuse changes outside scope or publishing
  (`pagesChangeProblem` in lib/community/access.ts). Tests: tests/unit/pages-scope.test.ts 2/2 (all unit: 24/24). tsc clean web, admin, BE.
- O5.1 `/masajid?zip=77036` – find my masjid by ZIP (homeForZip rule) shown as a callout with a link; O9 news items: `image`, `attachments`, `pinned`, `expiresAt`
  (pinned first, expired hidden; the item page shows the image and attachments as documents).
