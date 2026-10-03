# Agent handoff

## Current phase/task

Phase 10 (Case Lab capability demo) is complete. Phase 9 remains active only for physical Android
and iOS gates P9-M01 through P9-M03, now including the Phase 10 3D anatomy addendum.

## Done

- Added first-class validated case and anatomy-map documents, configuration-driven Case Lab
  settings, strict cross-reference checks and exported JSON Schemas.
- Added `anatomy_explore` and `anatomy_locate`, backed by a lazy plain-Three.js controller with a
  prepared online-only GLB, accessible list selection, reduced-motion camera cuts, endoscopic
  waypoints, explicit disposal and an enforced bundle role.
- Added active timing, clue-linked feedback and pure anatomy/diagnosis/speed scoring with optional
  clue penalties and no-timer weight redistribution.
- Added the staged CasePlayer, resumable session v3, entry modes, clue board, results and expert/own
  history comparison.
- Added case events and central-pipeline progress, XP, mastery and badges; learner state v5 stores
  bounded case attempts and migrates previous snapshots.
- Added Case Lab Home/Learn/routes, the daily quick-case challenge, Autovrse LevelUp identity, three
  respiratory catalogue cases and sourced demo assets with provenance.
- Verified the current BodyParts3D publisher terms and records the respiratory model under CC BY
  4.0 with the required Database Center for Life Science attribution.
- Automated flows complete all three catalogue cases, the daily quick case and a loader-added
  fourth fixture. Chromium QA passes 375×812, 812×375, 768×900 and 1280×900 with no document
  overflow, plus keyboard, reduced-motion, failure and heap-release checks.
- Final Phase 10 gate: 52 test files / 356 tests; 5 courses, 13 lessons, 4 cases and 1 anatomy map
  validate with zero warnings; build and all four bundle roles pass.

## In progress

- P9-M01 through P9-M03 — physical-device runs have not started.

## Next three steps

1. Supply an HTTPS build and CORS-capable DICOM host, then run the Android script including the
   Case Lab 3D addendum.
2. Run the iOS Safari and installed-app script, including 3D touch, safe-area, WebGL recovery and
   repeated-entry checks.
3. Triage device findings and close or explicitly waive the remaining Phase 9 release gate.

## Blockers/questions for the user

- Phase 9 requires physical Android/iOS hardware or an approved device service, a production HTTPS
  URL and a CORS-capable DICOM host.
- Clinical sample content remains illustrative and is not SME, medical, legal or regulatory
  approved.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Refresh asset integrity metadata with `npm run assets:hash`; prepare models with
  `npm run model:prepare -- <source.glb|gltf> <mapping.json> <out-dir>`.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview on another origin.
- The user's untracked `docs/reference docs/` remains outside Phase 10 commits.
- P10-T16 is commit `3258439`; the main Phase 10 close-out is `d2d017c`; the attribution correction
  is the current HEAD.

## Gotchas

- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Keep the imperative Three.js mount empty and separate from React-owned overlays; sharing a mount
  causes reconciliation failures when the canvas is disposed.
- The showcase parity test requires every registered primitive. It currently covers 27 types
  across 28 steps.
- Case names, organ labels, tier behavior, scoring, clue costs, XP and badge thresholds must remain
  in validated content/configuration.
- Models are deliberately online-only; course offline readiness does not include GLB assets.
- DICOM binaries remain outside the application precache. `offline-courses-v1` is authoritative
  for verified readiness; `dicom-studies-v1` is best effort.
- A waiting service worker can make a preview look stale; activate it or use a clean origin.
- Chromium emulation does not satisfy physical install, touch, haptic, Safari safe-area,
  memory-pressure or 3D GPU acceptance.
