# Agent handoff

## Current phase/task

Phase 12 (Case Lab depth and whole-app demo close-out) is active. P12-T00 is complete; P12-T01 is
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

## In progress

- P12-T01 is ready to define speed, timeout and persisted result/session contracts.
- Clinical, anatomy/pathology and client/legal review of the golden-case claim ledger is pending.
- P9-M01 through P9-M03 remain pending; no physical-device run has started.

## Next three steps

1. Implement P12-T01 speed eligibility, committed-progress timeout credit and the
   session-v5/result-v7 migration.
2. Implement P12-T02 clue review and stable totals before case content is re-authored.
3. Preserve the Phase 11 golden-path gate after every task.

## Blockers/questions for the user

- External presentation approval is blocked on all unapproved clinical, anatomy/pathology and
  client/legal claims listed in `docs/qa/phase-11-golden-case-content-review.md`.
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
- `npm run schema:export` and `npm run assets:hash` were not run for P11-T13 because no runtime
  schema or asset changed.
- The user's untracked `docs/reference docs/` remains untouched.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview on another origin.

## Gotchas

- Golden-case findings and waypoint coordinates are illustrative configured geometry, not
  patient-derived or validated anatomy.
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
