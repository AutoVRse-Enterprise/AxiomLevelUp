# Agent handoff

## Current phase/task

Phase 12 (Case Lab depth and whole-app demo close-out) is active. P12-T07 is complete; P12-T08 is
next.

Phase 9 remains active for physical Android and iOS gates P9-M01 through P9-M03.

## Done

- Established the real-WebGL Playwright harness and repaired shared anatomy picking, marker,
  endoscopic navigation and configured-finding behavior.
- Excluded unscored exploration from timing/scoring, paused timing behind blocking UI, unified clue
  presentation and hardened the artifact-first responsive case player.
- Migrated current case results to learner state/result v6 with truthful timing, scoring, rewards
  and comparison.
- Re-authored `exacerbation-advanced` version 2.0 as the neutral `Respiratory Case Review`:
  - four stages and exactly six tasks;
  - endoscopic exploration from `trachea-mid` through the right lower lobe to the posterior basal
    segment, requiring inspection of the dominant mucus occlusion;
  - overlay-free lobe/segment/structure localisation;
  - one multiple-select severity task, one CO₂ reasoning task, one diagnosis task and one urgent
    consequence task;
  - no per-step timers, a 300-second target and 480-second maximum;
  - one disclaimer, authored benchmark responses/rationales and a debrief.
- Added generic right-lower-lobe superior, lateral basal, posterior basal and distal posterior
  basal waypoints to `lung-map`.
- Added configured diffuse wall thickening/mild narrowing and dominant posterior-basal mucus
  occlusion findings linked to clues.
- Seeded one prior result-v6 attempt for the featured case in the advanced learner profile.
- Added a development-only `?anatomyDebug=1` camera, target, mode and waypoint readout. Production
  builds omit it through `import.meta.env.DEV`.
- Added `docs/qa/phase-11-golden-case-content-review.md`; all clinical claims remain explicitly
  unreviewed and require recorded SME/client sign-off.
- Enabled P11-T11 Playwright completion in desktop and touch-phone Chromium. The complete suite
  passes all 14 tests and uses real branch controls plus projected finding-canvas activation.
- Recorded the composition boundary in ADR-081 and checked P11-T11 complete.
- Versioned all runtime GLB requests with validated SHA-256 metadata and added a dedicated
  CacheFirst service-worker cache bounded to four entries and 14 days.
- Prefetched only the configured featured case's exact model from its intro, with accessible ready,
  loading, retry and non-blocking failure states.
- Added the visible reproducible/configurable build ID, fixed stale update state when service
  workers are blocked and tested waiting-worker reload behavior.
- Added a production-preview service-worker cache check and
  `docs/qa/phase-11-demo-runbook.md`; recorded ADR-082 and checked P11-T12 complete.
- Closed P11-T13 with all 40 Phase 11 audit findings resolved and all 12 approved Phase 12
  deferrals retained. The real-WebGL suite passes 16/16 on desktop and 375 px touch emulation.
- Added durable finding, localisation, results and comparison screenshots for both targets under
  `docs/qa/evidence/phase-11/` and recorded the exact environment, timings, renderer and limitations
  in `docs/qa/phase-11-browser-qa.md`.
- Corrected a final visual-acceptance defect in the generated lumen: closed waypoint spheres were
  removed so the endoscopic camera now sees the airway rings and mucus occlusion rather than a flat
  wall. Refreshed screenshots and the complete browser suite confirm the correction.
- Updated the final architecture, content contracts, audit disposition, roadmap and phase status.
  ADR-074 through ADR-082 remain accepted, sequential and accurately referenced.
- Committed the complete Phase 11 implementation as `e4d36d3` after `npm run check` and the
  16-test real-WebGL demo gate passed.
- Started Phase 12 with a written baseline, kept all 12 approved F-series deferrals open and added
  W01/W02 for the disabled Leaderboard periods and inert weekly-challenge cards.
- Expanded Phase 12 to close the whole PRD product tour and recorded ADR-083. Segment depth will
  use configured procedural volumes and waypoints without introducing a new GLB.
