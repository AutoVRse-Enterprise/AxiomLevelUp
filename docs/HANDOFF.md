# Agent handoff

## Current phase/task

Phase 17 (spatial rounds) is complete. Phase 18 (spot the finding and full challenge) is next.

Phase 13 remains Active and independent. Its human, HTTPS and physical-device gates remain open;
the external Case Lab verdict is still No-go.

## Done

- Recorded the inside-airway legibility no-go and shipped Round 1 with the outside-in glowing
  waypoint marker fallback.
- Added generic look/zoom/orientation, bounded movement, default-off lumen cues, comparison
  highlights and reference-counted model prefetch.
- Added the sanofi respiratory game map, weighted spatial-look scoring, scoped hierarchy proximity
  and dynamic lobe-child segment choices.
- Added persisted spatial scene/answer state, drawer and replacement answer surfaces, pin reveal,
  Retry/Skip failure handling and skipped result semantics.
- Authored one spatial-look round, two spatial-explore rounds and the URL-only
  `/play/fixture-spatial?seed=...` fixture.
- Published `docs/qa/phase-17-regression.md`.

## In progress

- Nothing.

## Next three steps

1. Activate Phase 18 and confirm the spot-the-finding image/region interaction contract.
2. Author Round 3 and compose the complete four-round challenge.
3. Run the Phase 18 difficulty, timing, accessibility and content-leakage gates.

## Blockers/questions for the user

- No Phase 17 blockers.
- The hub remains intentionally disabled until Phase 19; game fixtures are URL-only.
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
- Spatial fixture: `/play/fixture-spatial?difficulty=warmup&seed=1701`.
- Final gate: 104 Vitest files / 626 tests; both content roots at zero warnings; both builds,
  budgets and default-build verification pass.
- Browser gate: default 53 passed / 3 intentional skips; sanofi 12 passed / 2 intentional skips;
  eight default golden images unchanged.

## Gotchas

- Shared modules must not import `@experience` or concrete experiences.
- Keep default Home eager and its route/snapshot/golden contracts unchanged.
- `game-session` uses `skipHydration`; `PlayGamePage` must explicitly rehydrate before selecting a
  resumable run.
- Equivalent anatomy `startView` objects must not remount the Three.js controller; movement drafts
  reconstruct these objects during ordinary renders.
- Concealed waypoint labels must not remove the keyboard structure list from scored localisation.
- The active timer is checkpointed on hide, pagehide, exit, paid-clue confirmation and configured
  viewer failure.
- Learner-visible sanofi copy must not contain the client name or PRD §17 LMS vocabulary.
- The hub remains disabled until Phase 19; direct game URLs are intentional.
- The thoracic CT fixture shows normal anatomy and must not be used for abnormality spotting.
- Playwright SwiftShader proves the WebGL contract, not hardware GPU performance.
- Game links use a checksum for corruption detection, not authentication or tamper resistance.
