# Agent handoff

## Current phase/task

Phase 12 is complete through P12-T12. All assigned implementation and technical QA gates are
closed. Phase 9 remains active for physical Android and iOS gates P9-M01 through P9-M03.

## Done

- Completed P12-T01 through P12-T12 and marked the phase complete.
- Closed all 12 Phase 12 F-series findings and the general timeout item with task/evidence
  references in `docs/qa/phase-10-demo-readiness-audit.md`; no finding was silently deferred.
- Closed W01/W02 in `docs/qa/phase-12-baseline.md`.
- Published final production-preview evidence in `docs/qa/phase-12-browser-qa.md` and removed its
  draft predecessor.
- Published `docs/qa/phase-12-demo-readiness-verdict.md`: internal engineering Go, supervised
  client technical preview Conditional Go, unsupervised/external use No-go.
- Corrected the learner-visible authored phrase `reversible-flow`, which the final route sweep
  identified as matching an internal option ID.
- Updated Phase 12, roadmap, PRD, architecture and content-schema closeout wording. Architecture
  now reflects session v5, learner/result v7, timeout/clue/evidence contracts and complete browser
  coverage.
- Audited accepted ADRs 083–094. Numbering is contiguous and references are accurate: ADR-091 is
  period rankings/challenge continuation, ADR-092 is kind-aware offline packages, ADR-093 is
  state-driven browser accessibility/performance/recovery evidence and its anatomy probe, and
  ADR-094 is worker-based runtime content validation. No accepted ADR was renumbered.

## Verification

- Final `npm run check`: passed in **47.420 seconds**.
  - TypeScript and ESLint pass.
  - Vitest: **66 files / 456 tests passed in 19.10 seconds**.
  - Content: 5 courses / 13 lessons / 4 cases / 1 anatomy map, zero warnings.
  - Production app/content worker/service worker and all bundle budgets pass.
- Final serial command:
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
- Complete production-preview suite: **50 passed, 2 intentional project skips, 0 failures in
  6.9 minutes**; measured command wall time **415.861 seconds**.
  - The skips are touch duplicates of the intentionally desktop-only learner-copy sweep and
    verified offline-package worker check.
  - Real WebGL 2 used ANGLE Vulkan SwiftShader on both projects.
- Final automated measured paths:
  - desktop breadth: foundation 10.156 s, intermediate 9.724 s, quick 7.674 s;
  - phone breadth: foundation 8.256 s, intermediate 8.433 s, quick 5.853 s;
  - advanced path: 12.366 s desktop, 8.526 s phone;
  - product sequences: 21.715 s desktop, 18.442 s phone.
- Scripted presenter rehearsal with 30-second pauses:
  - product: 4:21.103 desktop, 4:19.406 phone;
  - Case Lab: 4:33.565 desktop, 4:18.624 phone;
  - combined: 8:54.668 desktop, 8:38.030 phone.
- Focused learner-copy rerun after the correction: 1 passed / 1 intentional project skip in
  29.8 seconds.
- `npm run schema:export` and `npm run assets:hash` were not required because closeout changed no
  schema or asset metadata.

## In progress

- No Phase 12 implementation remains.
- Phase 12 implementation and closeout are committed through `98d0d51`; only external approvals,
  physical-device gates and deployment of an exact approved candidate remain.

## Next three steps

1. Obtain and record respiratory/clinical, anatomy/pathology and client/legal dispositions for
   every item in the four case claim ledgers.
2. Execute P9-M01 through P9-M03 on physical Android/iOS devices, or record authorized waivers.
3. Commit/identify one exact approved candidate, deploy that exact build over HTTPS and complete
   the runbook's build-ID, service-worker, DICOM host/CORS/PHI and offline preflight.

## Blockers/questions for the user

- Unsupervised/external use is blocked on all unapproved claims in
  `docs/qa/phase-12-catalogue-content-review.md` and its detailed golden-case ledger.
- Physical-device approval requires Android/iOS hardware or an approved device service, a
  production HTTPS URL and a CORS-capable DICOM host.
- The supervised-client verdict is only a controlled technical preview; it is not clinical
  validation, validated anatomy, client/legal sign-off, production hosting approval or physical
  mobile approval.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`; Phase 12 closeout commit `98d0d51`
  (`docs(P12-T12): close demo readiness phase`).
- Worktree: clean except for the user's untracked `docs/reference docs/`, which remains untouched.
- Node/npm/Playwright: 24.19.0 / 11.17.0 / 1.63.0
- Browser cache override:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`
- Browser targets: desktop Chromium 1440 × 900 and touch-phone Chromium 375 × 812.
- Preview: `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`.
- Full gate command: `npm run check`
- Serial browser command:
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
- `npm run check:demo -- --workers=1` does not pass the worker option through its nested npm
  command; use the direct Playwright command above for a guaranteed serial run.
- Scripted timing sets `P12_REHEARSAL_PACE_MS=30000`; those results are paced automation, not human
  observation.

## Gotchas

- Mobile DICOM actions live in the responsive **Activity instructions** sheet. Open it before
  submitting Done, Check location or Check measurement.
- The calibrated DICOM line has viewport-specific rendered geometry. Both projects assert the
  authored 17.6 mm ±10% acceptance band after a real pointer drag.
- Achievement dialogs can cover result actions and must be dismissed before continuing.
- Full-path anatomy uses real branch controls and a projected canvas finding. List alternatives are
  valid accessibility paths but do not prove canvas picking.
- Browser tests refresh screenshot evidence. Restore unintended evidence churn after verification;
  the committed Phase 11 and Phase 12 evidence sets are the retained closeout artifacts.
- Playwright uses SwiftShader. It proves the WebGL contract, not hardware GPU performance.
- Segment volumes, branches and findings are illustrative configured geometry, not patient-derived
  segmentation or validated anatomy.
- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Existing Vite warnings cover Cornerstone codec browser externalization, the large lazy imaging
  chunk and Rolldown `inlineDynamicImports` deprecation; all checks and budgets pass.
