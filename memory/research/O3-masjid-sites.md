# Research note – O3 · Masjid micro-sites (`/masjid/<slug>/…`) – R6.3

Date: 2026-10-21 · Status: BUILT (O3.1–O3.7; `…/activity` arrives with O4, programs directory with O7)

## 1. Problem
On isgh.org a masjid is a card on one directory page; its real life (prayer times, jumuah, events, campaigns, leaders, announcements) is scattered over isgh.org, Facebook, WhatsApp and a Google Sheet. Every masjid needs its own door on the organization site, filled from data the office and the masjid team already keep, with room for pages the masjid team composes itself.

## 2. Decisions
| Topic | Decision |
|---|---|
| Address | `/masjid/<slug>` – slug = the center's id in Admin › Zones and centers (ISGH ids are already the slugified names: `masjid-al-salam`, `bear-creek-islamic-center`…); the slugified name is accepted too and redirects to the id. The word "masjid" is the path for every tenant for now (a tenant setting can rename it later – one constant in `masjid-site.ts`). |
| Profile | `CenterSchema.profile` (all optional, defaults): photo, gallery (≤ 24), story (≤ 1,200 chars), accent (one of six theme-safe colors), established, capacity, facilities, khutbah languages, hours, email, social links, parking note, imam/staff lines. Admin › Zones and centers edits it (schema form). |
| Routes | overview · prayer-times · jumuah · events · programs · announcements · leadership · give · gallery · visit · screen · any admin page `masjid/<slug>/<page>`. Built-in routes are **virtual pages**: a Page object composed from live blocks + the profile, rendered by the same PageView as every CMS page. An admin page with the same address **replaces** the built-in one (so a masjid team can take over any route), and extra admin pages appear in the masjid menu. |
| Shell | A masjid band above every masjid route: photo strip, name, zone, address, phone; a chip menu of routes (horizontal scroll on phones, sticky); the masjid's accent color as `--masjid-accent` used for chips, progress bars and the band. |
| Inactive masjid | friendly page "no longer part of the network" (404 status). |
| Screen | `/masjid/<slug>/screen` – full-screen signage: today's times with the next prayer highlighted, jumuah, next three events, latest announcements, refreshes itself every 5 minutes; no header/footer; dark; readable from 5 m. |
| Share | Open Graph title/description/image per route from the profile photo. |

## 3. Phone-first design
- Band: photo 16:9 on phones (full width), name over a dark gradient, zone chip, one-line address with a "Directions" link; chips menu 48 px tall, scrolls sideways, current chip filled with the accent.
- Overview order (one column): today's prayer strip → next jumuah → this week (events) → announcements → campaigns → leaders → visit. Every section is a live block, so empty sections disappear.
- Prayer times: today list first, month table below (sticky date column), print link; jumuah: times + khateeb table when the admin fills it (O6) else times only.
- Visit: address, phone, hours, facilities as pills, parking note, map embed (Google Maps, allow-listed), "Directions" link.
- Gallery: 2 columns; leadership: person cards; give: campaigns + buttons to /give with the masjid preselected.
- Dark mode and reduced motion inherited.

## 4. Data
- Center + profile: Admin › Zones and centers (`org-structure`). Prayer: Admin › Prayer times. Events/campaigns/officials: their modules (center matched by id or name). Announcements: Website › News items with `masjid` set to the center id (new optional field) or org-wide items marked `showOnMasjids`.
- Custom pages: Website › Pages with address `masjid/<slug>/<page>` (scope set automatically by the composer).

## 5. Tests
- Unit: slug resolution (id, slugified name, inactive, unknown), route list, virtual page builders produce valid Pages (schema parse).
- e2e: overview renders band + chips + live sections; sub-routes answer; custom admin page replaces a built-in route; inactive masjid → 404 page; screen route has no site header; phone width without horizontal scroll.
