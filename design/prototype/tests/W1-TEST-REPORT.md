# W1 test report – public layout

Date: 2026-10-13 · Browser: Chromium (Playwright) · Result: **20/20 passed**

## Black-box (from the requirements)
- Skip link first, visible on focus, jumps to main content
- Membership / Islamic Centers menus: open with Enter, arrows move through links, Escape closes and returns focus; only one open; outside click closes
- Mobile menu (≤1020px): modal, focus trapped, Escape closes, focus restored, page scroll locked, accordion sub-menus
- Header floats as glass over the hero and turns solid after scrolling; inner pages use solid header with current page marked
- Announcement: dismiss is remembered; hidden when admin flag off; hidden outside its start/end dates
- Newsletter: invalid email rejected with a clear message, consent required, success message; hidden when admin flag off
- Theme: follows device setting, toggle cycles device → light → dark and is remembered; 3 themes × light/dark render without errors

## White-box (DOM / ARIA state)
- aria-expanded / hidden kept in sync for every menu; aria-current on current page; aria-invalid on bad email
- Every link/button has an accessible name; header touch targets ≥ 40px
- No horizontal scroll at 1280, 768, 390, 320px; no JavaScript errors

## Raw output
```
✔ No JS errors on home and inner pages 
✔ No horizontal scroll at 1280px 
✔ No horizontal scroll at 768px 
✔ No horizontal scroll at 390px 
✔ No horizontal scroll at 320px 
✔ Skip link is first focusable and becomes visible, moves focus to main 
✔ Dropdown: Enter opens, ArrowDown moves into links, Escape closes and returns focus 
✔ Dropdown: only one open at a time; outside click closes 
✔ Mobile menu: opens as modal, traps focus, Escape closes and restores focus, body scroll locked 
✔ Mobile menu accordion expands sub-links 
✔ Header: glass over hero, solid after scrolling past hero 
✔ Inner page marks current nav item (aria-current) 
✔ Announcement: dismiss hides it and remembers across reloads 
✔ Announcement: hidden when admin flag is off, and when outside its date window 
✔ Newsletter: rejects bad email, requires consent, then confirms 
✔ Newsletter hidden when admin flag is off 
✔ Theme toggle cycles system → light → dark and persists 
✔ All three themes render header and footer in light and dark (no errors) 
✔ Every image-free control has an accessible name 
✔ Touch targets in header are at least 40px 

20/20 passed
```

## Fixed during testing
- Brand link was 30px tall → raised to 44px (touch target)
- Dropdown was see-through over the dark hero → solid card for readability
- Mobile menu buttons could be pushed below the screen → sticky action bar
- Solid header too transparent over dark footer → 92% opacity

## Not covered yet
- Screen-reader manual pass (NVDA/VoiceOver) – planned before W1 sign-off on the owner's PC
- Real fonts (Google Fonts are blocked in the test sandbox; fallback fonts used in screenshots)
