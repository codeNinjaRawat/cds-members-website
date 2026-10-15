# Web (Public site + Member portal) – Decisions Log

## 2026-10-13 – App created
- **Decision:** Separate `web` folder with its own memory
- **Status:** Active

## 2026-10-13 – Admin controls everything; research-first; full testing
- **Decision:** Follow root decisions: Bylaws = defaults, all rules are admin settings/feature flags; research note before any feature; black-box + white-box testing and test report before delivery
- **Status:** Active

## 2026-10-13 – UI-first modular build order
- **Decision:** Web UI → Admin UI (glass) → BE (SQL) → integration → mobile; small modules, each approved
- **Status:** Active

## 2026-10-13 – W0 theme system
- **Decision:** themes.json → build-theme.mjs (contrast gate) → theme.css; 3 candidate themes; fonts Bricolage Grotesque + Public Sans
- **Status:** Proposed – awaiting owner choice

## 2026-10-13 – Prototype approach while npm is blocked
- **Decision:** Build UI modules as framework-free prototypes (HTML/CSS/JS with mock data in the API shape, theme tokens, automated Playwright tests) under `design/prototype/`; port to Next.js components once the app can be installed.
- **Reason:** npm registry is blocked by network policy in both the cloud sandbox and the device shell, so Next.js cannot be installed or tested here.
- **Status:** Active

## 2026-10-13 – Next.js app started (W1 coded)
- **Decision:** Next.js 15.5 App Router + React 19 + TS + Tailwind 4 + zod. All admin content via `GET /public/site-config` and `GET /public/theme` (zod-validated, fallback to mock, cache tags). Newsletter via `/api/newsletter` → BE.
- **Status:** Active

## 2026-10-13 – Images
- **Decision:** Pexels photos (license allows free commercial use; we credit anyway), chosen for respectful community content; downloaded by `scripts/fetch-images.mjs` into `public/images/` (runs on npm install). Placeholder pattern if missing. Later moved to admin media library.
- **Status:** Active

## 2026-10-13 – Sign-up flow behaviors
- **Decision:** Account first (email OTP), then application. Draft autosave in **sessionStorage** (this tab only – avoids leaving personal data on shared computers; cross-device drafts will be a BE feature). Same zod rules in browser and server; server recomputes price. Signature must match legal name. Relative payer limited to admin list (Bylaws). Existing member → sign in instead of duplicate. Border-change request offered when near a zone border.
- **Status:** Active (mock OTP 123456, mock ZIP-based center lookup, mock payment until BE + Stripe)

## 2026-10-13 – Owner picked the classic design in Bayou dark; layouts switchable by admin
- **Decision:** Home ships with two layouts – **Classic** (member card + countdown, lattice, steps, 3 plan cards) as default and **Five zones** (map hero, bento) as an option; admin switches in CMS › Home page, can hide/reorder sections. Default visitor mode = **dark** (admin setting). Header automatically uses solid style for Classic and glass-over-hero for Five zones.
- **Status:** Active

## 2026-10-13 – Demo mode (no API calls) + design back to "Five zones"
- **Decision:** Owner: "do not call any API for now, keep everything dummy, just see the process". All forms (join, newsletter, feedback, complaints, verify) use `src/lib/demo/demo-service.ts` in the browser – same function shapes as the future BE calls (one import to swap). API route handlers stay in the code for later but are not called.
- **Decision:** Home layout back to **Five zones**, default mode **device** ("go back to the previous one"); Classic + dark stay as admin options.
- **Decision:** Photos load from the Pexels CDN during the demo (`next.config` remotePatterns); `npm run images` self-hosts them for production. 15 photos, all checked by eye.
- **Status:** Active

## 2026-10-13 – Footer links from competitor review
- **Decision:** Footer has 4 columns: Membership (join, renew, plans, **verify a membership**, status), Community (centers, elections, news, events, **volunteer**, donate), About ISGH (about, **Constitution and Bylaws PDF**, **annual reports**, zones), Help and feedback (FAQ, contact, **rate your experience**, **file a complaint**, **report a website problem**, accessibility).
- **Why:** current isghmembership.org has a public verify page (but leaks data → ours is privacy-first: member ID + last name + ZIP, status only); isgh.org shows annual reports, jobs, volunteer, online giving; no competitor offers feedback/complaints with reference numbers.
- **Status:** Active (all forms demo)

