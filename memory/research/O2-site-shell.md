# Research note – O2 · Site shell v2 – R6.2

Date: 2026-10-21 · Status: BUILT (O2.1 "My masjid", O2.2 search, O2.4 share cards, O2.5 sitemap/robots/structured data). Footer v2 and mega-menu groups stay with the existing CMS-driven header/footer (W1) – the nav content is edited in Website › Menus; "All masajid" and "Activity" entries added to the starter menu.

## Decisions
- **Search** (`/search`): server-side over the public documents (pages' static text, masajid, zones, news, public events, campaigns, public records). No index to maintain – documents are small and cached per request; scoring = title 10 / word 1 / phrase 6 / all words 3; grouped results; a search icon in the header. Members-only, draft, scheduled, archived and noIndex pages never appear.
- **My masjid**: the last masjid opened is remembered in this browser (localStorage, no cookie) and shown as a chip in the header (≥ 1100 px) and in the mobile menu; the portal can set the member's own masjid with the same key.
- **Share cards**: `opengraph-image` for the organization and per masjid (name, zone/city, Jumuah times) – WhatsApp/Facebook previews; pages with a photo use it instead.
- **Sitemap / robots**: `/sitemap.xml` from live public pages, masjid routes, zones, events, news, campaigns; `/robots.txt` blocks portal, sign-in, pay, api, search, previews and screens; ISGH_NOINDEX=true (preview servers) blocks everything.
- **Structured data**: `Mosque` JSON-LD on masjid pages (name, address, phone, email, website, image).

## Phone-first
Search: one full-width field with a 52 px height and a primary button beneath it; results as cards with title, snippet and path. Header: search icon 40 px; "My masjid" chip only on wide screens (the mobile menu lists it).

## Tests
`tests/unit/search.test.ts` (page text, exclusions, ranking, grouping, snippets). Sitemap/robots/OG verified in the browser check (demo mode).
