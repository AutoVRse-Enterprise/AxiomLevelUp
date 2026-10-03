# Phase 12 baseline

**Date:** 2026-10-03
**Result:** Phase 11 regression gate passes; Phase 12 starts with 12 mapped Case Lab findings and
two whole-product demo gaps.

## Verified baseline

- `npm run check` passes: typecheck, lint, 59 Vitest files / 400 tests, content validation for
  5 courses, 13 lessons, 4 cases and 1 anatomy map with zero warnings, production build and all
  bundle budgets.
- `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright npm run check:demo` passes:
  typecheck, lint and 16/16 production-preview real-WebGL tests across 1440 x 900 desktop and
  375 x 812 touch-phone Chromium.
- Phase 11 was committed at `e4d36d3` after the gates passed. The user's untracked
  `docs/reference docs/` directory was not staged.
- The 12 Phase 12 Case Lab findings remain F10, F12, F26, F28, F29, F31-F33, F39, F46, F47 and
  F51. General multi-level timeout partial credit also remains open.

## Residual implementation evidence

- F10: the lung map has no segment structures, and the prepared GLB exposes only five lobes,
  trachea and the two main bronchi.
- F12: clue content completion and interaction callbacks are discarded, so opening is the only
  durable clue fact.
- F26: clue opening is case-wide while the displayed denominator changes with each stage.
- F28/F29: asthma and COPD summaries name their diagnosis and both use the same eight-step
  template. COPD adds seven per-step timers rather than deeper reasoning.
- F31-F33: there is no evidence notebook or differential; results list missed clue titles without
  review actions; comparison supports a short per-step rationale but no expert path or evidence
  weighting.
- F39: the case intro exposes the raw organ-system identifier.
- F46: result comparison filters the current attempt, but the daily challenge route supplies the
  complete history and has no explicit no-duplicate assertion.
- F47: per-step and case speed are multiplied by answer accuracy.
- F51: the quick case declares an overview marker but contains no anatomy primitive.
- Timeout: timer expiry preserves the draft but forces score zero instead of evaluating completed
  anatomy-localisation levels.

## Whole-product finding map

| ID  | Severity | Finding                                                                                     | Status                   | Resolution evidence                                                                                                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W01 | P2       | Leaderboard Monthly and All time controls are disabled placeholder actions                  | Closed — P12-T08         | Period-aware ranking in `src/state/selectors/viewModels.ts`, keyboard tabs in `src/routes/leaderboard/LeaderboardPage.tsx` and route/UI coverage in `src/routes/surfaces.test.tsx`. |
| W02 | P2       | Weekly challenge cards display progress but offer no path to continue the relevant activity | Closed — P12-T08         | Pure eligibility resolver in `src/engines/learning/weeklyChallengeDestination.ts`, linked cards in `src/routes/challenge/ChallengePage.tsx` and focused resolver tests.             |

P12-T11 then exercised Weekly, Monthly and All-time Leaderboard views and the configured challenge
route in both browser projects. P12-T12 closes the baseline with no open W-series finding.

No other placeholder, TODO, FIXME, lorem or unimplemented learner copy was found across Home,
Learn, Pathway, Course, Lesson, Challenge, Leaderboard and Profile. Route-level loading, empty and
error states exist. Browser proof of the complete PRD section 80 product tour is owned by P12-T11;
this baseline does not infer that proof from the Case Lab-only Playwright suite.

## Scope decisions

- Phase 12 closes the whole learner-facing product demo in addition to the Case Lab findings.
- Segment-level anatomy will use configured, translucent, pickable procedural volumes and authored
  waypoints. The deepest bronchiole/alveolar level remains an authored choice. No new model asset
  or licence is introduced.
- Clinical/client approval and physical Android/iOS approval remain external gates.
