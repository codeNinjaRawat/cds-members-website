# Web (Public site + Member portal) – Purpose

For **visitors** and **members**.

## Features
- Public pages: home, about, membership plans, contact
- Sign-up and login
- Member portal: profile, digital membership card, renewal, payment history
- Fully responsive, light/dark mode, attractive animations on public pages

## Talks to
- `BE` API for all data, auth and payments

## Website & CMS (added 2026-10-13)
- Public site is **fully admin-managed** (CMS): pages, blog/news, events, Islamic Centers directory, FAQ, announcements, reports – see `../../memory/15-website-cms-scope.md`
- Membership plans/prices shown on the site come **live from admin settings**
- All behavior respects **feature flags** (e.g. hide Check-O-Matic if off)

## Build order (2026-10-13)
Phase 1 of the project: Web UI/UX modules W0–W12 with mock data, each approved before the next (`../../memory/17-build-order-and-modules.md`).
Website colors/fonts/logo come from the admin **Website theme editor** (A8) – never hard-coded.

## Integrations touchpoints (2026-10-13)
Stripe Checkout/Payment Element on payment screens; SMS/email consent checkboxes (separate) on join/profile; OTP by email or SMS.
