# Research note – W0 Design foundations (colors, theme, type, central control)

Date: 2026-10-13 · Status: **awaiting owner approval**

## 1. Problem
Pick a look for the public website + member portal that feels like ISGH, stands apart from
competitors, passes accessibility, and can be changed centrally (later by admin) without code edits.

## 2. What others do (checked live 2026-10-13)
| Site | Look |
|---|---|
| isghmembership.org (current vendor) | Bright Tailwind greens (#4ADE80 / #BBF7D0) on white, SF Pro / DM Sans, black-and-white stock photo, generic SaaS landing |
| isgh.org (main site, WordPress) | ISGH logo is a **dark green round mark**; accents green #10B765, sand #DDCBA5, yellow; dated theme, PHP warnings visible on the live page |
| MasjidOne | White + navy button, Roboto-like type, phone mockup hero – generic app marketing |
| Mohid, Wild Apricot, Raklet | Neutral SaaS blues/greens, admin-first, little identity |
**Takeaways:** green = ISGH's existing brand equity (keep it, but deeper and more mature than the
current neon green); competitors are generic → our edge is identity (geometric pattern, Houston story)
and clarity (member card + deadline front and center).

## 3. Options prepared (all switchable live in the preview)
| Theme | Story | Primary / accent |
|---|---|---|
| **Bayou Green (recommended)** | ISGH green deepened like Buffalo Bayou under live oaks + Houston-sun marigold | #0E5A45 / #E3A62B |
| Iznik Tile | Cobalt + turquoise of masjid tilework | #1D3F91 / #0D7C7A |
| Texas Dusk | Indigo Maghrib sky + gold horizon | #3B2F7A / #E5A03A |
Each has light + dark. Every text/background pair is **checked automatically** (WCAG AA 4.5:1 text, 3:1 UI);
the build refuses to write `theme.css` if any pair fails.

## 4. Typography
- Headings: **Bricolage Grotesque** (open-source, characterful, wide range) – personality without cliché serif
- Body/UI: **Public Sans** (designed for US public services; very legible; fits a civic membership site)
- Arabic phrases (later): Noto Naskh Arabic
Fonts are theme tokens too, so they can be changed centrally.

## 5. Signature elements
- **8-fold star lattice** (Islamic geometric pattern) as a quiet background texture – the one bold visual
- **Digital member card + June 30 countdown** in the hero: the most characteristic thing in this product
- Restraint elsewhere: one radius scale, plain sentence-case copy, no decorative labels

## 6. Central control (how "change in one place" works)
`web/design/tokens/themes.json` → `node build-theme.mjs` → `theme.css` (CSS variables named like shadcn/ui:
`--background`, `--primary`, `--highlight` …). Components use only variables – never hex codes.
Later: admin **Website theme editor (A8)** writes the same JSON shape into BE settings; the site serves it as CSS variables.

## 7. Accessibility & quality
Contrast gate in build · visible focus ring (3px `--ring`) · 48px touch targets · reduced-motion respected
(only one load animation) · responsive checked at 390px (no horizontal scroll) and 1280px · light/dark.

## 8. Decisions needed from owner
1. Theme: Bayou (recommended) / Iznik / Dusk / mix?
2. Fonts OK (Bricolage Grotesque + Public Sans)?
3. Logo: official ISGH logo vs our concept mark in the header?
