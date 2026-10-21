# Research note – O6 · Prayer & khutbah network-wide – R6.6

Date: 2026-10-21 · Status: BUILT.

## Problem
isgh.org keeps the Friday khutbah schedule in a Google Sheet rendered through a DataTables plugin, and the monthly prayer timetable as one hand-edited page per month. Committee members know their sheet; the website must take it from them without retyping, and members need the times on their phone and calendar.

## Decisions
- The khutbah schedule lives inside the `prayer-times` document (`khutbah` section) – no new document key, no BE change; the Khutbah Committee's zone-scoped admins see only their masajid (existing scope rule in Prayer times).
- Paste-from-sheet import (TSV/CSV, any column order, MM/DD/YYYY or ISO dates, center names matched case-insensitively; unknown centers are kept and flagged); merge or replace per Friday; "copy last Friday" for recurring slots.
- Website: `/khutbah` (next Friday, grouped by zone, links to each masjid's Jumuah page), `khutbah` live block (per masjid: coming Fridays as cards with the next Friday highlighted), masjid Jumuah page = next-jumuah + coming Fridays + languages + parking + buttons.
- Calendar: `/prayer-times/ical?masjid=<id>` – 30 days of iqamah + Jumuah as a subscribable .ics (refresh daily). Print: button + print stylesheet hide chrome and keep the table.

## Phone-first
Cards with a date pill (day + month), khateeb bold, topic, meta line; zone tables scroll sideways with a sticky masjid column; print output is a compact one-page table.

## Tests
tests/unit/khutbah.test.ts (nextFriday, defaults for old documents, filters/sort, sheet parsing with warnings).
