# Research note – W1 Public layout (announcement, header, menus, mobile menu, footer)

Date: 2026-10-13 · Status: **built as prototype, awaiting approval**

## Patterns chosen (modern, accessible)
- **Floating glass pill header** (2025–26 trend) – glass over the dark hero, solid elsewhere; solid fallback where backdrop-filter is unsupported
- **Disclosure navigation** (WAI-ARIA "disclosure menu" pattern, not role=menu): buttons with aria-expanded, Escape/arrow keys, outside click
- **Two-column dropdown with descriptions** (helps first-time members understand each page)
- **Full-screen mobile sheet** with accordion, focus trap, scroll lock, sticky Join/Sign in actions
- **Announcement bar** from CMS: tone, link, dismissible (remembered per announcement id), start/end dates, admin flag
- **Theme toggle**: follows device by default; light/dark choice remembered
- **Footer**: org contact (tel/mailto links), social pills (text, no brand logos), newsletter with separate consent (CAN-SPAM) and double opt-in message, link columns from CMS, 501(c)(3) note, legal links, oversized wordmark
- **Skip link**, visible focus rings, 40–48px touch targets

## Admin / CMS control
Everything in `prototype/content/site.js` will come from BE: menus, dropdown descriptions, actions, announcement,
footer columns, social links, newsletter texts, contact info; flags `site.announcement`, `cms.newsletter`, `site.themeToggle`, `i18n.languages`.

## Future React components
`<AnnouncementBar> <SiteHeader variant> <NavDropdown> <MobileMenu> <ThemeToggle> <SiteFooter> <NewsletterForm>`
