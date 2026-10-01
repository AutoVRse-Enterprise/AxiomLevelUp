# DICOM/PWA spike

**Status:** Complete — superseded by the Phase 6 production viewer
**Purpose:** De-risk Cornerstone3D, mobile interaction, WebGL/memory, lazy bundle impact and offline caching before the production DICOM phase.

## Dataset

The spike uses a central 125-slice, 65,894,350-byte CT subset from the public TCIA ACRIN-NSCLC-FDG-PET collection (CC BY 3.0, DOI `10.7937/tcia.2019.30ilqfcl`). The source series has 135 instances. Preparation sorts by Image Position Patient and Instance Number, selects a contiguous range, removes private tags and direct identifiers, renames files deterministically and emits the runtime manifest.

`npm run dicom:audit` passed after de-identification. Provenance, attribution and reproduction steps
now live in `public/assets/dicom/thoracic-ct/README.md`. The `.dcm` binaries remain intentionally
untracked.

## Measurements

| Check                          | Result                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main shell imports Cornerstone | No. The route uses a dynamic import; imaging code is absent from the 526.77 kB main JS chunk (165.01 kB gzip).                                                                                          |
| Lazy imaging chunk size        | 3,707.41 kB minified, 1,015.43 kB gzip. Codec workers/WASM are emitted as separate assets.                                                                                                              |
| Time to first image            | 47–90 ms in local production-preview runs.                                                                                                                                                              |
| Full stack load time           | 276–722 ms online for all 125 slices using four preload workers; 224 ms on a service-worker-backed offline reload.                                                                                      |
| Heap/memory                    | Approximately 397 MB used JS heap at the observed loaded-stack peak. Cornerstone's cache is capped at 256 MiB.                                                                                          |
| Desktop Chrome input           | Passed: wheel slice navigation, primary-drag window/level and selectable zoom, pan and length tools; Lung, Mediastinal and Bone presets apply.                                                          |
| Chrome mobile emulation        | Responsive layout and touch bindings verified. One-finger interaction follows the selected tool; pinch zoom remains active.                                                                             |
| Android Chrome                 | Pending user/device                                                                                                                                                                                     |
| iOS Safari                     | Pending user/device                                                                                                                                                                                     |
| Offline reload                 | Passed in a production preview: 42 shell/content entries and all 125 DICOM responses were cached; with network emulation offline the route reloaded, rendered slice 63/125 and completed 125/125 loads. |

Times are local development-machine observations, not production service-level targets. Later warm runs benefit from browser and service-worker caches.

## Findings

- Cornerstone3D 5.11.3 works with React 19 and Vite 8 when the image loader remains outside dependency optimization, `dicom-parser` is optimized, workers are ES modules, CommonJS compatibility and Node browser aliases are present, and strict chunk execution order is enabled.
- `useLegacyMetadataProvider: true` is required for this static Part-10 `wadouri:` stack; without it, the loader attempts naturalized metadata without pixel data.
- Rendering and tools must initialize once. Cleanup must tolerate React StrictMode's mount cycle and destroy only resources that were created.
- A four-worker image preload queue avoids issuing 124 simultaneous requests. The application caps Cornerstone's global cache at 256 MiB.
- Length annotations can populate `cachedStats` after completion, so the readout listens to both annotation-completed and annotation-modified events and accepts physical units from Cornerstone rather than assuming millimetres.
- DICOM files are excluded from precache and use a dedicated 30-day, 180-entry CacheFirst runtime cache.
- Manifest icons must be excluded from the Workbox glob because vite-plugin-pwa adds them separately. Duplicate revised/unrevised entries cause service-worker evaluation to fail before fetch handlers are installed.

## Verdict

**Accepted for Phase 6.** The spike proved that a custom, lazy educational viewer can render a
representative CT series, support the scoped interaction model and reload offline without adding
Cornerstone to the initial application route. Phase 6 moved the maintained implementation to
`src/imaging/` and the four production primitive components; the spike route and source were
removed.

Before production use:

1. Test real Android Chrome and iOS Safari devices over HTTPS, including pinch, one-finger mode switching, fullscreen, memory pressure and orientation changes.
2. Split or selectively load codecs to reduce the 1.02 MB gzip route cost.
3. Replace eager whole-stack loading with nearby-slice prefetch and explicit course download/remove controls.
4. Track cache usage and eviction per series, and expose recovery for quota failures.
5. Treat measurement units as authoritative metadata and disable graded physical measurements when calibration is unavailable.
6. Add viewer-level integration tests and a device performance budget using production-hosted assets.
