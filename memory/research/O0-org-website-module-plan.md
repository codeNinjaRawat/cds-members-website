# Research note – O0 · Organization website v2 ("One site, many doors") – module plan

Date: 2026-10-21 · Status: **PLAN – awaiting owner approval, module by module** · Owner rule: no building until a module is approved; work in small modules; take the time needed; the result must be a full, detailed, professional organization website.

Inputs: full trace of isgh.org (`membership/isgh-org/README.md`, 217 pages + 233 posts), the current `web` app (block CMS with 8 block types, home builder, `[...slug]` pages, events, prayer, officials, giving, campaigns, portal), admin › Website (pages, menus, home, news, announcement, theme), the BE contracts, and a look at how masjid platforms (MasjidBox, Masjidaa) and chapter-based nonprofits (shared structure + per-chapter branding + editor-only chapter access) organize multi-location sites.

## 0. The idea in one paragraph

Today isgh.org is one flat WordPress site where every masjid is a card on a directory page and every piece of news is a flyer image. The new site is **one organization site with a door for every masjid**: the organization level (network, zones, services, giving, elections, membership) and a **micro-site for each masjid** at `/masjid/<name>/…` with its own sub-routes (prayer times, jumuah, events, programs, announcements, leadership, give, gallery, visit, custom pages). Nothing on the site is typed into code: **admins compose every page from blocks** in a Page Composer, and the smart part is that most blocks are *live* – a prayer-times block shows the masjid's real times, an events block shows its real events, a campaign block shows real progress – and each masjid gets an **automatic activity stream** built from what admins already do in the admin app (publish an event, post an announcement, change an iqamah time, start a campaign, certify an election). The masjid's own team edits only its own masjid (existing roles + zone scopes), the main office approves. Everything is per tenant (any masjid organization), ISGH is client #1.

What makes it unique compared with isgh.org and the vendors we looked at: (1) masjid micro-sites with real sub-routes and their own activity, not a directory card; (2) live blocks instead of hand-typed content; (3) an activity engine (nobody else has "what happened at my masjid this week" generated automatically); (4) delegated editing with approval; (5) every announcement is text first (searchable, accessible, translatable) with the flyer as an attachment; (6) share cards, print views and a screen view for each masjid from the same data; (7) privacy-first – no ad trackers on membership or donation pages.

## 1. Route map (what the finished site answers to)

Organization level (exists today unless marked NEW):
- `/` home · `/membership` (+ `/plans`, `/join`, `/guide`, `/identity-policy`, `/renew`) · `/sign-in` · `/verify` · `/portal/*`
- `/prayer-times` (all masajid) · `/events` (+ `/events/<id>`) · `/campaigns` · `/give` · `/needs` · `/impact` · `/news` (+ `/news/<slug>`) · `/leadership` · `/records` · `/complaints` · `/feedback`
- NEW `/masajid` (network directory + map + "find my masjid" by ZIP) · NEW `/zones/<zone>` · NEW `/services` hub + `/services/<slug>` · NEW `/programs` hub + `/programs/<slug>` · NEW `/elections` hub (+ `/elections/<year>`) · NEW `/documents` (annual reports, constitution, policies) · NEW `/khutbah` (Friday schedule across all masajid) · NEW `/search` · any admin-made page at `/<slug>` (exists)

