# W1 (Next.js) test report

Date: 2026-10-13

## How it was tested
npm is blocked by network policy in the build sandbox, so `next dev` could not run there. Instead the **real
source files** (`src/**`) were compiled with esbuild, **server-rendered with React 19 `renderToString` and then
hydrated in Chromium** (same as Next.js SSR + hydration), with `next/link` / `next/navigation` replaced by thin
stand-ins. The newsletter route handler ran for real inside a small Node server.

## Results
- `tests/e2e/layout.spec.ts`: **15/15 passed** (desktop + mobile), including "no hydration errors"
- Unit checks: **7/7 passed** – mock config matches the API schema, invalid email rejected, announcement date window
  (before / after / open), CSS-injection attempt in theme values blocked, contrast math
- Theme contrast gate: all 3 themes × light/dark pass WCAG AA

## Still to run on the owner's PC (needs npm)
`npm install && npm run typecheck && npm run build && npm run test:e2e:install && npm run test:e2e`
