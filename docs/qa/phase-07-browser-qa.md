# Phase 7 browser QA

**Date:** 2026-10-02  
**Browser:** Cursor Chromium, production preview  
**Builds:** default `/assets/dicom/` and
`VITE_DICOM_BASE_URL=http://localhost:4174/`

## Install and worker

- Chrome parsed `manifest.webmanifest` with zero errors.
- The manifest reported `display: standalone`, start URL and scope `/`, and four valid icons
  including the maskable 512 px icon.
- The custom inject-manifest worker activated and controlled the application.
- The precache contained 104 entries / 5,670.43 KiB in the final default build.
- Rebuilding while a page was controlled produced the in-app **Update available** card. Choosing
  **Reload** activated the waiting worker and removed `registration.waiting`.
- A fresh worker install produced the dismissible **Ready to work offline** notice.

## Course download and integrity

- Scientific Imaging displayed an estimated download size of 62.8 MB.
- A same-origin download completed and produced 126 entries in `offline-courses-v1`: one validated
  hosted manifest and 125 SHA-256-verified DICOM files.
- A second build used the CORS host at `http://localhost:4174/`. Browser fetch succeeded, the course
  download completed and all 126 verified cache keys used the cross-origin host.
- Download start and completion appeared in the learner event log and did not change rewards.

## Offline behavior

- With the service-worker-enforced developer offline mode active, a hard route load restored the
  application shell and resumed the downloaded DICOM activity. Slice 81 / 125 rendered to one
  canvas without alerts.
- With Chromium network emulation fully offline, a separate hard route load again restored the
  shell and rendered slice 81 / 125 from the verified cross-origin cache.
- After removal, `offline-courses-v1` contained zero entries and the same route showed:
  **This lesson has not been downloaded. Connect to the internet or choose an offline lesson.**
- Deleting one verified DICOM response simulated browser eviction. Startup reconciliation changed
  the course to **Repair download**, displayed the eviction explanation, and repair restored the
  verified state.

## Responsive checks

- 375 × 812: document width 375 px; no horizontal overflow.
- 812 × 375: document width 812 px; no horizontal overflow.
- 768 × 900: document width 768 px; no horizontal overflow.
- 1280 × 900: document width 1280 px; no horizontal overflow.

The offline gate, catalog/status controls and fixed notification cards remained readable at the
tested widths.

## Bundle comparison

- Entry: 717.19 kB raw / 216.52 kB gzip.
- Lazy imaging chunk: 3,703.17 kB raw / 1,013.90 kB gzip.
- Service worker source bundle: 26.80 kB raw / 8.97 kB gzip before manifest injection.
- Phase 6 entry baseline: 690.68 kB raw / 208.45 kB gzip.
- Phase 6 imaging baseline: 3,704.96 kB raw / 1,014.72 kB gzip.

The offline manager and install/update UI added 26.51 kB raw / 8.07 kB gzip to the entry. The
Cornerstone runtime remains lazy and is slightly smaller than the Phase 6 baseline.

## Deferred checks

- Physical Android Chrome and iOS Safari installation, storage pressure and offline DICOM behavior
  remain in the Phase 9 device checklist.
- Browser automation did not expose a deterministic quota-limit control. Preflight and mid-write
  quota paths are covered through injected storage/cache adapters.
- Background downloading is intentionally out of scope; the page must remain open.
