# Web ⇄ BE API contract (what the website reads/writes)

> The website never hard-codes admin-controlled content. It reads it from the BE, validates it with zod,
> and falls back to mock data if the BE is down or sends invalid data. Source of truth in code:
> `src/lib/site-config/schema.ts` (site config) and `src/lib/theme/theme-css.ts` (theme shape).
> BE side of this contract: `../../BE/memory/api-contract-web.md`.

| # | Method + path | Used by | Admin source | Cache tag | Status |
|---|---|---|---|---|---|
| 1 | `GET /public/site-config` | root layout (header, menus, announcement, footer, flags, active theme) | CMS › Menus, Announcements, Footer · Settings › Organization, Feature flags | `site-config` | Mocked (W1) |
| 2 | `GET /public/theme` | root layout (CSS variables) | Website theme editor (A8) | `theme` | Mocked (W1) |
| 3 | `POST /public/newsletter/subscriptions` | `/api/newsletter` route | Marketing › Subscribers | – | Mocked (W1) |

## 1. site-config shape (summary – see schema.ts for exact rules)
`version`, `org{name, shortName, productName, address[], phone{display, tel}, email, taxNote, founded}`,
`flags{key:boolean}`, `announcement{id, tone, text, link?, dismissible, startsAt?, endsAt?} | null`,
`nav[{label, href? | children[{label, href, description?}]}]` (max 8), `actions{signIn, join}`,
`footer{columns[{title, links[]}], social[], legal[], newsletter?{title, text, consent}}`,
`theme{active, allowUserModeToggle}`

## 2. theme shape
Same as `design/tokens/themes.json`: `{ default, shared{font/radius vars}, themes{ key: { label, story, light{…}, dark{…} } } }`.
Required color keys per mode: background, foreground, card, card-foreground, muted, muted-foreground, border, input, ring,
primary(+foreground), secondary(+foreground), accent(+foreground), highlight(+foreground), success, warning,
destructive(+foreground), pattern, hero, hero-foreground, hero-muted, hero-accent. Web rejects themes failing WCAG AA.

## 3. newsletter
Request `{ email, consent: true, consentText, source }` → `202 { status: "pending_confirmation" }`.
BE stores consent text + timestamp + IP, sends double opt-in email (email gateway).

## Caching / freshness
Responses cached `ISGH_CONFIG_REVALIDATE_SECONDS` (60 s). Planned: BE calls a web revalidate endpoint with the tag
when an admin publishes, so changes show instantly.


