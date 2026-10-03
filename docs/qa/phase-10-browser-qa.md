# Phase 10 Case Lab browser QA

**Date:** 2026-10-03

**Environment:** production Vite preview, Chromium on Windows 10, WebGL 2 on NVIDIA GeForce RTX
3060 Ti

**Scope:** Case Lab entry, staged play, clues, 3D anatomy, localisation, results and compare

## Result

Pass for configured-flow completion and the recorded Chromium no-overflow checks only. The three
catalogue cases, the daily quick case and a loader-added fourth fixture case complete through
configured content. This is not a Case Lab demo-readiness or physical-device pass.

Physical Android and iOS evidence remains part of the open Phase 9 device gate. The frame-rate,
heap, touch and responsive results below are provisional desktop-Chromium evidence, not a
substitute for physical-device testing.

The later audit in `phase-10-demo-readiness-audit.md` found P0/P1 defects outside this pass,
including unreliable real-canvas picking, blocked mobile hit targets, clue-presentation/state
errors and timing behind overlays. Its no-go verdict supersedes any broader interpretation of this
report.

## Automated coverage

`src/routes/play/caseFlow.test.tsx`:

- completes `asthma-foundation`, `copd-intermediate` and `exacerbation-advanced`;
- completes `wheeze-quick` through the daily-challenge route and verifies both case and challenge
  completion events;
- loads a fourth catalogue case through the content loader and plays it without runtime changes;
- uses a deterministic unavailable-WebGL substitute and verifies the equivalent structure-list
  path;
- drives model-level localisation with keyboard activation, but does not exercise real raycast
  selection, camera behavior, airway traversal or 3D visual quality;
- verifies results, expert comparison, case attempts, mastery, badges and central-pipeline updates;
- reports no axe WCAG 2 A/AA or 2.1 A/AA violations in the active unavailable-3D state. The
  jsdom colour-contrast rule is excluded and is covered by `phase-10-contrast-audit.md`.

Focused verification passed with 2 test files and 12 tests, including the anatomy-viewer regression
suite.

## Responsive matrix

- **375 × 812, portrait phone:** the sampled page had no document-width overflow. This check did not
  establish that fixed chrome leaves Start, Clues or other touch targets unobstructed. A clue-sheet
  trigger was present, but clue presentation and open/consumed state were not verified.
- **812 × 375, landscape phone:** no document overflow. The compact stage and anatomy controls
  appeared in the scrollable document; touch hit-testing and clue-state semantics were not verified.
- **768 × 900, touch tablet:** no document overflow (`scrollWidth === 768`). The persistent clue
  pane is visible beside the step and the final anatomy canvas measures 344 × 468 CSS pixels.
  The viewer's structure list stacks below its canvas; this does not establish that the remaining
  artifact workspace is adequate for a client demonstration.
- **1280 × 900, desktop:** no document overflow. The clue board remains persistent, while the
  anatomy canvas and equivalent structure list share the wider artifact workspace. The later audit
  found this nested three-column arrangement too cramped.

## Accessibility and motion

- Semantic browser snapshots expose the skip link, exit action, stage heading, progress, activity
  heading, clue-board groups and labelled controls.
- Model structures are selectable through buttons with `aria-pressed`; keyboard Enter selects a
  structure and focus remains on the selected control.
- The WebGL-independent structure list provides an equivalent configured answer path. It is not
  evidence that raycast picking works and must not substitute for real-canvas acceptance.
- With reduced motion resolved, waypoint and start-view changes use immediate camera cuts rather
  than tweened flights. The focused unit test verifies `flyTo(..., { animate: false })`.
- All changed brand foreground/background pairs meet AA under the separate contrast audit.

## Failure and lifecycle recovery

- Blocking or failing the model load presents `3D anatomy unavailable`, a Retry action and the
  equivalent structure list, so localisation is not blocked by WebGL.
- The viewer now mounts the imperative Three.js canvas in a dedicated child container. React-owned
  loading and error overlays are siblings, preventing the `NotFoundError: Failed to execute
'removeChild' on 'Node'` reconciliation failure found during this pass.
- A regression test asserts that the controller mount is inside, but distinct from, the
  React-managed viewport.

## Performance and memory

- Sampled animation cadence during loaded orbit and staged case use was approximately 80–165
  `requestAnimationFrame` callbacks per second across the emulated matrix. This is a browser
  callback sample, not a physical-device GPU benchmark.
- Used JavaScript heap was approximately 11 MiB before loading 3D, 18 MiB with the model and
  controller active, and returned to approximately 11 MiB after leaving the player and allowing
  collection.
- The production build keeps Three.js in the lazy `anatomy3d` role. Bundle limits remain enforced
  by `npm run budget`; the entry role does not include the controller.

## Defects corrected during QA

1. Isolated the imperative canvas mount from React overlays to remove the reconciliation crash.
2. Moved the case clue-board breakpoint from large to medium so tablet gets the specified
   persistent pane.
3. Kept the anatomy viewer's own canvas/list split at large width so the tablet's nested workspace
   remains usable.
4. Aligned the advanced seed's Sharp Eye badge with its seeded qualifying case attempt.

## Remaining physical gate

After the applicable Phase 11 fixes, run the Case Lab addendum in the Phase 9 Android and iOS
scripts. It must confirm intended-element touch hit-testing, atomic clue presentation/recording,
real touch orbit, pinch and pan, real model-tap selection, orientation/safe-area behavior, GPU
stability, context-loss recovery and repeated mount/unmount memory behavior before device approval.
