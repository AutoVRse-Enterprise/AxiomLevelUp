# Phase 18 regression record

**Date:** 2026-10-07  
**Scope:** Spot-the-finding assessment, the complete Respiratory Challenge and reusable game
formats

## Automated coverage

- Vitest covers transform-aware taps, tap-versus-drag behavior, keyboard zoom and marker movement,
  circle/rectangle/polygon distance calculations, linear near-miss scoring, comparison toggles,
  asset-credit collection, multi-pick planning and repeated-slot result keys.
- Sanofi Playwright completes the Respiratory Challenge on Warm-up, Challenge and Expert at
  1440 × 900 and 375 × 812. It operates both spatial rounds, zooms and taps the histology finding,
  completes the clinical call, opens Credits, checks prohibited vocabulary and runs axe.
- Desktop composition coverage also completes Anatomy Hunt and Spot the Finding.
- A separate clock-paced desktop run answers each round at 80% of its limit and dwells for five
  seconds on every reveal. Evidence is stored in
  `docs/qa/evidence/phase-18/challenge-durations.json`.
- The serial default Playwright suite covers both configured viewports and all eight existing
  Phase 13 golden images without snapshot rebasing.
- Final automated gates: 105 Vitest files / 637 tests; Sanofi Playwright 20 passed / 4 intentional
  project skips; default Playwright 53 passed / 3 intentional project skips.

## Duration evidence

- Warm-up limits: 50 / 70 / 40 / 55 seconds; planned with reveal dwell: 235 seconds; paced wall
  time: 192 seconds; persisted active duration: 176 seconds.
- Challenge limits: 40 / 60 / 30 / 45 seconds; planned with reveal dwell: 195 seconds; paced wall
  time: 160 seconds; persisted active duration: 145 seconds.
- Expert limits: 30 / 45 / 25 / 35 seconds; planned with reveal dwell: 155 seconds; paced wall
  time: 128 seconds; persisted active duration: 112 seconds.
- All configured games and difficulties validate inside their own duration windows with zero
  warnings.

## Content, accessibility and isolation

- Sanofi content contains 8 rounds and 6 games. Quick Challenge, Anatomy Hunt and Spot the Finding
  are playable content formats; Clinical Mystery remains a preview.
- Finding alt text is neutral, answer-label leakage is rejected within and across rounds and the
  three image sources carry title, author, source and licence links.
- The region-authoring readout is development-only and is absent from production bundles.
- Default content remains 5 courses, 13 lessons, 4 cases, 1 anatomy map, 0 rounds and 0 games.

## Result

Phase 18 technical scope is complete. Phase 13 human, hosted, clinical/legal and physical-device
gates remain independent and open. Phase 19 owns the game hub, social result actions, You page and
persistent synthetic-case notice.
