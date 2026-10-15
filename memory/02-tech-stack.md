# Web (Public site + Member portal) – Tech Stack

> Inherits the shared stack in `../../memory/02-tech-stack.md`.

| Library | Used for |
|---|---|
| Next.js + TypeScript | App framework |
| Tailwind CSS + shadcn/ui | Styling and components |
| Motion, Magic UI, Aceternity UI | Animations and hero effects (public pages only) |
| React Hook Form + Zod | Sign-up, profile, renewal forms |
| TanStack Query | Fetching data from BE |
| Sonner | Toasts |
| Storybook, Vitest + RTL, Playwright | Design review and tests |

## Installed in code (2026-10-13, `web/package.json`)
next ^15.5 (App Router) · react/react-dom ^19.1 · zod ^3.25 · server-only · tailwindcss ^4.1 + @tailwindcss/postcss · typescript ^5.6 · @playwright/test ^1.55
Fonts via next/font (self-hosted): Bricolage Grotesque (opsz, wdth axes) + Public Sans.
Not yet added (later modules): shadcn/ui components, Motion, TanStack Query, React Hook Form, Storybook, Vitest.
Upgrade to Next.js 16 to be evaluated in a research note (kept on 15.5 for stability).
