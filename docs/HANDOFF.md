# Agent handoff

## Current phase/task

Phase 7 — complete PWA/offline is complete. P7-T00 through P7-T16 satisfy the phase exit criteria.
Phase 8 — product polish is next.

## Done

- Asset-manifest v0.2 requires offline availability, exact byte sizes and non-DICOM SHA-256 hashes.
  `assets:hash` maintains metadata and content validation checks local files.
- Pure package derivation walks course images, primitive assets and typed asset references. Shared
  assets are deduplicated and lesson requirements are derived.
- Learner state v4 no longer stores device downloads. A separate IndexedDB-backed offline library
  tracks queue, progress, verification, failure, eviction and version status.
- The download manager checks quota, requests persistence, expands DICOM manifests, downloads with
  bounded concurrency, verifies every file, resumes, cancels and removes shared URLs safely.
- Explicit downloads use `offline-courses-v1`. The expiring `dicom-studies-v1` cache remains a
  best-effort source and verified responses can be promoted.
- The custom inject-manifest worker precaches the shell, serves verified content first, handles
  media ranges, retains passive DICOM caching and enforces simulated offline mode.
- Course pages show size, progress, cancel, retry, repair, update and removal controls. Catalog cards
  and lesson rows show readiness; disconnected routes gate only missing required content.
- Profile shows site usage, quota, persistence and per-course/remove-all storage controls.
- Install prompting is engagement-gated and cooldown-aware, with iOS instructions. Waiting worker
  and offline-ready notices are actionable.
- Download lifecycle events are typed and logged but excluded from learner-state reduction.
- Browser QA passed same-origin and cross-origin downloads. A 126-entry verified cache rendered
  slice 81 / 125 after both simulated and browser-level offline hard reloads.
- Removal restored the offline gate; simulated eviction produced Repair download and repair
  restored the verified state.
- The manifest parsed with zero browser errors and all four target viewports had no overflow.
- ADR-049 through ADR-056 record offline cache, worker, state, integrity, readiness, storage,
  install/update and simulation decisions.
- The final default entry is 717.19 kB raw / 216.52 kB gzip; the lazy imaging chunk remains
  3,703.17 kB raw / 1,013.90 kB gzip.
- The quality gate passes with 34 test files and 235 tests; five courses and thirteen lessons
  validate with zero warnings.

## In progress

- None.

## Next three steps

1. Plan Phase 8 product polish against the current responsive and accessibility baseline.
2. Audit loading, empty, error and transition states across the core learner journeys.
3. Establish visual/performance budgets before broad animation and styling changes.

## Blockers/questions for the user

- A production external DICOM host URL must be supplied before hosted deployment; local development
  falls back to `/assets/dicom/`.
- The DICOM technical note referenced by the PRD remains unavailable.
- The tracheal region and 17.6 mm educational reference require SME approval before customer or
  clinical use.
- Physical Android Chrome and iOS Safari install, offline and DICOM checks require an HTTPS host and
  devices and remain deferred to Phase 9.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Refresh asset integrity metadata with `npm run assets:hash`.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview the app on another origin.
- Browser QA is recorded in `docs/qa/phase-07-browser-qa.md`.

## Gotchas

- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone`.
- DICOM binaries remain ignored and outside the application precache.
- `offline-courses-v1` is the only source of verified readiness; `dicom-studies-v1` is best effort.
- A worker update may wait. Activate it before judging current cache behavior.
- Asset content changes require `npm run assets:hash`; stale sizes or hashes fail validation.
- Downloads are foreground work and pause when the application loses connectivity.
- A simulated-offline flag persists in service-worker IndexedDB; restore it after manual QA.
- Physical install, pinch and storage-pressure behavior remain Phase 9 checks.
