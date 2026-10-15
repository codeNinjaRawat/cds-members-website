# ISGH Members – website (web)

Public website + member portal for the Islamic Society of Greater Houston.
**Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · zod · Playwright**

> Everything visitors see – menus, announcement, footer, organization details, feature switches and the
> color theme – is **controlled by admins in the admin app and served by the BE**. The website only renders it.

## Quick start (Windows / macOS / Linux)
```bash
cd membership/web
copy .env.example .env.local      # macOS/Linux: cp .env.example .env.local
npm install
npm run dev                       # http://localhost:3000
```
Requires Node.js 20.9+. Photos load from the Pexels CDN during the demo (internet needed); `npm run images` self-hosts them for production.
**Demo mode:** no API calls – forms (join, newsletter, feedback, complaints, verify) run on `src/lib/demo/demo-service.ts`.
Test mode sign-up: open /membership/join, any email, code **123456**. Until the BE exists, `ISGH_USE_MOCK_API=true` uses built-in mock data.

## Commands
| Command | What |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / run |
| `npm run typecheck` | TypeScript check |
| `npm run theme:build` | Contrast-check `design/tokens/themes.json` and update the fallback theme |
| `npm run test:e2e:install` then `npm run test:e2e` | Playwright tests (starts the dev server itself) |

## How admin & BE control the site
| What | Admin place | BE endpoint | Web code |
|---|---|---|---|
| Menus, Sign in / Join buttons | CMS › Menus | `GET /public/site-config` → `nav`, `actions` | `src/lib/site-config/*`, `SiteHeader` |
| Announcement bar (text, tone, link, dates, dismissible) | CMS › Announcements | `site-config.announcement` | `AnnouncementBar` |
| Footer columns, social, legal, newsletter text | CMS › Footer | `site-config.footer` | `SiteFooter` |
| Organization name, address, phone, email | Settings › Organization | `site-config.org` | `SiteFooter`, metadata |
| Feature switches | Settings › Feature flags | `site-config.flags` | `src/lib/flags` |
| Colors, fonts, radii, active theme | Website theme editor (A8) | `GET /public/theme` + `site-config.theme` | `src/lib/theme/*` |
| Newsletter sign-ups | Marketing › Subscribers | `POST /public/newsletter/subscriptions` | `src/app/api/newsletter/route.ts` |
| Home page (all texts, zones, centers, photos) | CMS › Home page | `GET /public/pages/home` | `src/lib/content/home.ts`, `components/home/*` |
| Content pages (about, elections, FAQ …) | CMS › Pages | `GET /public/pages/{slug}` | `src/lib/content/pages.ts`, `app/[...slug]` |
| News | CMS › News | `GET /public/news` | `components/cms/NewsListView` |
| Plans, prices, deadline, join rules | Settings › Membership & dues | `GET /public/membership/settings` | `src/lib/content/membership.ts`, `src/lib/join/schema.ts` |
| Sign-up (OTP, address→center, application) | Auth, Centers & zones, Applications | `/public/auth/otp/*`, `/public/residency/lookup`, `/public/membership/applications` | `components/join/JoinFlow`, `app/api/*` |

- BE responses are **validated with zod** (`src/lib/site-config/schema.ts` = the contract). Invalid data or BE down → site keeps working on the fallback and logs the error.
- Admin themes are **contrast-checked** before use; failing themes are rejected.
- Responses are cached `ISGH_CONFIG_REVALIDATE_SECONDS` (default 60) and tagged (`site-config`, `theme`) for instant revalidation from the BE later.

## Folder map
```
src/app/            routes (layout.tsx loads config + theme), api/newsletter
src/components/layout/  AnnouncementBar, SiteHeader, MobileMenu, ThemeToggle, SiteFooter, NewsletterForm, icons
src/lib/api/        BE client      src/lib/site-config/  contract (schema), loader, mock
src/lib/theme/      theme CSS builder + contrast check, loader, no-flash mode script
src/lib/flags/      feature flags   src/content/en-US/   fixed UI wording (American English)
src/styles/         base + layout CSS (uses theme variables only)
design/             tokens + approved prototypes (W0, W1)
tests/e2e/          Playwright specs
memory/             project memory for this app – read memory/README.md first
```
