# Test report – W2 home, content pages, W4 sign-up flow

Date: 2026-10-13 · Method: real `src/**` compiled with esbuild, server-rendered with React 19 and hydrated in Chromium
(Next.js stand-ins only for next/link, next/image, next/navigation); real route handlers served. npm is blocked in the
sandbox, so `next build` was not run here.

## Results
| Suite | Result |
|---|---|
| `layout.spec.ts` (W1) | 15/15 |
| `pages.spec.ts` – 14 pages render (header, footer, one h1, no errors, header Join button intact), 404, home map, plan switcher, countdown, ZIP check, image fallback, alt text | 20/20 |
| `join.spec.ts` – email/OTP, existing member, validation + error summary focus, under-18, outside area, border request, family + multi-year savings, associate, signature match, relative payer, full journey, autosave restore, plan preselect, server re-validation + price recompute, API input checks | 14/14 |
| Unit checks – age math on record date, quotes, voting preview (turns 18 on Jul 1, after Jun 30, associate), plan/class mismatch, ZIP lookup, all mock data match API contracts | 16/16 + 7/7 |
| White-box – real async page modules render identical HTML to the views used for hydration (6 routes) + CMS 404 | 7/7 |
| Image script with simulated network (7 ok, 1 forced 404 → reported, exit code 1) | pass |

## Bugs found and fixed while testing
1. Header "Join ISGH" button turned into a large blank box on the join page – CSS class collision (`.join`) → join card renamed `.jf-card`; regression test added on all pages.
2. Broken-image icons when images are missing – error happened before hydration → Photo checks after mount and shows the pattern placeholder.
3. Commitments in review were lower-cased ("isgh") → original wording kept.

## Run on the owner's PC
`npm install` (also downloads images) → `npm run typecheck` → `npm run build` → `npm run test:e2e:install` → `npm run test:e2e`
