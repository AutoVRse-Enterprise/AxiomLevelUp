# Agent handoff

## Current phase/task

Phase 9 — all agent-executable showcase and browser QA is complete. Physical Android/iOS release
gates P9-M01 through P9-M03 are pending.

## Done

- Phase 9 scope, PRD traceability and the physical-device release boundary are documented.
- The internal showcase now has 26 steps covering all 25 registered primitive types plus both
  exploratory and assessed hotspot modes.
- `dicom_guided` was added to the showcase with preset, slice-range, acknowledgement and scored
  checkpoint requirements.
- Automated parity coverage fails if a registered primitive type is absent. The real route
  completes all 26 steps and verifies ordered lifecycle events, retries, summary and session cleanup.
- Production Chromium QA passes 375×812, 812×375, 768×900 and 1280×900 with no document overflow;
  review, missing assets, reduced motion, keyboard zoom and resume recovery were exercised.
- A separate CORS host verified 125 DICOM instances and 65,894,350 bytes. All four viewers loaded,
  `dicom-studies-v1` held 126 responses and an offline hard reload restored every viewer.
- Android/iOS execution scripts, hosted-environment prerequisites and a shared result template are
  ready in `docs/qa/`.
- ADR-064 and ADR-065 record registry-defined showcase completeness and the non-substitutable
  physical-device gate.
- `npm run check` passes with 38 test files and 248 tests, zero content warnings, entry 130,029 gzip
  bytes, imaging 1,006,573 and confetti 4,244.

## In progress

- P9-M01 — physical Android Chrome matrix: not started.
- P9-M02 — physical iOS Safari and installed-app matrix: not started.
- P9-M03 — device defect triage and release approval/waiver: blocked on M01 and M02.

## Next three steps

1. Supply an HTTPS app URL and CORS-capable DICOM URL; complete the hosting prerequisites.
2. Execute `docs/qa/phase-09-android-script.md` and save a completed result record.
3. Execute `docs/qa/phase-09-ios-script.md`, triage findings and close or explicitly waive Phase 9.

## Blockers/questions for the user

- Physical Android and iOS hardware or an approved remote-device service is required.
- A production HTTPS app URL and external CORS-capable DICOM host URL must be supplied.
- The DICOM technical note referenced by the PRD remains unavailable.
- The tracheal region and 17.6 mm educational reference require SME approval before customer or
  clinical use.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Refresh asset integrity metadata with `npm run assets:hash`.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview on another origin.
- Phase 9 browser and runtime evidence is in `docs/qa/phase-09-browser-qa.md` and
  `docs/qa/phase-09-runtime-evidence.md`.
- Physical setup and evidence collection starts at
  `docs/qa/phase-09-hosting-prerequisites.md`.

## Gotchas

- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone`.
- DICOM binaries remain ignored and outside the application precache.
- `offline-courses-v1` is the only source of verified readiness; `dicom-studies-v1` is best effort.
- A worker update may wait. Activate it before judging current cache behavior.
- Asset content changes require `npm run assets:hash`; stale sizes or hashes fail validation.
- Downloads are foreground work and pause when the application loses connectivity.
- A simulated-offline flag persists in service-worker IndexedDB; restore it after manual QA.
- A waiting service worker can make a preview tab look stale; activate the update or use a clean
  origin before comparing bundles.
- Motion tests should assert semantic presence unless they explicitly advance animation frames;
  initial opacity is intentionally zero in full-motion mode.
- The showcase count is 26 steps but 25 unique types; `image_hotspot` intentionally appears twice.
- `offline-courses-v1` being empty during passive revisit QA is correct; only explicit downloads
  populate it.
- Chromium emulation does not satisfy physical install, pinch, haptic, Safari safe-area or
  memory-pressure acceptance.
