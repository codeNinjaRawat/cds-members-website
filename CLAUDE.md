# Instructions for AI assistants

Before working in `web`, read `memory/README.md` here and `../memory/README.md`
at the project root. Keep both updated and log changes in the changelogs.

All user-facing text must follow `../memory/09-content-style-guide.md` (American English, Houston TX formats).
Membership rules come from `../memory/10-membership-rules.md`.

CURRENT PHASE: Web UI/UX phase 1 is OPEN (2026-10-13). Work module by module (W0 → W12), each approved. Theme source of truth: design/tokens/themes.json.

Golden rules: admin controls everything (no hard-coded business values – use settings/flags);
research note before any feature; black-box + white-box tests and a test report before delivery;
start with `../memory/00-START-HERE.md`.
Build order: Web UI → Admin UI (glass) → BE (SQL) → integration → mobile, in small approved modules (../memory/17-build-order-and-modules.md).

CODING RULES (2026-10-13): never hard-code admin-controlled content – extend `src/lib/site-config/schema.ts` (the BE contract),
update mock + `memory/api-contract.md` + `../BE/memory/api-contract-web.md`; colors only via theme variables; tests per module.
