# Phase 16 regression record

**Date:** 2026-10-07  
**Scope:** Shared game player and clinical-call round

## Automated coverage

- Vitest covers elapsed checkpoints, speed-tier labels, presentation defaults/overrides, timer
  expiry and confirmation pause, reveal output, haptics and game-completion confetti.
- Sanofi Playwright covers the two-round completion path, a paid clue, a clock-driven timeout and
  reload/resume on desktop Chromium and 375 × 812 touch Chromium.
- Both game flows run axe and horizontal-overflow checks where the complete surface is visible.
- The existing default suite and eight Phase 13 golden images run without rebasing.

## Content and presentation checks

- Default content remains 5 courses, 13 lessons, 4 cases, 1 anatomy map, 0 rounds and 0 games.
- Sanofi content validates 2 rounds and 2 games with zero warnings.
- The clinical-call intro, prompt and free clues do not contain the answer label.
- The sanofi player surfaces contain no client name or LMS vocabulary.
- The hub start action remains disabled; fixtures are URL-only for Phase 16.

## Result

The final local gate passed 99 Vitest files / 602 tests, both zero-warning content roots, both
builds and bundle budgets. The serial default Playwright suite passed 53 tests with 3 intentional
project skips and all eight existing goldens unchanged. The sanofi suite passed 8 tests across its
desktop and touch-phone projects.

Phase 16 is technically complete. This does not alter the independent Phase 13 external evidence,
clinical review, legal review or physical-device release gates.