- Replaced accuracy-adjusted speed with result-v7 `time_eligible` scoring: step speed averages only
  first-attempt scores at or above the configured threshold, case speed is time-only and untimed
  redistribution remains intact.
- Added definition-level timeout credit with a conservative `none` default and
  `anatomy_locate: committed_progress`; timed-out localisation keeps weighted completed-level
  credit while its step speed remains zero.
- Upgraded active sessions to v5 and learner state/results to v7 with reviewed-clue, evidence,
  current-location, differential and timeout-credit placeholders. Result-v5/v6 attempts remain
  discriminated legacy records without invented facts.
- Exported the updated schemas and recorded ADR-084 and ADR-085.
- Separated clue review from ADR-079 clue opening: static evidence uses configured visible dwell,
  media uses configured playback progress or completion and interactive visual evidence uses
  primitive interaction/completion.
- Persisted one review per clue in session v5/result v7, added `case_clue_reviewed`, based missed
  key evidence on reviews and added stable case totals plus separate stage availability.
- Exposed accessible unopened/opened/reviewed states while suppressing importance labels for
  advanced tiers; exported the config schema and recorded ADR-086.
- Added exclusive mesh/procedural-volume anatomy structures with pure configured containment and
  overlap validation.
- Added 18 labelled bronchopulmonary segment ellipsoids across all five lobes and 18 segmental
  airway branches while preserving the featured-case route and labels.
- Rendered only currently selectable volume levels as pickable translucent ellipsoids with faded
  parent-mesh context, full highlight/frame/projection/disposal support and no Three.js imports
  outside the anatomy adapter.
- Moved the foundation apical segment level onto the real 3D volume path and added a projected-point
  real-WebGL test across both browser projects. Exported schemas and recorded ADR-087.
- Added optional authored case differentials with a two-item minimum and semantic ID uniqueness;
  authored four hypotheses for the featured golden case.
- Added the local Case notes workspace with reviewed-clue and inspected-finding pins, mapped
  learner-facing location, reflective confidence controls and stage-transition prompts.
- Integrated Clues/Notes tabs in the non-blocking desktop rail and compact separate actions in the
  blocking mobile sheet; mobile Clues and Notes both pause case and step clocks.
- Persisted session-v5 evidence and differential updates through result v7, emitted typed pin and
  hypothesis events, exported the case schema and recorded ADR-088.
- Replaced `debrief.keyClueIds` with validated typed key-evidence references, affected task links
  and authored significance; all catalogue cases and fixtures now use the contract.
- Added required expert path, evidence weights, diagnosis rationale and per-scored-step rationale,
  including a complete golden-case teaching model with the inspected mucus finding.
- Rebuilt results as actionable evidence cards with accessible read-only clue/finding review and
  anchored comparison links. Comparison now presents expert approach, evidence status/weight,
  learner differential ratings, diagnosis reasoning and labelled per-step rationale without raw
  IDs.
- Persisted inspected finding IDs with new result-v7 completions while keeping existing v5/v6 and
  earlier v7 records readable. Exported schemas and recorded ADR-089.
- Re-authored the foundation and intermediate catalogue as six-task compositions and the daily
  case as a three-task composition, each with a required unscored anatomy exploration, neutral
  entry copy, one disclaimer and complete differential/teaching metadata.
- Added configured foundation, intermediate and quick-case findings while preserving the advanced
  golden case's exact six tasks, route, findings, timing and tested prompts.
- Added explicit benchmark step timing facts and pure scorer recomputation. Content validation now
  rejects empty stages, unconsumed orient entries, unreferenced clues, incomplete learner-visible
  rationales and benchmark breakdown drift.
- Seeded unique result-v7 foundation and intermediate attempts and migrated the golden prior
  attempt to result v7 with normalized responses, eligibility, reviewed evidence and differential
  state.
- Added the four-case unreviewed claim ledger, exported schemas, recorded ADR-090 and closed
  P12-T06.
