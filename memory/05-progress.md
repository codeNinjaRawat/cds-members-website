# Web (Public site + Member portal) – Progress

## Done
- [x] Folder and memory created

## Next
- [x] W0 Design foundations – approved (concept "Five zones")
- [x] W1 Public layout – prototype approved by owner ("start the coding")
- [x] Next.js app scaffolded; W1 coded as real components (src/), admin/BE-driven via site-config + theme contracts; 15/15 e2e + 7/7 unit checks (SSR+hydration harness)
- [ ] Owner to run on PC: npm install, typecheck, build, test:e2e
- [x] W2 Home page coded (zones hero, stats, bento, "what membership supports" photo mosaic, journey, Houston band, closing) – CMS-driven
- [x] Content pages coded from CMS blocks: about, elections, faq, contact, centers, zones, events, accessibility, privacy (draft), terms (draft); plans page; news list
- [x] Real images: 8 Pexels photos chosen + `npm run images` downloader (also runs on npm install), credits file, placeholder fallback
- [x] W4 Member sign-up flow coded (email OTP → about/address→center → plan → pledge → review & pay → confirmation)
- [x] Tests: 49/49 e2e + 23 unit + 7 white-box (harness)
- [ ] Next: sign-in + member home (portal), renew flow, news article pages, centers directory

- [ ] Research notes for this app's features (in `memory/research/`)
- [ ] Set up Next.js + Tailwind + shadcn/ui
- [ ] Set up Storybook, Vitest, Playwright
- [ ] Build home page and plans page

- [x] 2026-10-13: Demo mode (no API), home back to Five zones, Pexels photos on home + join + about/elections/centers/volunteer
- [x] Become a member v2: hero band with photos, live summary panel (progress, plan, total, voting checklist), email typo fix, address suggestions that auto-find the center, validate-on-leave, family savings tip, time estimates
- [x] New pages: Rate your experience, File a complaint, Verify a membership, Volunteer, Constitution and Bylaws (PDF in public/documents), Annual reports
- [x] Tests 64/64 (+1 layout skip)
- [x] Family tree (membership family + family history; portal and admin)
