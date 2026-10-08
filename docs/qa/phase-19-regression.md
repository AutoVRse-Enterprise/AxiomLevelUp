# Phase 19 regression

**Status:** Passed locally on 2026-10-07.

## Scope

- Configured game hub, three-item navigation and best-score header.
- Saved result route, round details, personal-best and comparison states.
- Share sheet, checksum link landing, fresh-context deterministic replay and challenge comparison.
- Today / This week / All time leaderboard filters for every playable format and difficulty.
- Daily challenge, three expert runs, You history, display name, Credits and presenter controls.
- Persistent synthetic-case notice and prohibited-vocabulary checks.

## Automated evidence

- `npm run check`: passed with 107 Vitest files / 643 tests, zero content warnings, both builds,
  both bundle budgets and default-build isolation.
- `npm run test:e2e:sanofi`: 24 passed / 4 intentional project skips across desktop and 375 × 812,
  including the new fresh-context social flow.
- Serial default Playwright: 52 passed / 3 intentional project skips on the first run; one
  touch-phone DICOM tour timing flake passed immediately with `--last-failed`. Existing golden
  images were not re-baselined.

## Interpretation

The leaderboard and challenge identities are fictional local data. Challenge URLs contain a
versioned deterministic seed and checksum for corruption detection; they are not authenticated,
tamper-resistant or backed by live competition. Physical-device and hosted HTTPS evidence remain
Phase 20 gates.
