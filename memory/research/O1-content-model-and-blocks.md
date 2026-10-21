# Research note – O1 · Content model v2, block library, live blocks (web)

Date: 2026-10-21 · Module R6.1 (step 2 of the O0 plan) · Status: BUILT in `web` (O1.1–O1.3); O1.4–O1.6 (admin Page Composer UI, delegated editing, media library) follow as separate sub-tasks.

## 1. Problem
Admins must be able to send every page of the site – for the organization and for each masjid – without code, and most of what a page shows (prayer times, events, campaigns, leaders, masajid) must come from the data admins already keep, never typed twice. The current CMS has 8 static block types and one narrow article layout; pages have no scope, no schedule, no SEO fields.

## 2. What the current model does well (kept)
- `pages` is one document `Record<slug, Page>` shared by web, admin (SchemaForm from the same Zod schema via `sync-contracts.mjs`) and BE (site document store). Extending the Zod schema is enough for all three.
- Unknown block types are skipped by the renderer – old content never breaks a page.
- Draft pages are hidden from search engines; demo store → API switch is already in `loadPublic`.

## 3. Decisions (O1)
| Topic | Decision |
|---|---|
| Compatibility | Every v1 page is a valid v2 page: new fields are optional with defaults (`scope: org`, `template: article`, `status: published`). |
| Scope | `scope: { kind: 'org' } \| { kind: 'masjid', center: <center id> }`. Masjid pages are keyed `masjid/<center-slug>/<page>` (routing in O3); live blocks on a masjid page default to that masjid. |
| Templates | `article` (760 px column, current look), `landing` (wide sections, full-bleed hero), `hub` (wide, grid-friendly; used by masjid overview and directories). A block can override its width with `width: 'wide' \| 'full'`. |
| Publishing | `status: draft \| review \| scheduled \| published \| archived` + `publishAt` / `unpublishAt` (Houston time). The website shows a page only when `status = published` (or `scheduled` and `publishAt` ≤ now) and `unpublishAt` is empty or in the future; admins with a preview link see drafts (O1.4). |
| SEO & share | `seo: { title, description, image, noIndex }`; falls back to title / intro / page image. |
| Visibility | `visibility: public \| members` – members-only pages ask for sign-in (uses the portal session). |
| Ownership | `owner` (team or role label) and `reviewedAt` for the site-health report (O11.5). |
| Static blocks | heading, paragraph (plain text; `**bold**`, `[text](href)` only), list, callout, faq, facts, cta, contact (v1) + **image, gallery, columns, cards, steps, people, buttons, documents, table, embed, verse, divider**. |
| Live blocks | **prayer-times** (today \| week \| month; masjid), **next-jumuah**, **events** (masjid, category, limit), **campaigns** (masjid, limit), **leadership** (masjid \| zone \| board), **masjid-cards** (zone \| all), **deadline** (membership voting deadline countdown), **news** (limit), **plans** (membership levels), **form** (feedback \| complaint \| verify). `activity` (O4) and `documents-library` (O9) come with their modules. |
| Embeds | Only allow-listed hosts render (YouTube, Google Maps, Google Forms/Docs, Vimeo); anything else shows a link instead – no arbitrary iframes from the CMS. |
| Verse/hadith block | Requires a `source`; Arabic line optional with `dir="rtl"`. |

## 4. Phone-first design (390 px first, then 768, 1280)
- One column everywhere at 390 px; grids open to 2 columns at ≥ 640 px and 3 at ≥ 980 px (cards, people, gallery); facts 2 → 4.
- Buttons row: full-width stacked buttons on phones, 48 px tall, inline on larger screens.
- Tables: horizontal scroll inside the block with the first column sticky; never shrink text below 14 px.
- Prayer-times (today): a 5-row list with the next prayer highlighted (no wide table on phones); week/month views render as a scrollable table with sticky date column.
- Events/campaigns cards: date pill + title + place; campaign progress bar with percentage and days left; tap target is the whole card.
- Gallery: 2 columns on phones, 3–4 wider; images lazy-loaded; alt text required; credit on focus.
- Embed: 16:9 box, loads on demand, "Open in new tab" link under it.
- Verse band: full-bleed muted background, Arabic (rtl) above English, source line small.
- States: live blocks render nothing (not an empty box) when the module is off or has no items, except where the block has an `emptyText` set by the admin.
- Dark mode and reduced motion inherited from tokens; no new colors – only theme variables.

## 5. Contracts
- Web: `src/lib/content/pages.ts` (schema + starter pages), `src/lib/content/page-rules.ts` (`isLive`, `pageScope`, `effectiveSeo`), renderer `src/components/cms/PageView.tsx` + `blocks/*`.
- Admin: copied by `admin/scripts/sync-contracts.mjs` – SchemaForm renders the new union members automatically; the Page Composer (O1.4) will replace SchemaForm for blocks.
- BE: no change to storage (JSON document `pages`); `api-contract-web.md` gains the v2 fields.
- Starter content: a draft page `style-guide` showing every block (for QA and for admins to copy from); existing pages unchanged.

## 6. Tests
- Type check (`tsc --noEmit`) in web and admin.
- Playwright `tests/e2e/cms-blocks.spec.ts`: the style-guide page renders every block at 390 px and 1280 px without horizontal scroll; a scheduled page in the future is a 404; an archived page is a 404; embed from a non-allow-listed host renders as a link.
- White-box: `page-rules` unit checks (schedule window, scope defaults) in the same spec via the `/api` not needed – pure functions tested through page behavior.
