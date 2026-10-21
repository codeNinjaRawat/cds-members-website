# Research note – O4 · Activity engine – R6.4

Date: 2026-10-21 · Status: BUILT (web). Admin controls (hide an item, retention) and email/WhatsApp digests follow with O11/communication.

## 1. Problem
"What is happening at my masjid?" is answered today by a WhatsApp group and flyer images. The site must answer it automatically, for each masjid and for the network, without anyone writing a second time what they already entered in the admin app.

## 2. Decision: derive, don't store
Activity is **computed** from the public parts of the documents admins already keep: events (published, cancelled), news (announcements), campaigns (start, last day, ended), officials (took office, seat vacant), iqamah rules (the date times change), special prayers (Eid, taraweeh), public records (minutes, reports), masjid pages (updated). Elections join through the public elections document (O10). Nothing new is stored, there is no outbox to keep in sync, and every item disappears when its source is unpublished. A stored, BE-side event log can be added later for things that leave no trace in documents (e.g. "times changed yesterday").

Rules: public data only (public events, public records, website-listed officials); items carry a center id (`''` = organization-wide) and show on that masjid plus every masjid for org-wide items; window = 60 days back, 45 days ahead (feed) – "this week" = ±7 days; upcoming first (soonest), then past (newest); stable ids so feed readers do not repeat items.

## 3. Where it shows
- `activity` live block: `view: week` ("Coming up" / "Recently", used on every masjid overview) or `view: feed` (filter chips by kind) – admins can place it on any page.
- `/masjid/<id>/activity` (built-in route, `?kind=` filter) and `/activity` for the network.
- RSS: `/masjid/<id>/feed` and `/activity/feed` (for WhatsApp/Zapier automations and feed readers).

## 4. Phone-first
One column of cards with a colored left edge per kind, kind label, title, one-line summary, relative time ("Today · 7:00 PM", "Tomorrow", "Yesterday", "Fri, Oct 24"); filter chips scroll sideways; two columns from 760 px on hub pages.

## 5. Tests
`tests/unit/activity.test.ts`: every source yields items, ids unique, ordering, no members-only leak (draft/members events, members records), masjid + kind filters, window and this-week split, iqamah change items, RSS escaping.
