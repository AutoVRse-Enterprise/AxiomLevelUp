# Agent handoff

## Current phase/task

Phase 18 (spot the finding and full Respiratory Challenge) is complete. Phase 19 (game hub,
results, social and competition) is next.

Phase 13 remains Active and independent. Its human, HTTPS and physical-device gates remain open;
the external Case Lab verdict is still No-go.

## Done

- Added default-off zoomable `image_hotspot` assessment, transform-aware tap placement,
  keyboard zoom, region/distance precision scoring and healthy-reference comparison.
- Added marker-versus-target finding reveal, answer labels, a development-only region authoring
  overlay and answer-leak validation.
- Authored three licensed histology finding rounds with neutral alt text and complete provenance.
- Added provenance-driven run credit collection and an accessible Credits sheet on game results.
- Composed the four-round Respiratory Challenge, Anatomy Hunt and Spot the Finding entirely from
  validated content; published playable formats and the Clinical Mystery preview.
- Published Phase 18 plausibility, duration and regression evidence.

## In progress

- Nothing.

## Next three steps

1. Activate Phase 19 and replace the stub home with the configured game hub.
2. Expand result, sharing/challenge-link, leaderboard and expert-run flows.
3. Add the You page, including the shared Credits sheet and persistent synthetic-case notice.

## Blockers/questions for the user

- No Phase 18 blockers.
- The hub remains intentionally disabled until Phase 19; production games are reachable by direct
  URL.
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
- Production game routes: `/play/respiratory-challenge`, `/play/anatomy-hunt` and
  `/play/spot-the-finding`.
- Final gate: 105 Vitest files / 637 tests; both content roots at zero warnings; both builds,
  budgets and default-build verification pass.
- Browser gate: default 53 passed / 3 intentional skips; sanofi 20 passed / 4 intentional skips;
  eight default golden images unchanged.
- Paced persisted active durations: Warm-up 176 s, Challenge 145 s and Expert 112 s.

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
- `spot_finding` answer labels must not appear in visible prompt, alt, feedback or earlier-round
  copy; semantic validation enforces same-round and cross-round leakage.
- The region debug overlay is available only in development with `?regionDebug=1`.
- Credits on `/you` and the persistent synthetic-case notice are Phase 19 follow-ups.
- Playwright SwiftShader proves the WebGL contract, not hardware GPU performance.
- Game links use a checksum for corruption detection, not authentication or tamper resistance.
