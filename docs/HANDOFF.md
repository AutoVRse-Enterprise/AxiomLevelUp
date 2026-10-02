# Agent handoff

## Current phase/task

Phase 8 — product polish is complete. Phase 9 showcase and physical-device QA is next.

## Done

- Motion uses a token-driven `LazyMotion` boundary with System, Reduced and Full device
  preferences. CSS and JavaScript share `html[data-motion]`.
- Typed learner events drive throttled optional haptics, live announcements and configured,
  dynamically imported confetti.
- Answer feedback, completion, celebrations, persistent counters, pathway nodes and progress
  surfaces use restrained motion with reduced-motion parity.
- Shared loading, notice, empty and error contracts cover boot, routes, media, DICOM, unsupported
  primitives, corrupted content, offline assets, quota and application failures.
- All learner routes are lazy. The entry is 130,029 gzip bytes, the imaging chunk is 1,006,573 and
  confetti is isolated at 4,244; all enforced budgets pass.
- Desktop navigation replaces the bottom tab bar at large widths. DICOM instructions persist in a
  side pane, while video, hotspot, compare and DICOM artifacts support immersive expansion.
- Browser QA passes 375×812, 812×375, 768×900, 1280×900, 200% text, reduced motion and offline
  recovery. Lighthouse scores 84 performance, 100 accessibility, 100 best practices and 92 SEO.
- The quality gate passes with 38 test files and 247 tests; five courses and thirteen lessons
  validate with zero warnings.
- ADR-057 through ADR-063 record the Phase 8 presentation, preference, effect, delivery, responsive
  and resilience decisions.

## In progress

- None.

## Next three steps

1. Define the Phase 9 showcase and physical-device matrix.
2. Validate install, haptics, fullscreen, orientation and DICOM gestures on Android Chrome.
3. Repeat the install, offline, fullscreen and DICOM checks on iOS Safari.

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
- Phase 8 browser QA is recorded in `docs/qa/phase-08-browser-qa.md`; its raw Lighthouse result is
  `docs/qa/phase-08-lighthouse-final.json`.

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
- Physical install, pinch and storage-pressure behavior remain Phase 9 checks.
