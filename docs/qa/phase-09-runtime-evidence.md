# Phase 9 runtime evidence

**Date:** 2026-10-02  
**Environment:** Chrome 140 on Windows 10, production build  
**Application:** `http://127.0.0.1:4181/`  
**DICOM host:** `http://127.0.0.1:4180/`

## Result

The production application loaded the de-identified CT stack from a separate CORS-enabled origin,
rendered all four DICOM modes together, populated the passive DICOM cache and restored all four
viewers after a fully offline hard route reload.

This is local release evidence, not a production service-level objective. Physical mobile memory,
thermal and eviction behavior remains on the device matrix.

## Host and integrity verification

The dedicated DICOM fixture server exposes `Access-Control-Allow-Origin: *`, content type and
content length. `npm run dicom:verify -- http://127.0.0.1:4180/thoracic-ct/` verified:

- 1 hosted schema-v0.2 manifest;
- 125 DICOM instances;
- 65,894,350 declared and hashed bytes;
- per-file size and SHA-256 integrity;
- cross-origin response headers.

The verifier rejected an existing non-CORS preview on port 4174 before the dedicated fixture server
was started, confirming that a host without the required header fails the release check.

## Browser load and passive cache

The production build used `VITE_DICOM_BASE_URL=http://127.0.0.1:4180/`. On the first full-gallery
load:

- all four DICOM viewports reached ready state;
- explore, identify and measure opened on slice 81; guided opened on slice 65;
- 129 cross-origin resource entries were observed: four manifest requests and 125 DICOM instances;
- aggregate resource-entry duration was 1,399 ms, with a 77 ms maximum individual duration;
- `dicom-studies-v1` contained 126 responses: one manifest and 125 instances;
- `offline-courses-v1` remained empty, correctly distinguishing passive revisit cache from an
  explicit course download.

Cross-origin transfer byte counts were unavailable to Resource Timing because the fixture server
does not expose `Timing-Allow-Origin`; integrity verification provides the authoritative byte total.

## Offline hard reload

Chromium network emulation was switched fully offline and `/dev/primitives` was reloaded:

- the service worker remained the active controller;
- the application shell loaded from its 148-entry Workbox precache;
- all four DICOM slice controls became enabled within 220 ms of the post-shell poll;
- the restored slices were 81, 65, 81 and 81;
- no unavailable or load-error heading appeared;
- `dicom-studies-v1` remained at 126 responses.

This proves visited-series recovery. Explicit verified course-download behavior remains covered by
the Phase 7 manager, worker and route tests; `offline-courses-v1` was intentionally empty here.

## Local performance observations

- Full gallery with all 26 primitives and four simultaneous Cornerstone viewers: approximately
  174,001,188 bytes used JavaScript heap and 176,920,308 bytes total heap.
- Initial document lifecycle: DOMContentLoaded at 60 ms and load at 61 ms in the local preview.
- Entry bundle: 420,083 raw / 130,041 gzip bytes.
- Lazy imaging controller: 3,703,170 raw / 1,006,574 gzip bytes.
- Lazy confetti: 10,666 raw / 4,244 gzip bytes.
- Every enforced bundle role passed its configured budget.

The four-viewer gallery is a deliberate stress case; the ordinary player mounts one primitive at a
time.