- Added configured Case Lab organ-system display labels and strict semantic resolution, then
  centralized tier, organ-system, estimated-time, duration, score and XP formatting.
- Appended the configured daily quick case to the Case Lab catalogue with a Daily badge while
  preserving the explicit featured order, intro/history routes and daily-challenge pipeline.
- Removed the just-completed challenge attempt from route-supplied comparison history, retained
  the component's defensive filter and added an explicit current-attempt de-duplication test.
- Exported the app-config schema and closed P12-T07 without an ADR.

## In progress

- P12-T08 is ready to close the whole-app W-series demo gaps and learner-facing terminology.
- Clinical, anatomy/pathology and client/legal review of all four catalogue claim ledgers is
  pending.
- P9-M01 through P9-M03 remain pending; no physical-device run has started.

## Next three steps

1. Close whole-app W-series demo gaps in P12-T08.
2. Add general offline Case Lab packages in P12-T09.
3. Preserve the 18-test real-WebGL gate after every task.

## Blockers/questions for the user

- External presentation approval is blocked on all unapproved clinical, anatomy/pathology and
  client/legal claims listed in `docs/qa/phase-12-catalogue-content-review.md` and the detailed
  golden-case ledger it references.
- Phase 9 requires physical Android/iOS hardware or an approved device service, a production HTTPS
  URL and a CORS-capable DICOM host.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Demo gate: `npm run check:demo`; focused browser gate: `npm run test:e2e`.
- P11-T13 verification:
  - final `npm run check:demo`: typecheck, lint and 16/16 Playwright tests pass in 93.259 seconds
    after the visual-acceptance correction;
  - desktop automated golden path: 17.654 seconds; 375 px path: 17.043 seconds;
  - WebGL 2 renderer: ANGLE Vulkan SwiftShader (Subzero) on both emulated targets;
  - full `npm run check`, IDE diagnostics and `git diff --check` pass.