## Added 2026-10-13 (W2 home, content pages, W4 sign-up)
| # | Method + path | Used by | Admin source | Contract in code | Status |
|---|---|---|---|---|---|
| 4 | `GET /public/pages/home` | Home page (hero, zones + centers, stats, bento texts, "what membership supports" tiles + images, journey, Houston band, closing) | CMS › Home page | `src/lib/content/home.ts` | Mocked |
| 5 | `GET /public/membership/settings` | Home plan switcher + countdown, Plans page, Join flow | Settings › Membership & dues, Voting, Join form | `src/lib/content/membership.ts` | Mocked |
| 6 | `GET /public/pages/{slug}` | About, Elections, FAQ, Contact, Centers, Zones, Events, Accessibility, Privacy (draft), Terms (draft) | CMS › Pages (blocks) | `src/lib/content/pages.ts` | Mocked |
| 7 | `GET /public/news?limit=n` | Home news tile, News list | CMS › News | `pages.ts` (NewsItem) | Mocked |
| 8 | `POST /public/auth/otp/start` · `POST /public/auth/otp/verify` | Join step 1 (via /api/auth/otp/*) | Settings › Security (OTP length, resend) | route handlers | Mock code 123456 |
| 9 | `POST /public/residency/lookup` | Join step 2 address → zone/center, border alternatives (via /api/centers/lookup) | Centers & zones module | `src/lib/join/residency.ts` | Mock by ZIP |
| 10 | `POST /public/membership/applications` → `{applicationId, checkoutUrl}` | Join submit (via /api/membership/applications; server re-validates + recomputes price) | Applications queue | `src/lib/join/schema.ts` | Mock "paid" |


## Added 2026-10-13 – layout & design switches (admin)
- `site-config.theme.defaultMode`: light | dark | system – applied before paint when the visitor has not chosen
- `pages/home.layout`: "classic" | "zones"; `pages/home.sections`: ordered list of section keys; `pages/home.classicHero`: title + lead


## Planned (demo now, 2026-10-13)
| Endpoint | Used by | Admin |
|---|---|---|
| `POST /public/feedback` {rating, topic, comment, email?} → {reference} | /feedback | Feedback inbox + ratings dashboard |
| `POST /public/complaints` {category, zone, when, what, outcome, anonymous, contact} → {reference, respondWithinDays} | /complaints | Complaints queue (SLA, assignment, confidential, audit) |
| `POST /public/membership/verify` {memberId, lastName, zip} → {found, status, validThrough, votingEligible} | /verify | Verification settings (on/off, what it shows), rate limits |

## Added 2026-10-13 – footer fields
`site-config.footer.cta {title, text, primary, secondary?, deadline?}`, `tagline`, `hours [{days[0-6], open "HH:MM", close}]` (Central Time), `hoursLabel`, `mapUrl`.

## Added 2026-10-13 – branding
`site-config.branding { logoLight, logoDark, logoAlt, favicon, faviconIco, appleTouchIcon, manifest, ogImage, themeColor, version }` – file URLs from the admin media library; website adds `?v=version` to bust caches. Defaults: `/public/brand/*` (concept A).

## Added 2026-10-13 – giving (verses, impact, needs)
`GET /public/giving` → `src/lib/content/giving.ts` (GivingSchema, mock `mockGiving`). Used by: home sections `verse`/`impact`/`needs`, `/give`, `/impact`, `/needs`, join page "Why your membership matters".
- `verses[] {id, ref "2:261", surah, arabic, english, translation, short?}` – Arabic + English must be verbatim from the named translation (current: Saheeh International via Quran.com API v4, resource 20).
- `hadith[] {id, text, source, grade?}`
- `reasons[] {title, text}`, `totals[] {value, label}` (hero stats on /give and /impact)
- `impact[] {id, kind program|event|story, title, when?, zone?, summary, body[], metrics[], image, stockPhoto, source?{label,url}, consent public-record|written|anonymized, sample, featured}`
- `needs[] {id, title, category zakat|family|health|education|relief|masjid|funeral, zone?, summary, story[], image, stockPhoto, status urgent|open|ongoing|met, goalCents?, raisedCents?, donors?, zakatEligible, privacy anonymized|public, verifiedBy?, source?, sample, updatedAt}`
- `giveUrl`, `zakatUrl`, `flags {showSamples, showProgress, rotateVerses}`
Planned: `POST /public/giving/donations {needId, amountCents, fund zakat|sadaqah, monthly, anonymous}` → Stripe (demo: `demo-service.give`).
- `pages/home.heartLine {text ≤160, arabic?, source}` + section key `heart` (added 2026-10-13)

## Planned – member (W5, 2026-10-13)
`GET /member/me` (session) → `{ profile{firstName,lastName,email,phone,address[]}, memberId, plan, memberSince, status, validThrough|null, zone, center, household[{name,relation,status}], eligibility{year, checks[{key,label,state ok|todo|wait|no,note}]}, payments[{date,label,amountCents,receipt}], idVerified }` – demo shape in `src/lib/demo/demo-member.ts`. Settings needed: renewal opens date, record date.

## Added 2026-10-21 (O1 – pages v2)
- `pages/{slug}` document fields added (all optional, defaults keep v1 pages valid): `scope {kind:'org'} | {kind:'masjid', center}`, `template article|landing|hub`,
  `seo {title, description, image, noIndex}`, `visibility public|members`, `status draft|review|scheduled|published|archived`, `publishAt`, `unpublishAt` (YYYY-MM-DD or YYYY-MM-DDTHH:MM, Houston),
  `owner`, `reviewedAt`. Masjid pages are keyed `masjid/<center-slug>/<page>`.
- Block types: v1 eight + image, gallery, columns, cards, steps, people, buttons, documents, table, embed, verse, divider (static) and prayer-times, next-jumuah, events,
  campaigns, leadership, masjid-cards, deadline, news, plans, form (live – the website resolves them from the other public documents; the BE stores them as-is).
- The website only serves pages where `isLive()` (page-rules.ts) is true; `GET /site/documents/pages` keeps returning the whole document (admin preview needs drafts).
