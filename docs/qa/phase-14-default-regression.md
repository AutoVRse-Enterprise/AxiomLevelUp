# Phase 14 default-experience regression

Compared with `docs/qa/phase-14-default-baseline.md` after the multi-experience implementation on
2026-10-07.

| Condition | Baseline | Phase 14 result | Verdict |
| --- | --- | --- | --- |
| Routes, layouts and lazy boundaries | Frozen production/development route characterization; Home eager | The unchanged characterization passes; sanofi has its own independent eager Home and wildcard | Pass |
| Navigation and shell | Five items, learner status and exact shell snapshot | Default snapshot is byte-identical; sanofi's one-item shell has no bottom navigation or learner status | Pass |
| Default content | `public/content/**`; 5 courses / 13 lessons / 4 cases / 1 map / 0 warnings | No tracked byte changed under `public/content/**`; counts and warnings are identical | Pass |
| Persisted names | Legacy `axiom-runtime:` keys, three legacy cache names and `axiom-runtime-service-worker` | Characterization tests pass unchanged; only sanofi receives its configured namespace | Pass |
| Manifest and HTML | Frozen complete web manifest and normalized HTML metadata | `npm run verify:default-build` passes; default service worker does not precache `experiences/**` | Pass |
| Precache | 171 entries / 7087.65 KiB | 171 entries / 7093.43 KiB; count and cross-experience isolation unchanged | Pass |
| Unit/content gate | 73 files / 500 tests; one default content root | 80 files / 522 tests; default and sanofi roots validate with zero warnings | Pass |
| Default bundle budgets | Entry 411,869 / 128,715; imaging 3,703,172 / 1,006,576; anatomy 689,298 / 175,616; confetti 791 / 505 (raw/gzip) | Entry 414,316 / 129,861; imaging 3,703,170 / 1,006,574; anatomy 689,298 / 175,616; confetti 791 / 504; no limit changed | Pass |
| Serial default Playwright | 53 passed / 3 intentional skips / 0 failed in 9.4 minutes | 53 passed / 3 intentional skips / 0 failed in 10.0 minutes | Pass |
| Eight Phase 13 golden images | Passed without update | Passed without `--update-snapshots`; no baseline image changed | Pass |
| Sanofi production gate | Not applicable | Entry budget passes at 268,383 raw / 84,054 gzip; two-project smoke passes metadata, keys, vocabulary, responsive overflow, axe and unknown paths | Pass |
| Manual browser QA | Default baseline | Sanofi passed at 1440 × 900 and 375 × 812 with no overflow, no bottom navigation, neutral copy and no client name; default Home retained five-item navigation and original content | Pass |

## Commands

- `npm run check`
- `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
- `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npm run test:e2e:sanofi -- --workers=1`

No default snapshot or product-content rebaseline was required.
