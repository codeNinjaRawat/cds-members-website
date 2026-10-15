/**
 * Fixed UI text (American English – see memory/09-content-style-guide.md).
 * Admin-editable content (menus, announcement, footer, pages) comes from the BE, not from here.
 * Only interface wording that is part of the product lives in this file (ready for more languages later).
 */
export const t = {
  skipToContent: 'Skip to main content',
  mainNav: 'Main',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  menu: 'Menu',
  announcement: 'Announcement',
  dismissAnnouncement: 'Dismiss announcement',
  opensNewTab: '(opens in a new tab)',
  theme: {
    system: 'Theme: match device',
    light: 'Theme: light',
    dark: 'Theme: dark',
    hint: 'click to change',
  },
  newsletter: {
    emailLabel: 'Email address',
    placeholder: 'you@example.com',
    submit: 'Subscribe',
    submitting: 'Subscribing…',
    invalidEmail: 'Enter a valid email address, like name@example.com.',
    needConsent: 'Check the box to agree to receive emails.',
    success: (email: string) => `Almost done. We sent a confirmation link to ${email}.`,
    failed: 'We could not subscribe you right now. Try again in a few minutes.',
  },
  footer: { rights: (year: number, org: string) => `© ${year} ${org}.` },
} as const;
