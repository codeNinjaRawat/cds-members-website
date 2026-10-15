# Web (Public site + Member portal) – How to Use

## Folder structure (planned)
```
web/
  src/
    app/
      (public)/          home, about, plans
      (auth)/            login, sign-up
      (member)/portal/   profile, card, renewal, payments
    components/ui/       shadcn components
    components/shared/   reusable components
    components/features/ feature components
    lib/  hooks/  schemas/
  tests/e2e/
  .storybook/
```

## Design files (phase 1)
- `design/tokens/themes.json` – the ONLY place colors/fonts/radii are defined
- `design/tokens/build-theme.mjs` – run after editing; refuses colors that fail WCAG AA
- Components must use CSS variables (`var(--primary)` / Tailwind `bg-primary`), never hex codes

## Real code structure (2026-10-13)
See `../README.md` (folder map + admin/BE control table). Rules:
1. **Never hard-code admin content** (menus, texts, prices, contact, colors). Add a field to `src/lib/site-config/schema.ts`
   (= API contract), add it to `mock-site-config.ts`, update `memory/api-contract.md` and `BE/memory/api-contract-web.md`.
2. Fixed interface wording → `src/content/en-US/*.ts` (American English).
3. Colors only via CSS variables / Tailwind theme colors (`bg-primary`, `text-muted-foreground`), never hex.
4. Server components by default; `'use client'` only for interaction. Helpers used on the server must not live in a `'use client'` file.
5. Every module ships with Playwright tests in `tests/e2e/` and a test report.
6. Mock mode: `ISGH_USE_MOCK_API=true` (until BE phase 3).
