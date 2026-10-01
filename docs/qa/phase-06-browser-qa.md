# Phase 6 browser QA

**Date:** 2026-10-02  
**Environment:** Chrome 140 on Windows 10, WebGL 2 on NVIDIA GeForce RTX 3060 Ti  
**Build:** production build plus local external-host simulation

## Result

Phase 6 passes its desktop Chrome and mobile-emulation gate. The configured explore, guided,
identify-region and measurement flows rendered through the production player; the shared viewer
remained within the document at every target width; cross-origin and cached-offline study loads
worked; and the entry bundle remained free of Cornerstone.

Physical Android Chrome and iOS Safari checks remain deferred to Phase 9.

## Responsive and interaction checks

- **375 × 812, touch:** no document-level horizontal overflow. The viewer used the full available
  card width, controls remained in their intentional horizontal scroller, and the fixed immersive
  fallback covered the 375 px viewport. The instructions sheet remained keyboard-accessible and
  exposed the current activity action.
- **812 × 375, touch landscape:** no document-level horizontal overflow. The wide viewer, prompt
  header and controls remained usable with vertical page scrolling.
- **768 × 900, touch tablet:** no document-level horizontal overflow. The image viewport and
  controls resized after emulation changes.
- **1280 × 900, desktop:** no document-level horizontal overflow. The player used the wide viewer
  layout and retained room for the full toolbar and preset controls.

The complete configured flows covered:

- Explore: first image, slice navigation, Lung/Mediastinal presets, window tool, zoom, pan, fit and
  reset.
- Guided: ordered preset, slice-range and acknowledgement requirements, followed by the embedded
  checkpoint while retaining the viewer.
- Identify region: slice 81 selection at normalized point `(0.5, 0.4785)`, correct grading and
  reveal behavior.
- Measure: a physical `17.9 mm` length on slice 81, correct grading against the configured
  `17.6 mm` reference, 40 XP through the event pipeline, and review-mode annotation reveal.
- Immersive: the Fullscreen API fallback switched to a fixed 375 px-wide overlay, exposed Exit and
  Reset controls, and opened the activity instructions as a bottom sheet.

Mouse, keyboard, wheel, slider and emulated touch bindings were exercised. Two-touch zoom is bound
in the production tool group; physical pinch behavior remains on the Phase 9 device checklist.

## External host and offline reload

The production build used `VITE_DICOM_BASE_URL=http://127.0.0.1:4174/`, while the app preview ran
at `http://127.0.0.1:4173/`.

- `npm run dicom:verify -- http://127.0.0.1:4174/thoracic-ct/` verified 125 files and 65,894,350
  bytes, including CORS, declared sizes and SHA-256 hashes.
- The browser loaded `manifest.json` and all instances from port 4174 while controlled by the
  production service worker on port 4173.
- The `dicom-studies-v1` runtime cache contained 126 responses: one hosted manifest and 125 DICOM
  instances.
- With Chrome network emulation set fully offline, a hard route reload restored the app shell,
  resumed the saved explore step and rendered slice 81 from the runtime cache.

This confirms visited-series reload only. Phase 7 still owns explicit download, quota and removal
UX.

## Timing, memory and bundle observations

These are local development-machine observations, not production service-level targets.

- First image: `236 ms` on the first explore load; subsequent guided, identify and measure loads
  reported `83 ms`, `49 ms` and `45 ms`.
- Loaded-stack JavaScript heap: approximately `249 MiB` used (`260,652,032` bytes), below the
  spike observation of approximately `397 MiB`.
- Cornerstone cache limit: `256 MiB`, with nearby-slice-first loading and four configured preload
  workers.
- Production entry: `690.68 kB` raw / `208.43 kB` gzip. Cornerstone is absent. Compared with the
  Phase 5 entry (`674.74 kB` / `204.44 kB` gzip), Phase 6 adds `15.94 kB` raw / `3.99 kB` gzip.
- Lazy imaging controller: `3,704.98 kB` raw / `1,014.74 kB` gzip, `0.69 kB` gzip smaller than the
  Phase 1 spike (`1,015.43 kB` gzip).
- PWA precache: 104 entries / `5,643.16 KiB`; DICOM files are excluded and remain runtime-cached.

The imaging chunk is intentionally deferred, but its approximately 1.02 MB gzip cost remains a
documented optimization target.

## Deferred checks

See `docs/qa/phase-09-device-checklist.md` for the required physical Android and iOS coverage.
