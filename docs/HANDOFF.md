# Agent handoff

## Current phase/task

Phase 16 (game player and clinical-call round) is complete. Phase 17 (spatial rounds) is next,
starting at P17-T00 in `docs/phases/phase-17-spatial-rounds.md`.

Phase 13 remains Active and independent. Its human, HTTPS and physical-device gates remain open;
the external Case Lab verdict is still No-go.

## Done

- Added the sanofi-only `/play/:gameId` and `/results/:runId` routes and full-bleed `GameLayout`.
- Added the shared game lifecycle, active timer, checkpointed resume, timeout, reveal, final,
  replay, exit/new-game behavior and typed event emission.
- Added lesson-default/game-override `PresentationContext` labels without changing default copy.
- Added the clinical clue tray with free clues, paid confirmation, inline multimodal evidence and
  configured score deductions.
- Added correct-answer haptics and score-threshold game completion confetti.
- Added `clinical-call-t2`, shared wheeze/histology assets and deterministic one/two-round fixtures.
- Published `docs/qa/phase-16-regression.md`.

## In progress

- Nothing.

## Next three steps

1. P17-T00: record spatial-player decisions and activate Phase 17.
2. Author the spatial look/explore rounds over the existing anatomy map and viewer.
3. Extend the game player with configured spatial move/commit presentation and tests.

## Blockers/questions for the user

- No Phase 16 blockers.
- The hub remains intentionally disabled until Phase 19; Phase 16 fixtures are URL-only.
- Phase 13 blockers remain qualifying participants, HTTPS/production DICOM hosting and physical
  Android/iPhone access.
- HTTPS hosting of `dist-sanofi/` remains an external Phase 20 gate.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`; branch `master`.
- Node/npm/Playwright baseline: 24.19.0 / 11.17.0 / 1.63.0.
- Browser cache override:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`.
- Ports: default dev/preview 5173/4173; sanofi dev/preview 5174/4174; default/sanofi Playwright
  4181/4182.
- The sanofi player fixtures are `/play/fixture-two-round?seed=42` and
  `/play/fixture-one-round?seed=7`.
- Final gate: 99 Vitest files / 602 tests; both content roots at zero warnings; both builds and
  budgets pass.
- Browser gate: default 53 passed / 3 intentional skips; sanofi 8 passed; eight default golden
  images unchanged.

## Gotchas

- Shared modules must not import `@experience` or concrete experiences.
- Keep default Home eager and its route/snapshot/golden contracts unchanged.
- `game-session` uses `skipHydration`; `PlayGamePage` must explicitly rehydrate before selecting a
  resumable run.
- The active timer is checkpointed on hide, pagehide, exit and paid-clue confirmation. Free and
  purchased clues remain inline while time runs.
- Learner-visible sanofi copy must not contain the client name or PRD §17 LMS vocabulary.
- The hub remains disabled until Phase 19; direct game URLs are intentional.
- The thoracic CT fixture shows normal anatomy and must not be used for abnormality spotting.
- Playwright SwiftShader proves the WebGL contract, not hardware GPU performance.
- Game links use a checksum for corruption detection, not authentication or tamper resistance.
