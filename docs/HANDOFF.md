# Agent handoff

## Current phase/task

Phase 12 is active. P12-T11 is complete; P12-T12 browser-QA finalization and audience-specific
readiness verdict is next.

Phase 9 remains active for physical Android and iOS gates P9-M01 through P9-M03.

## Done

- Preserved the Phase 11 advanced golden case and real-WebGL path while broadening the catalogue to
  differentiated foundation, intermediate and quick cases.
- Completed P12-T01 through P12-T10 contracts and implementation: result/session migration,
  clue-review semantics, procedural segment volumes, case notes/differentials, actionable debrief,
  authored expert comparison, catalogue re-authoring, terminology, functional engagement routes,
  verified offline Case Lab packages, accessibility/performance and resilience.
- Added `e2e/case-breadth.spec.ts` for explicit foundation, intermediate and quick completion on
  desktop and phone. It asserts foundation marker/segment-volume demand, intermediate clue-first
  ambiguity and quick marker exploration, then captures results and comparison.
- Retained the advanced golden path as the fourth case and added separate Phase 12 state, results
  and comparison captures plus optional presenter pacing.
- Added `e2e/product-tour.spec.ts`, split into robust learning/DICOM and engagement sequences on
  both projects:
  - seeded Home and pathway;
  - representative lesson knowledge, visual and real DICOM preset/slice interaction;
  - Imaging Lab guided inspection, slice 81 region point and calibrated 17.6 mm ±10% measurement;
  - truthful XP, mastery, stars and Imaging Explorer badge;
  - Daily Challenge, Weekly/Monthly/All-time Leaderboard and Profile.
- Added 42 durable screenshots under `docs/qa/evidence/phase-12/{desktop,375px}/`: state, results
  and comparison for all four cases plus nine product-tour states per viewport. Tracked Phase 11
  evidence was restored after test runs.
- Added `docs/qa/phase-12-demo-runbook.md`, superseding Phase 11 for presentation use. It contains
  exact build, worker, offline, seed and preflight steps; five-minute product and Case Lab scripts;
  a ten-minute combined route; recovery; and approval boundaries.
- Added `docs/qa/phase-12-browser-qa-draft.md` with environment, coverage, screenshots, automated
  and scripted timing, limitations and the remaining P12-T12 decision boundary.
- Checked P12-T11 and appended the activity log. No commit was created.

## Verification

- `npm run check`: passed in 84.296 seconds.
  - TypeScript and ESLint pass.
  - Vitest: 66 files / 456 tests passed in 34.81 seconds.
  - Content: 5 courses / 13 lessons / 4 cases / 1 anatomy map, zero warnings.
  - Production build and entry, imaging, anatomy and confetti budgets pass.
- Complete production-preview Playwright suite, serial: 50 passed, two intentional project skips,
  zero failures in 424.094 seconds (7.0 minutes).
  - The skips are touch duplicates of the intentionally desktop-only learner-copy sweep and
    verified offline-package worker check.
  - Real WebGL 2 used ANGLE Vulkan SwiftShader on both projects.
- Focused new breadth/product run: 10/10 passed in 121.010 seconds.
- Automated measured paths:
  - desktop breadth: foundation 10.491 s, intermediate 10.038 s, quick 7.297 s;
  - phone breadth: foundation 8.567 s, intermediate 8.342 s, quick 5.641 s;
  - final advanced path: 11.760 s desktop, 8.540 s phone;
  - focused product sequences: 22.265 s desktop, 19.409 s phone.
- Scripted presenter rehearsal with 30-second pauses:
  - product: 4:21.103 desktop, 4:19.406 phone;
  - Case Lab: 4:33.565 desktop, 4:18.624 phone;
  - combined: 8:54.668 desktop, 8:38.030 phone.

## In progress

- No implementation remains for P12-T11.
- P12-T12 must turn the browser QA draft into the final audience-specific readiness verdict and
  update final architecture/schema/decision/roadmap documentation as scoped by that task.
- Clinical, anatomy/pathology and client/legal review of all four case ledgers remains pending.
- P9-M01 through P9-M03 remain pending; no physical-device run has started.

## Next three steps

1. Finalize `docs/qa/phase-12-browser-qa-draft.md` in P12-T12 with the explicit internal,
   supervised-client and unsupervised-use verdict.
2. Update the remaining P12-T12 architecture, schema, decisions and roadmap closeout documents.
3. Complete or formally waive the outstanding clinical/client and physical Android/iOS gates.

## Blockers/questions for the user

- External presentation approval is blocked on all unapproved claims in
  `docs/qa/phase-12-catalogue-content-review.md` and its detailed golden-case ledger.
- Physical-device approval requires Android/iOS hardware or an approved device service, a
  production HTTPS URL and a CORS-capable DICOM host.
- Technical browser completion must not be represented as clinical validation, validated anatomy,
  production hosting approval or physical mobile approval.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch/base: `master` at `362a9bf`, uncommitted Phase 12 worktree
- Node/npm/Playwright: 24.19.0 / 11.17.0 / 1.63.0
- Browser cache override required in this environment:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`
- Browser targets: desktop Chromium 1440 × 900 and touch-phone Chromium 375 × 812.
- Preview: `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`.
- Full gate command: `npm run check`
- Serial browser command:
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
- Scripted timing command: set `P12_REHEARSAL_PACE_MS=30000`, then run the product-tour spec or
  golden-path five-minute test serially. These are paced automation timings, not human observation.
- The user's untracked `docs/reference docs/` remains untouched.

## Gotchas

- Mobile DICOM actions live in the responsive **Activity instructions** sheet. Open it before
  submitting Done, Check location or Check measurement; state is also rendered in the desktop
  panel.
- The calibrated DICOM line has viewport-specific rendered geometry. Both projects assert the
  authored 17.6 mm ±10% acceptance band after a real pointer drag.
- Achievement dialogs can cover result actions and must be dismissed before continuing.
- Full-path anatomy uses real branch controls and a projected canvas finding. List alternatives are
  valid accessibility paths but do not prove canvas picking.
- The golden path still refreshes its historical Phase 11 screenshots when run; restore
  `docs/qa/evidence/phase-11/` after verification. P12-T11 output belongs only under `phase-12/`.
- Playwright uses SwiftShader. It proves the WebGL contract, not hardware GPU performance.
- Segment volumes, branches and findings are illustrative configured geometry, not patient-derived
  segmentation or validated anatomy.
- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Existing Vite warnings cover Cornerstone codec browser externalization, the large lazy imaging
  chunk and Rolldown `inlineDynamicImports` deprecation; all checks and budgets pass.