## 2026-10-13 – Continue with Google + join page polish
- **Decision:** Account step offers **Continue with Google** (Google's standard button branding) or email code. Google gives a verified email + name → code step skipped, name prefilled; existing members sent to sign in. DEMO: labeled account picker, no Google call. REAL (BE B1): Google Identity Services / OAuth 2.0 OpenID Connect, BE verifies ID token (aud, iss, exp, email_verified), httpOnly session; Google client ID + secret are admin Integrations settings.
- **Polish (owner: "design should be great"):** headings no longer condensed on the join page, gradient top edge + deeper card in dark mode, bigger stepper with current-step halo, email field with inline Send code, trust list, terms line, summary placeholder; header menu collapses below 1140px (was wrapping at 1024px on the owner's laptop).
- **Verified on the owner's PC** (localhost:3000 via the browser pane): real fonts and Pexels photos render; files hot-reload.
- **Status:** Active

## 2026-10-13 – Footer v2 (smart + better looking)
- **Decision:** Footer = Islamic diamond pattern edge → CTA card (title, text, live days-to-June-30 countdown, Join/Renew; hidden on the join page) → brand + tagline + contact list with icons (tap to call/email, address opens map, office hours with live **Open now / Closed now** in Houston time) + social → 4 link columns → full-width newsletter row → "Was this page helpful? Yes/No" (No links to feedback) + Back to top → legal bar → wordmark. External links open in a new tab and say so.
- **Admin control:** new site-config footer fields `cta`, `tagline`, `hours`, `hoursLabel`, `mapUrl` (CMS › Footer, Settings › Organization).
- **Status:** Active (demo – helpful votes go to the demo service)

## 2026-10-13 – Logo and favicon placed (concept A), admin-uploadable
- **Decision:** Concept A "Star & Arch" is the default brand: `/public/brand/` has light + dark logo marks, adaptive favicon.svg (changes with light/dark browser tabs), favicon.ico, Apple/Android/maskable icons, share image, manifest. Header shows the light mark on light backgrounds and the dark mark over the dark hero, in dark mode and in the footer (automatic). All files come from `site-config.branding` so admins can upload replacements (see memory/13 Branding).
- **Status:** Active

## 2026-10-13 – Smart loader on every form
- **Decision:** `SmartLoader` (src/components/ui/SmartLoader.tsx): step-aware, 200 ms delay, ✓ done frame, slow-network message after 6 s, screen-reader status, progressbar. Inline for send code / verify / address lookup / feedback / complaint / verify membership; full overlay with steps + verse for payment submit and gifts. Buttons show a spinner (`data-busy`). Demo delays made realistic so the steps can be reviewed.
- **Status:** Active

## 2026-10-13 – Giving: verses, How we helped, Who still needs help
- **Decision:** new admin content `GET /public/giving`; pages `/give`, `/impact`, `/needs`; home sections `verse`, `impact`, `needs` (default order after "What your membership supports"); join page "Why your membership matters" with Quran 3:92; nav "Give" menu; footer links. Give dialog is demo (no payment): Zakat only for eligible cases, "Finish it" amount, monthly, anonymous by default.
- **Honesty rule:** only sourced facts are shown as real; individual stories/cases are labeled **Sample** until admins publish consented ones; stock photos labeled "Illustrative photo". Research: memory/research/giving-research-2026-10-13.md.
- **Fix:** dialogs (Google picker, Give) were not centered on the real Next site because Tailwind preflight removes `margin:auto` from `<dialog>` – added `margin:auto`.
- **Status:** Active

## 2026-10-13 – Heart line on the home page
- **Decision:** one short hadith under the stats strip: "None of you truly believes until he loves for his brother what he loves for himself." (Sahih al-Bukhari 13 · Sahih Muslim 45), English + small Arabic + source. Admin: CMS › Home page › Heart line (`pages/home.heartLine {text, arabic?, source}`, section key `heart`, can be hidden/moved). Imam review before launch.
- **Status:** Active

## 2026-10-13 – W5 Sign in + Member home (demo)
- **Why:** /sign-in, /portal and /membership/renew were linked but not built (404).
- **Sign in (/sign-in):** Google (demo picker) or 6-digit email code; privacy-safe wording ("If this email has an ISGH account…"); verified email without a membership → "No membership linked" + Join; `?next=` only same-site paths (open-redirect blocked); SmartLoader on send/verify.
- **Member home (/portal):** signed-out → /sign-in?next=/portal. Digital card (QR demo, Apple/Google Wallet demo), status + valid-through + days to June 30, Renew (disabled until renewal opens Nov 1 – admin date), Bylaws Art. I §2 voting checklist (approved, 18+, commitment, residency, own dues by June 30, ID) with one-tap fixes, household, center (+ border change request), payments/receipts, details, quick links. Header shows "My membership" while signed in.
- **Demo accounts:** aisha@example.com (Family, 4/6 checklist), member@example.com / Google "Imran Siddiqui" (Life). Code 123456. Session = sessionStorage (`src/lib/demo/demo-member.ts`).
- **/membership/renew:** CMS info page until the renew flow module is built.
- **Status:** Active (demo)

## 2026-10-13 – Website reads the admin demo store
- **Decision:** in mock mode, loaders read `../.demo-store/{site-config,home,membership-settings,giving,pages,news,themes}.json` (written by admin Publish), zod-validated, theme contrast-gated, falling back to built-in content on any problem (`src/lib/api/demo-store.ts`). Set `ISGH_DEMO_STORE=off` to ignore.
- **Preview:** `PreviewBridge` accepts theme previews only from the admin origin and only inside a frame; `X-Frame-Options: DENY` replaced by `Content-Security-Policy: frame-ancestors 'self' <admin origin>` (no framing at all in production unless ISGH_ADMIN_ORIGIN is set).
- **Branding:** uploaded data: URLs are used without the ?v= suffix.
- **Status:** Active (demo)

## 2026-10-13 – Family tree (owner: "family tree in the dashboard and on the member portal"; chose BOTH layers)
- Research: `research/family-tree.md`. Shared engine `web/src/lib/family/family.ts` (generations, kinship words, badges, insights, layout, add/edit/remove) + renderer `web/src/components/family/FamilyTree.tsx`; admin gets copies via `npm run contracts:sync` (script now also copies the renderer).
- **Member portal** `/portal/family` + "Family tree" tile on member home: Membership family (parents → grandchildren) and Whole family + history (older generations, "Late"); highlights (members/voters, child turning 18 before 06/30/2027, adults who can join, not renewed); add/edit/remove relatives, invite to join, birthday reminder, renewal reminder; tree and list views, zoom/fit; saved in the browser (demo). Hadith on kinship: Sahih al-Bukhari 5986.
- **Admin:** Member 360° › Family tree tab + Members › Family trees (`/families`): search, "Families to reach" outreach list, invite (audited). **Staff see the membership layer only – family history is private to the member.**
- Tests: web 104 pass (9 new), admin 38/38 (5 new), family white-box 42/42, admin family builder over all 320 members clean; `tsc` clean in both apps.

## 2026-10-13 – Speed pass 2 (owner: "actions getting very slow, sometimes stuck – menus, any action – admin + website")
- **Measured on the PC:** both apps still ran the old `next dev` (webpack): every click went to the dev server – admin 0.4–2.1 s, website 0.6–2.5 s per page, ~9 MB of dev JavaScript. Admin also painted 15 frosted-blur panels on every scroll/hover; website photos went through the dev server's image optimizer.
- **Fixes:** (1) one-click launchers in `membership/`: `start-fast.cmd` (build once + run like the real servers; pages open in milliseconds) and `start-dev.cmd` (Turbopack dev); both stop old servers on 3000/3001 first and set the admin↔website preview origins. (2) Instant feedback on every click to another page: thin progress bar (`NavProgress`, capture-phase click listener) + loading screens (`app/loading.tsx` in both apps). (3) Admin glass: real frosted blur only on sidebar, top bar, menus and dialogs; content panels use deep tinted glass (blurred elements 15 → 2, same look). (4) Website photos load straight from the Pexels CDN at the right width (custom next/image loader – no server work). (5) `noStore()` guarded so `next build` never fails on build-time page lists.
- Verified on the PC: progress bar shows within 60 ms of a click; blurred elements 2. Tests: admin 41/41 (3 new speed tests), web 104, `tsc` clean.

## 2026-10-13 – Preview addresses: member-web.nextgrow.pro + member-admin.nextgrow.pro
- `web/.env.production` and `admin/.env.production` (no secrets, allowed in git) point the apps at each other: admin "Open website" + live preview → member-web; website allows framing only from member-admin; publish origin check trusts the proxy's forwarded host / NEXT_PUBLIC_ADMIN_URL.
- Admin preview protection (`admin/src/middleware.ts`): HTTP Basic sign-in on the server (ISGH_ADMIN_PREVIEW_USER / ISGH_ADMIN_PREVIEW_PASSWORD, set on the server only); closed if no password; open only in dev or with ISGH_ADMIN_OPEN=true (start-fast.cmd). Host headers are not trusted. White-box 8/8.
- Website preview sends `X-Robots-Tag: noindex` (ISGH_NOINDEX=true) – demo content stays out of search.
- `membership/DEPLOY.md`: build, pm2 start, nginx example, checks.
