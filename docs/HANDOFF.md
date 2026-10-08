# Agent handoff

## Current phase/task

Phase 20 (demo polish and readiness), including the post-closeout Quick Challenge participant UX
overhaul, is complete within the revised local demo scope.

Phase 13 remains Active and independent. Its human, HTTPS and physical-device gates remain open;
the external Case Lab verdict is still No-go.

## Done

- Produced a selective `dist-sanofi/` release with production fixtures removed, exact versioned
  model URLs and all configured game media precached.
- Proved a complete representative challenge after service-worker activation with the browser
  network disabled.
- Applied Sanofi-scoped clinical surfaces and reduced-motion-safe round, reveal, score and result
  transitions without changing default DOM contracts.
- Added vocabulary/internal-ID, route/state axe, keyboard-only, live-announcement, 200% text,
  two-viewport game-matrix and deterministic visual coverage.
- Recorded 128–192 second rehearsals and published the presenter/recovery/hosted/device runbook.
- Published the PRD §23 readiness verdict and final local release evidence.
- Replayed all four Respiratory Challenge rounds at 1440 × 900 and 375 × 812, documented eleven
  participant-facing/lifecycle defects and corrected the spatial, pacing, scoring, reset,
  phone-action and event-integrity problems.
- Replaced the imperceptible Round 1 marker and black terminal-waypoint Round 2 camera with a
  graph-framed outside-in airway map, depth-independent beacons and explicit location choices.
- Made Sanofi round introductions participant-controlled, relaxed complexity-weighted timers and
  moved blocking guidance/actions out of the anatomy/evidence viewport.
- Expanded deterministic Sanofi visual coverage from 14 to 20 images so every active round is
  represented on desktop and phone.
- Restricted locked-round recovery to genuinely restored sessions, kept the anatomy controller
  alive across waypoint movement and corrected the procedural lumen winding. The default
  finding-feedback golden now shows the intended shaded airway wall instead of a ring-only void.

## In progress

- No local Quick Challenge implementation work remains.

## Next three steps

1. Deploy the exact verified `dist-sanofi/` artifact to an HTTPS origin and complete hosted
   preflight.
2. Run the prepared Android Chrome and iPhone Safari physical-device scripts.
3. Conduct clinician usability/scientific review and decide whether to commission deferred
   performance measurement.

## Blockers/questions for the user

- No local Phase 20 implementation blockers.
- Phase 13 blockers remain qualifying participants, HTTPS/production DICOM hosting and physical
  Android/iPhone access.
- HTTPS hosting, physical Android/iPhone checks and human enjoyment evidence remain external
  Phase 20 gates.
- Performance thresholds are deferred for this demo; existing bundle budgets remain regression
  checks and performance approval stays open.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`; branch `master`.
- Node/npm/Playwright baseline: 24.19.0 / 11.17.0 / 1.63.0.
- Browser cache override:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`.
- Ports: default dev/preview 5173/4173; sanofi dev/preview 5174/4174; default/sanofi Playwright
  4181/4182.
- Game routes: `/`, `/play/:gameId`, `/results/:runId`, `/c/:token`, `/leaderboard` and `/you`.
- Final non-browser gate: 110 Vitest files / 651 tests; both content roots at zero warnings; both
  builds, budgets and default-build verification pass.
- Browser gate: Sanofi 55 passed / 5 intentional skips. The default serial run passed all 53
  runnable checks with 3 intentional skips.
- Seven default golden images remain unchanged; one was deliberately updated for the corrected
  lumen wall under ADR-115.
- Twenty Sanofi visual baselines pass.
- Verified Sanofi artifact: 211 files / 9,174,317 bytes; SHA-256
  `539cb54894e0250d93be095e1aba6b06d586da639f0ee5c821878954b7349349`.
- Phase 20 started from commit `2d6213d` plus the complete uncommitted Phase 19 implementation;
  preserve that work when preparing commits.

## Gotchas

- Shared modules must not import `@experience` or concrete experiences.
- Keep default Home eager and its route/snapshot/golden contracts unchanged.
- `game-session` uses `skipHydration`; `PlayGamePage` must explicitly rehydrate before selecting a
  context-matching resumable run.
- Hero anatomy prefetch leases intentionally survive hub unmount until the first round starts or
  the grace timeout expires.
- Learner-visible sanofi copy must not contain the client name or PRD §17 LMS vocabulary.
- The thoracic CT fixture shows normal anatomy and must not be used for abnormality spotting.
- Challenge links are checksum-protected client data, not authenticated or tamper-resistant.
- Leaderboard rows and expert identities are fictional local demonstration data.
- Presenter controls require both `demo.enabled` and `/you?presenter=1`.
- Presenter profile changes must rehydrate and clear the separate `game-session` persist store.
- Playwright SwiftShader proves the WebGL contract, not hardware GPU performance.
- Spatial game rounds deliberately use the outside-in airway map. Do not restore terminal-waypoint
  endoscopic starts or claim a photorealistic bronchoscopy view.
- Sanofi sets `introAutoAdvanceMs` to `0`; the timer must begin only after **Start round**.
- Treat anatomy `startView` as initialization state; waypoint movement must use the existing
  controller. Arm locked-round replay only from an initially persisted `locked` session.
