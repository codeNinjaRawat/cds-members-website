# Research note – W4 Member sign-up

Date: 2026-10-13 · Status: built (mock BE), awaiting owner review

## What good looks like (references)
- Mohid: 3-step signup with review screen, spouse in signup, approval toggle, payment link
- Wild Apricot: approval + payment ordering, renewal-period aware pricing
- GOV.UK / USWDS form patterns: one topic per step, error summary at top that links to fields, specific error text
- Stripe Checkout: card + Apple/Google Pay, we never touch card data

## Our flow (admin-controlled)
1. Email + 6-digit code (no password) → detects existing member (no duplicates)
2. About you + home address → zone and Islamic Center; near-border → request nearby center (5-year lock)
3. Member type (Muslim member / Associate) → plans filtered; multi-year with Bylaws-capped discount; family → spouse invite
4. Commitment (Bylaws 2B), pledge (versioned), signature = legal name, separate email/SMS consent
5. Review with edit links, voting-eligibility preview with reasons, who pays (self / relative by blood or marriage), price
6. Confirmation timeline: submitted → paid → Board review → ID check → active

## Edge cases covered
under-18, age on record date, after June 30, outside Greater Houston, associate cannot vote, no commitment, wrong signature,
tampered price (server recomputes), years above limit, invalid email/phone/ZIP, wrong/expired code, resend timer, reload restores progress.