- Playwright needed
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright` in this sandbox because its
  automatic temporary cache did not contain Chromium build 1243.
- The unoverridden reproducible P11-T12 build ID was `0.1.0+765186c09b76`; deployments may set
  `VITE_BUILD_ID` or supported CI commit metadata.
- Content validation reports 5 courses, 13 lessons, 4 cases, 1 anatomy map and zero warnings.
- P12-T00 baseline:
  - `npm run check` passes with 59 Vitest files / 400 tests;
  - `npm run check:demo` passes 16/16;
  - Phase 11 baseline commit: `e4d36d3`.
- P12-T01 verification:
  - focused Vitest passes 10 files / 114 tests;
  - typecheck, lint and content validation pass with 5 courses, 13 lessons, 4 cases, 1 anatomy map
    and zero warnings;
  - `npm run check:demo` passes all 16 desktop/touch-phone real-WebGL checks;
  - `npm run schema:export` passes;
  - generated app-config and learner-seed schemas include the new contracts.
- P12-T02 verification:
  - focused Vitest passes 9 files / 99 tests;
  - typecheck, lint and content validation pass with 5 courses, 13 lessons, 4 cases, 1 anatomy map
    and zero warnings;
  - `npm run schema:export` passes and the generated app-config schema includes `clueReview`;
  - final `npm run check:demo` passes all 16 desktop/touch-phone real-WebGL checks in 213.947
    seconds;
  - the first demo run exposed an accessible-name compatibility regression on the desktop clue
    trigger; restoring its `Clues` prefix fixed the P11-T09 locator and the complete rerun passed.
- P12-T03 verification:
  - schema export and focused tests pass 7 files / 78 tests;
  - full `npm run check` passes 61 files / 415 tests, zero content warnings, production build and
    all bundle budgets without adjustment;
  - the focused P12-T03 real-WebGL check passes in desktop and touch-phone Chromium;
  - the complete browser suite passes all 18 tests across both projects with `--workers=1`; an
    initial two-worker run had one transient timeout in the pre-existing desktop finding stability
    poll while its touch and full-path equivalents passed.
- P12-T04 verification:
  - focused tests pass 4 files / 68 tests;
  - schema export, typecheck, lint and content validation pass with 5 courses, 13 lessons, 4 cases,
    1 anatomy map and zero warnings;
  - full `npm run check` passes 62 files / 421 tests, production build and all bundle budgets;
  - the final complete browser suite passes 18/18 serially across desktop and 375 px touch
    emulation;
  - the first browser run exposed the two-action mobile bar wrapping over a projected canvas
    target; compact visible labels with complete accessible names restored the touch pick, and its
    focused check plus the complete rerun passed.
- P12-T05 verification:
  - focused tests pass 8 files / 100 tests;
  - schema export and content validation pass with 5 courses, 13 lessons, 4 cases, 1 anatomy map
    and zero warnings;
  - full `npm run check` passes 63 files / 428 tests, production build and all bundle budgets;
  - the complete serial real-WebGL suite passes 18/18 across desktop and 375 px touch emulation;
  - IDE diagnostics and `git diff --check` pass. No commit was created, and
    `docs/reference docs/` was not touched.
- P12-T06 verification:
  - focused catalogue, state and route tests pass 3 files / 64 tests; focused affected case tests
    pass 7 files / 98 tests;
  - schema export and content validation pass with 5 courses, 13 lessons, 4 cases, 1 anatomy map
    and zero warnings;
  - full `npm run check` passes 63 files / 434 tests, production build and all bundle budgets;
  - the final serial real-WebGL suite passes 18/18 across desktop and 375 px touch emulation;
  - IDE diagnostics and `git diff --check` pass. No commit was created, and
    `docs/reference docs/` was not touched.
- P12-T07 verification:
  - focused metadata, selector, route and case-flow tests pass 9 files / 100 tests;
  - schema export and content validation pass with 5 courses, 13 lessons, 4 cases, 1 anatomy map
    and zero warnings;
  - full `npm run check` passes 64 files / 438 tests, production build and all bundle budgets;
  - the serial real-WebGL demo suite passes 18/18 across desktop and 375 px touch emulation;
    one intermediate run had a transient touch projected-lobe selection miss, and the immediate
    complete rerun passed;
  - IDE diagnostics and `git diff --check` pass. No commit was created, and
    `docs/reference docs/` was not touched.
- `npm run schema:export` and `npm run assets:hash` were not run for P11-T13 because no runtime
  schema or asset changed.
- The user's untracked `docs/reference docs/` remains untouched.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview on another origin.

## Gotchas

- Golden-case findings and waypoint coordinates are illustrative configured geometry, not
  patient-derived or validated anatomy.
- Segment volumes and airway branches are illustrative authoring geometry. Mesh-parent fit uses the
  model asset bounds, volume-parent fit samples the child center and rotated axis extremes, and
  same-level overlap uses configured center-line penetration tolerance; these checks are not
  anatomical segmentation validation.
- `versioned-case-models-v1` caches only SHA-versioned GLBs (four entries, 14 days). It is a
  targeted demo preload and does not establish general offline 3D.
- Run the full WebGL Playwright suite with `--workers=2` on this workstation; four concurrent
  workers caused resource-contention timeouts while the two-worker rerun passed all 16 tests.
- `?anatomyDebug=1` works only in a development build; `window.__anatomyTest` remains restricted to
  `VITE_E2E=true`.
- Full-path Playwright uses branch controls and a stable projected finding point on the real
  canvas. P11-T03 remains the separate authoritative lobe-raycast test; normal list localisation in
  P11-T11 avoids duplicating that proof.
- Achievement dialogs can cover result actions and must be dismissed before comparison.
- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Keep the imperative Three.js mount empty and separate from React-owned overlays.
- Case names, labels, thresholds, rewards and pathology parameters remain validated configuration.
- Chromium emulation, especially the SwiftShader renderer used by Playwright, does not satisfy
  physical install, touch, haptic, Safari safe-area, memory-pressure or 3D GPU acceptance.
- The only workspace item intentionally left untracked is the user's `docs/reference docs/`.
