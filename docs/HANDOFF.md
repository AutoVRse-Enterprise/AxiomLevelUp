# Agent handoff

## Current phase/task

Phase 15 (game contract and engine) is complete. Phase 16 (game player and clinical-call round) is
next, starting at P16-T00 in `docs/phases/phase-16-game-player-and-clinical-round.md`.

Phase 13 remains Active and independent. P13-T15 is blocked on five qualifying human sessions and
P13-T16 on HTTPS hosting, a production DICOM origin and physical Android/iPhone access. The user
declined a desktop-only waiver on 2026-10-05 (ADR-103); the external Case Lab verdict remains
No-go.

## Done

- Added strict `round` and `game` 0.1 documents, full games app configuration, manifest paths,
  dual-root loading, immutable registry maps and exported JSON Schemas.
- Added four fixed mechanic templates and semantic validation for primitive/clue compatibility,
  references, option sets, drop answers, leakage, placeholders and timing.
- Added a pure seeded game engine for run planning, difficulty application, scoring, generic
  anatomy proximity, sessions, results, messages, leaderboards and challenge links.
- Added a separate namespaced `game-session` store, typed `game_*` events and learner state v9
  game history, bests, daily streak and optional display name.
- Added two valid sanofi clinical-call fixture rounds and one deterministic two-round game.
- Published `docs/qa/phase-15-default-regression.md`.

## In progress

- Nothing.

## Next three steps

1. P16-T00: record ADR-107 for a dedicated game player over shared primitives.
2. Add the shared sanofi game routes/layout and lifecycle UI over the Phase 15 plan/session engine.
3. Author the real clinical-call round and prove the one/two-round loop on desktop and phone.

## Blockers/questions for the user

- No Phase 15 blockers.
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
- Final gate: 95 Vitest files / 593 tests; both content roots at zero warnings; both builds and
  budgets pass.
- Browser gate: default 53 passed / 3 intentional skips; sanofi 2 passed; eight golden images
  unchanged. One initial touch-phone DICOM timeout passed on exact retry and full-suite rerun.
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
- Game links use a checksum for corruption detection, not authentication or tamper resistance.
- The sanofi fixture game is content/engine proof only; no game route or player UI exists until
  Phase 16.
