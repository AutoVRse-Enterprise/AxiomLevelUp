# Agent handoff

## Current phase/task

Phase 14 (multi-experience foundation) is complete. Phase 15 (game contract and engine) is next,
starting at P15-T00 in `docs/phases/phase-15-game-contract-and-engine.md`.

Phase 13 remains Active and independent. P13-T15 is blocked on five qualifying human sessions and
P13-T16 on HTTPS hosting, a production DICOM origin and physical Android/iPhone access. The user
declined a desktop-only waiver on 2026-10-05 (ADR-103); the external Case Lab verdict remains
No-go.

## Done

- Added build-time `default | sanofi` resolution, committed Vite modes and static `@experience`
  composition without changing the default route tree or eager Home boundary.
- Gave each experience its own routes, shell configuration, content root, HTML/PWA metadata, port,
  output directory and precache policy.
- Added the minimal Autovrse LevelUp / Respiratory Challenge hub with neutral copy, anonymous
  player "You", teal token override and no default game routes.
- Namespaced non-default IndexedDB/browser keys, service-worker settings and runtime caches while
  preserving all default literals.
- Relaxed structural LMS minimums with non-optional defaults and semantic replacements; added the
  strict optional `games.hub` block.
- Added import boundaries, dual-root validation, dual builds/budgets and dedicated sanofi
  Playwright coverage.
- Published the frozen baseline and final comparison in `docs/qa/phase-14-default-baseline.md` and
  `docs/qa/phase-14-default-regression.md`.

## In progress

- Nothing.

## Next three steps

1. P15-T00: reconfirm ADR-106 and freeze game-domain terminology/configuration boundaries.
2. P15-T01 onward: add strict game/round schemas, fixtures and semantic validation.
3. Build the pure seeded game engine, scoring/link/ranking helpers and learner-state v9 event
   integration without adding UI.

## Blockers/questions for the user

- No Phase 14 blockers.
- Resolved programme decisions are recorded in `docs/MEDICAL_CHALLENGE_PLAN.md` §11.
- Phase 13 blockers remain: qualifying participants, HTTPS/production DICOM hosting and physical
  Android/iPhone access.
- HTTPS hosting of `dist-sanofi/` remains an external Phase 20 gate.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`; branch `master`.
- Node/npm/Playwright baseline: 24.19.0 / 11.17.0 / 1.63.0.
- Browser cache override:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`.
- Ports: default dev/preview 5173/4173; sanofi dev/preview 5174/4174; default/sanofi Playwright
  4181/4182.
- Final gate: 80 Vitest files / 522 tests; both content roots at zero warnings; both builds and
  budgets pass.
- Browser gate: default 53 passed / 3 intentional skips; sanofi 2 passed; eight golden images
  unchanged.
- No development, preview or Playwright processes are running. Ports 5173, 5174, 4173, 4174, 4181
  and 4182 were confirmed free at closeout.

## Gotchas

- Shared modules must not import `@experience` or concrete experiences. Only `App.tsx` and
  `router.tsx` consume the alias; ESLint enforces the boundary.
- Keep default Home eager. Do not replace static alias selection with a runtime registry.
- Default storage and cache names are migration contracts; scope only non-default experiences.
- `src/lib/experience.ts` deliberately tolerates missing `import.meta.env` for Node-loaded
  Playwright helpers.
- Learner-visible sanofi copy must not contain the client name or PRD §17 LMS vocabulary.
- Shared `public/` files are copied into both artifacts but cross-experience roots are excluded from
  precache. Physical pruning is deferred to Phase 20.
- The thoracic CT fixture shows normal anatomy and must not be used for abnormality spotting.
- Playwright SwiftShader proves the WebGL contract, not hardware GPU performance or
  physical-device behavior.
