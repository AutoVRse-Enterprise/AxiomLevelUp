# Phase 17 regression record

**Date:** 2026-10-07  
**Scope:** Spatial look and bounded-exploration game rounds

## Automated coverage

- Vitest covers look/FOV controls, bounded waypoint movement, scoped proximity, dynamic
  `structure_choice`, planned drops and overrides, persisted exploration state, skipped outcomes,
  comparison reveal, cache leases and stable viewer lifecycle.
- Sanofi Playwright completes both spatial rounds through visible and keyboard controls on desktop
  Chromium and 375 × 812 touch Chromium. Desktop-only checks exercise projected-canvas lobe picking
  and WebGL-failure Skip.
- The serial default Playwright suite covers both configured viewports and all eight existing
  Phase 13 golden images without rebasing.

## Content and isolation

- Default content is byte-identical to the Phase 16 baseline: 5 courses, 13 lessons, 4 cases,
  1 anatomy map, 0 rounds and 0 games.
- Sanofi content validates 1 anatomy map, 5 rounds and 3 games with zero warnings.
- Round 1 follows the recorded no-go verdict for inside-airway legibility and uses the outside-in
  marker fallback. Round 2 retains bounded endoscopic travel and default-off lumen cues.
- Equivalent reconstructed `startView` values retain the active Three.js controller, and concealed
  navigation still exposes the keyboard structure-choice surface required for localisation.

## Result

The final `npm run check` gate passed 104 Vitest files / 626 tests, both zero-warning content roots,
both builds, both bundle budgets and default-build verification. The serial default Playwright
suite passed 53 tests with 3 intentional project skips; the sanofi suite passed 12 tests with 2
intentional project-specific skips. All eight existing golden images and tracked QA evidence were
restored unchanged after capture.

Phase 17 is technically complete. Phase 13 human, hosted, clinical/legal and physical-device gates
remain independent and open.
