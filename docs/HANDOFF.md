# Agent handoff

## Current phase/task

Phase 6 — DICOM learning viewer is complete. P6-T00 through P6-T16 satisfy the phase exit criteria.
Phase 7 — complete PWA/offline is next.

## Done

- All 25 primitive types are strictly parsed and playable in production, including
  `dicom_explore`, `dicom_guided`, `dicom_identify_region` and `dicom_measure`.
- DICOM courses own series references, presets, tools, one-based slice ranges, normalized targets,
  guidance, expected measurements and tolerances.
- The hosted-series manifest v0.2 contains geometry, attribution, sizes and SHA-256 hashes. Local
  and remote verification checks all 125 files and 65,894,350 bytes.
- `VITE_DICOM_BASE_URL` supports an external CORS host. DICOM binaries remain outside Git and the
  application precache.
- `src/imaging/cornerstone/createController.ts` is the only Cornerstone importer. It provides
  WebGL/CPU initialization, per-viewer resources, nearby-first loading, bounded concurrency,
  calibrated length tools, context-loss handling and reference-counted cleanup.
- The responsive viewer provides loading/retry/skip states, slice/keyboard navigation, tools,
  presets, fit/reset, overlays, instructions and Fullscreen/fixed-overlay immersive modes.
- Explore requirements and ordered guidance are resumable. Guided inspection can retain the viewer
  while presenting an embedded checkpoint.
- Region and measurement grading are pure, slice-aware and reveal-policy controlled. Non-`mm`
  measurements cannot be submitted as calibrated answers.
- DICOM interactions and viewer lifecycle timings flow through typed player events. XP, mastery and
  the first-DICOM badge remain central-pipeline outcomes.
- Scientific Imaging contains the complete guided, identify and measure flow; the internal showcase
  includes the three required DICOM examples and the gallery uses production components.
- The old DICOM spike route/source is removed. Its findings and follow-ups remain documented.
- ADR-040 through ADR-048 record the imaging, hosting, contracts, grading, guidance, event, loading,
  immersive/skip and educational-ground-truth decisions.
- Browser QA passes at 375×812, 812×375, 768×900 and 1280×900 with no document overflow. The
  external-host production build reloads the fully cached series while offline.
- First image measured 236 ms cold and 45–83 ms warm; observed loaded-stack heap was about 249 MiB.
  The final default build entry is 690.68 kB raw / 208.45 kB gzip and the lazy imaging chunk is
  3,704.96 kB raw / 1,014.72 kB gzip.
- The final quality gate passes with 32 test files and 221 tests; five courses and thirteen lessons
  validate with zero warnings.

## In progress

- None.

## Next three steps

1. Plan Phase 7 download, quota, integrity and removal behavior from the manifest v0.2 foundation.
2. Add explicit per-course offline status and download controls without changing primitive UI.
3. Test quota/eviction recovery and complete offline coverage for all configured course assets.

## Blockers/questions for the user

- A production external DICOM host URL must be supplied before hosted deployment; local development
  falls back to `/assets/dicom/`.
- The DICOM technical note referenced by the PRD remains unavailable.
- The tracheal region and 17.6 mm educational reference require SME approval before customer or
  clinical use.
- Physical Android Chrome and iOS Safari DICOM/PWA checks require an HTTPS host and devices and are
  deferred to Phase 9.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://127.0.0.1:4174/`, then run the app.
- Regenerate schemas with `npm run schema:export`.
- Series provenance and hosting are documented in
  `public/assets/dicom/thoracic-ct/README.md`.

## Gotchas

- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone`; the boundary test enforces this.
- DICOM binaries are intentionally ignored. Do not commit them or add them to the PWA precache.
- A new service worker may wait until activated; offline QA must confirm the current build controls
  the page before warming `dicom-studies-v1`.
- Hosted manifest geometry must match the validated asset manifest before rendering.
- Cornerstone-reported measurement units are authoritative. Do not assume pixels or unknown units
  are millimetres.
- Primitive components emit callbacks only. They must not award XP, mutate mastery or bypass the
  learner-event pipeline.
- Slice events are debounced; requirement keys, not raw event counts, own explored completion.
- Physical pinch, iOS fixed-overlay behavior and device memory pressure remain Phase 9 checks.
- Output reward events remain informational and must never be reduced back into learner state.
