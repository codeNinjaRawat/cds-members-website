/**
 * MOCK CMS + SETTINGS DATA (prototype).
 * In the real app this comes from BE: CMS (menus, footer, announcement) + admin settings + feature flags.
 * Shape here = the planned API response, so the UI is built against the real contract.
 */
window.SITE = {
  org: {
    name: 'Islamic Society of Greater Houston',
    shortName: 'ISGH',
    productName: 'ISGH Members',
    address: ['3110 Eastside St', 'Houston, TX 77098'],
    phone: { display: '(713) 524-6615 ext. 105', tel: '+17135246615,105' },
    email: 'membership@isgh.org',
    taxNote: 'ISGH is a 501(c)(3) nonprofit organization in Texas.',
    founded: 1969,
  },

  flags: {
    'cms.newsletter': true,
    'site.announcement': true,
    'i18n.languages': false,
    'site.themeToggle': true,
  },

  announcement: {
    id: 'renew-2027',               // dismissal is remembered per id
    tone: 'info',                   // info | warning | success
    text: 'Renew by June 30, 2027 to keep your vote in the 2027 ISGH elections.',
    link: { label: 'Renew now', href: '#renew' },
    dismissible: true,
    startsAt: '2026-10-01T00:00:00-05:00',
    endsAt: '2027-06-30T23:59:59-05:00',
  },

  nav: [
    {
      label: 'Membership',
      children: [
        { label: 'Become a member', href: '#join', description: 'Join in about five minutes.' },
        { label: 'Renew', href: '#renew', description: 'Pay your 2027 dues and keep your vote.' },
        { label: 'Plans and dues', href: '#plans', description: 'Single, family and life membership.' },
        { label: 'Check my status', href: '#status', description: 'See your eligibility checklist.' },
      ],
    },
    {
      label: 'Islamic Centers',
      children: [
        { label: 'Find my center', href: '#find', description: 'Your address decides your zone and center.' },
        { label: 'All 22 centers', href: '#centers', description: 'Addresses, contacts and programs.' },
        { label: 'The five zones', href: '#zones', description: 'How Greater Houston is organized.' },
      ],
    },
    { label: 'Elections', href: '#elections' },
    { label: 'News', href: '#news' },
    { label: 'About', href: '#about' },
  ],

  actions: {
    signIn: { label: 'Sign in', href: '#signin' },
    join: { label: 'Join ISGH', href: '#join' },
  },

  footer: {
    columns: [
      { title: 'Membership', links: [['Join', '#join'], ['Renew', '#renew'], ['Plans and dues', '#plans'], ['Check my status', '#status']] },
      { title: 'Community', links: [['Islamic Centers', '#centers'], ['Elections', '#elections'], ['News', '#news'], ['Events', '#events']] },
      { title: 'Help', links: [['FAQ', '#faq'], ['Contact us', '#contact'], ['Accessibility', '#accessibility']] },
    ],
    social: [
      ['Facebook', 'https://www.facebook.com/'],
      ['Instagram', 'https://www.instagram.com/isgh50'],
      ['TikTok', 'https://www.tiktok.com/@htx.isgh50'],
    ],
    legal: [['Privacy policy', '#privacy'], ['Terms of use', '#terms']],
    newsletter: {
      title: 'Get ISGH news by email',
      text: 'Election dates, renewal reminders and community updates. About two emails a month.',
      consent: 'I agree to receive emails from ISGH. I can unsubscribe at any time.',
    },
  },
};