Masjid level – NEW, all under `/masjid/<slug>/`:
- `/masjid/<slug>` overview (hero, today's prayer strip, next jumuah, this week's activity, leadership, give, visit)
- `…/prayer-times` (monthly table, iqamah, print, iCal, QR) · `…/jumuah` (khateeb schedule, 1st/2nd jumuah, parking notes) · `…/events` (+ registration via existing events) · `…/programs` (classes, weekend school, halaqas, youth, sisters) · `…/announcements` (text-first, with flyer) · `…/activity` (the automatic stream, filterable) · `…/leadership` (Associate Director, area reps, committees, imam/staff) · `…/give` (this masjid's funds + campaigns) · `…/gallery` · `…/visit` (address, map, hours, parking, accessibility, contacts) · `…/minutes` (members only – exists in portal) · `…/screen` (digital-signage view) · `…/<custom-page>` (admin-composed)

Rules: slugs and names come from Admin › Zones and centers; a masjid that is `active:false` returns a friendly "no longer part of the network" page; redirects from old isgh.org paths live in Admin › Website › Redirects (module O11).

## 2. Modules (level 1) and deep sub-modules (level 2)

Each module = research note → design per phone → build → tests → owner approval. Status column starts at TODO. "Source of data" tells where content comes from (never code).

### O1 · Content model + Page Composer (the foundation everything else uses)
Goal: admins compose any page, for the organization or for one masjid, from a block library; live blocks bind to real data.
- O1.1 Page model v2: `scope` (org | masjid:<id>), `template` (plain, landing, hub, masjid-sub), SEO (title, description, share image), `publishAt/unpublishAt`, `status` (draft, in review, scheduled, published, archived), `versions` with "restore", author + approver, `visibility` (public, members, groups).
- O1.2 Block library v2 (static): hero, rich text (headings, links, lists, quotes, Arabic line with source), image + gallery, two-column, cards grid, timeline/steps, people grid, facts/stats, FAQ, callout, CTA band, buttons row, document list (PDFs), table, embed (YouTube/map/iframe allowlist), divider/spacer, verse/hadith band (source required).
- O1.3 Live blocks (bind to admin data; no typing): prayer times (today / week / month, per masjid), next jumuah, events list (filters: masjid, category, upcoming), announcements feed, campaign progress, funds grid, leadership (officials by masjid/zone), masjid card(s), zone map, membership deadline countdown, news list, documents from library, activity stream, forms (volunteer, contact, speaker request, feedback – existing forms engine).
- O1.4 Page Composer UI in admin (glass theme): block palette, drag to reorder, inline editing, per-block settings, mobile/desktop preview, "preview link" for reviewers, version history, schedule, duplicate page, page templates ("Ramadan page", "Eid page", "Campaign page", "Masjid overview").
- O1.5 Delegated editing: masjid editors (role + masjid scope) can edit only their masjid's pages and announcements; `approval` flow (submit → office approves/edits → publish), audit log, "who changed what".
- O1.6 Media library: upload images/PDFs with alt text required, credits, focal point, auto sizes/WebP, per-masjid folders, reuse across pages (BE files module B6c).
- O1.7 Contracts: `/public/pages?scope=…`, `/public/masjid/<slug>/…`, admin endpoints; Zod schemas in `web/src/lib/content`, mock + demo store, `api-contract-web.md`.
- Tests: schema round-trips, renderer skips unknown blocks, scheduled publish, scope isolation (masjid editor cannot touch another masjid – tested like tenancy), preview links expire.

### O2 · Site shell v2 (navigation, search, footer, share)
- O2.1 Navigation from CMS with masjid-aware items ("My masjid" remembers the visitor's choice; member → their masjid), mega-menu groups (Prayer, Masajid, Services, Programs, Give, Membership, About), mobile sheet.
- O2.2 Site search (pages, news, events, masajid, documents, programs) – server index, phone-first results.
- O2.3 Footer v2 from CMS (columns, contact, newsletter double opt-in, social, 501(c)(3), tax ID line), language switch placeholder (i18n flag), theme toggle.
- O2.4 Share cards: Open Graph image generated per page/event/masjid/announcement (for WhatsApp/Facebook – this is how ISGH actually spreads news).
- O2.5 Utility routes: `/search`, `/sitemap.xml`, `/robots.txt`, `/manifest` (PWA icon), structured data (Organization, Place, Event, Mosque).

### O3 · Masjid micro-sites (the "doors")
- O3.1 Masjid profile model (extends CenterSchema): hero photo + gallery, short story, accent color (from a safe palette), established year, capacity, facilities (wudu, sisters' hall, parking, wheelchair, library…), languages of khutbah, hours, contacts (role emails `ad.<center>@`), social links, "also known as", external site link.
- O3.2 `/masjid/<slug>` overview layout (phone-first): today's prayer strip → next jumuah → this week (activity) → announcements → events → programs → leadership → give → visit.
- O3.3 `…/prayer-times`: monthly table (print, PDF, iCal, QR), iqamah rules from Admin › Prayer times, special prayers (Eid, taraweeh), change notices from the activity engine.
- O3.4 `…/jumuah`: khateeb schedule (admin table or Google-Sheet import), jumuah count/times, parking/overflow notes, "rate the khutbah" + "suggest a khateeb" (forms engine).
- O3.5 `…/events`, `…/programs` (program = recurring class/halaqa/school with schedule, teacher, age group, fee, registration link), `…/announcements` (text-first + attachment), `…/leadership` (AD, area reps, committees, imam/staff from Officials), `…/give` (funds + campaigns scoped to the masjid), `…/gallery`, `…/visit`.
- O3.6 `…/screen`: full-screen signage view (prayer times, announcements ticker, next event) – same data, no login, auto-refresh.
- O3.7 Custom pages per masjid via Page Composer (scope masjid).
- O3.8 Old masjid-level links: `/champions`, `/katy`… map to `/masjid/<slug>/give` through redirects (O11).

### O4 · Activity engine (automatic "what's happening")
- O4.1 Event sources: event published/changed/cancelled, announcement posted, campaign started/milestone/closed, prayer or iqamah change, jumuah schedule change, officials change (new AD, vacancy), minutes published (members), program added, gallery added, document published, election milestone (nominations open, candidates, results).
- O4.2 Activity record: `{ masjidId|org, kind, title, summary, href, at, visibility, author }` – written by the BE when the source changes (outbox), never typed.
- O4.3 Views: masjid `…/activity` (filters by kind), org `/activity`, "This week at <masjid>" digest block, weekly email/WhatsApp-ready digest (uses communication module), RSS/iCal feeds.
- O4.4 Privacy: members-only items never appear publicly; admin can hide an item; retention setting.

### O5 · Network, zones and "find my masjid"
- O5.1 `/masajid`: map + list by zone, filters (services, jumuah time, language), search by ZIP ("Which masjid am I in?" from existing placement rules D14), cards with today's next prayer.
- O5.2 `/zones/<zone>`: director, centers, area reps, zone announcements, zone giving.
- O5.3 Home v2 sections powered by live blocks (next prayer near me, this week across the network, deadline countdown, campaigns), keep "zones" / "classic" layouts switchable.

### O6 · Prayer and khutbah across the network
- O6.1 `/prayer-times` v2: pick masjid (remembered), month navigation, print/PDF for the office (replaces the monthly WordPress page per month), iCal subscription, Hijri dates.
- O6.2 `/khutbah`: Friday schedule for all masajid (what the Google Sheet does today) with khateeb, topic, language, time; CSV import from the committee's sheet; "live updated" badge.
- O6.3 Khutbah committee pages (standards, feedback survey, speaker request) as composed pages + forms.

### O7 · Services and programs directories
- O7.1 Services hub (`/services`): financial assistance, education, job networking, nikah, dawah, funerals & cemetery, counseling – each a composed page with live blocks (contact, forms, documents, related masajid).
- O7.2 Programs directory (`/programs`): all classes/schools/halaqas across masajid with filters (masjid, age, audience, day, fee); each program page; registration via events or external link.
- O7.3 Program model in admin (per masjid or org), seasons (Ramadan, summer), waitlist flag.

### O8 · Giving v2 (per masjid and per fund)
- O8.1 Masjid-scoped funds and campaigns (existing giving + fundraising modules get a `masjidId`), `/masjid/<slug>/give`.
- O8.2 Giving hub tiles from admin (replaces /donate's 12 tiles), Zakat / Fitra / Fidya pages with calculators as blocks, recurring giving, receipts (existing).
- O8.3 "Support your masjid" short links and QR per masjid (printable).

### O9 · News, announcements, media and documents
- O9.1 News v2: rich text, cover image, attachments, categories, masjid/zone/org scope, pinned, expiry; excuse letters and schedules as attachments with text summary (fixes isgh.org's image-only posts).
- O9.2 Documents hub `/documents`: annual reports, audited financials, constitution & bylaws (version dates), policies, forms – from the media library with categories and years.
- O9.3 Galleries per masjid/event with consent note; media credits.
- O9.4 Seasonal pages as templates: Ramadan (timings table, taraweeh, iftar, khatam), Eid (prayer timings per masjid, excuse letter), auto-archived by year.

### O10 · Elections center (public)
- O10.1 `/elections` hub from the elections module: timeline, EC contact, positions, forms (PDF + online), candidate list with resumes/videos, meet-the-candidate events, early-voting centers (live from masjid data), results per center, revision log (public changelog like the 2024 page), "check my voting status" (verify page) and online-voting opt-in link.
- O10.2 Past elections archive `/elections/<year>`.

### O11 · Admin side for the website
- O11.1 Masjid editors & approvals UI (roles, scopes, review queue, comments).
- O11.2 Menus v2, Redirects & short links (import the isgh.org short-link table: /champions → …, /updatecontact → …), 404 report.
- O11.3 SEO & share settings, analytics (privacy-first, no pixels), sitemap, structured data toggles.
- O11.4 Content migration tool: import the 217 isgh.org pages/233 posts mapped to the new routes (from `isgh-org/data`), flag what needs rewriting, build the redirect table automatically.
- O11.5 Website health page: broken links, missing alt text, pages without owner, stale pages (not updated in N months), scheduled items.

### O12 · Quality (runs for every module, finished at the end)
- O12.1 Phone-first design review per route (method in §3), 390 / 430 / 768 / 1280, light + dark, reduced motion.
- O12.2 Accessibility: WCAG 2.2 AA, keyboard, screen reader labels, focus, contrast gate, Arabic text direction.
- O12.3 Performance: image sizes, fonts, LCP < 2.5 s on 4G phone, no third-party trackers, caching per tenant.
- O12.4 Tests: white-box (schemas, renderers, scope isolation), black-box (Playwright per route and phone size, screenshots), live-check on the server; test report per module.
- O12.5 Content style: American English, Houston formats, style guide check, every image with alt text.

## 3. Phase 3 method – "deep analysis, design and quality on each phone"

For every route in the module being built, before code:
1. **Purpose card**: who visits (visitor / member / masjid team / office), what they must do in 10 seconds, what admins control.
2. **Data card**: every element and where it comes from (admin page, live module, activity engine) – nothing hard-coded.
3. **Phone flow**: wireframe at 390 px first (one-hand reach, sticky actions, tap targets 48 px), then 768 and 1280; states: loading, empty ("no events this week"), error, members-only, draft preview.
4. **Content rules**: headings, copy length, image ratios, alt text, Arabic/English pairing, dates in Houston time.
5. **Quality checklist** signed per route: contrast, keyboard, screen reader, performance budget, share card, print view, dark mode, no horizontal scroll, tests listed.
Design artifacts go to `web/design/org-site/<module>/` (wireframes as HTML/PNG) and the research note per module in `web/memory/research/O<n>-*.md`.

## 4. Work order and effort (no rush; each step approved)

| Step | What | Depends on | Est. |
|---|---|---|---|
| 1 | O0 approve this plan; decide §5 | – | – |
| 2 | O1.1–O1.3 content model + block library v2 + live blocks (web renderer, mocks, contracts) | O0 | 10–14 h |
| 3 | O3.1–O3.2 masjid profile + overview route, O2.1 masjid-aware navigation | O1 | 8–10 h |
| 4 | O4.1–O4.3 activity engine (BE + feed views) | O3 | 8–10 h |
| 5 | O3.3–O3.6 masjid sub-routes (prayer, jumuah, events, programs, announcements, leadership, give, gallery, visit, screen) | O3, O4 | 14–18 h |
| 6 | O1.4–O1.6 Page Composer in admin + delegated editing + media library | O1 | 14–18 h |
| 7 | O5, O6 network/zones/find-my-masjid, prayer & khutbah v2 | O3 | 8–10 h |
| 8 | O7, O8, O9 services, programs, giving v2, news/documents/seasonal | O1 | 12–16 h |
| 9 | O10 elections center | elections module | 6–8 h |
| 10 | O11 admin tools + migration of isgh.org content + redirects | O1, O9 | 8–10 h |
| 11 | O12 final quality pass, tests, deploy, live test | all | 8–10 h |

## 5. Decisions needed from the owner (answer before step 2)
1. Masjid sub-routes in the first build: all listed in O3, or activity-first (overview + activity + prayer + give) and the rest after?
2. Editors: main office + each masjid's own team with approval (recommended), or main office only?
3. Visual direction: new light editorial look with per-masjid accent colors (recommended), keep the current dark five-zone style, or see 2–3 mockups first?
4. URL shape: `/masjid/<slug>` (recommended; "masjid" is a tenant setting – another organization may want `/center/`), or `/<slug>` at the root?
5. Should the Friday khutbah schedule be edited in admin, or keep the committee's Google Sheet and import it?
6. Migration: import all 217 isgh.org pages (then prune), or only the ~60 that are current?

## 6. Tracker
Added to `memory/requirements-tracker.md` as R6 (Organization website v2) with one row per module above, status TODO.
