# Agent handoff

## Current phase/task

Phase 13 client demo readiness is active. P13-T00 baseline/rescope is complete and P13-T01
immediate functional fixes is next. Phase 9 remains active for physical Android and iOS gates
P9-M01 through P9-M03.

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
- Replayed the advanced case end to end and inspected the foundation case on desktop and at
  375 × 812 as a trainee doctor.
- Revised the durable client-demo Canvas to remove clinical-accuracy, medical-review, regulatory
  and visual-polish-only findings; added a nine-phase journey analysis and 21 UX-flow findings.
- Confirmed the central UX contradiction: the advanced case can earn 100% Anatomy and 100%
  Diagnosis after reviewing only 1/5 clues, while expert comparison reports every differential
  hypothesis as `Not rated`.
- Committed the audit baseline as `ec8f8ae`.
- Created the Phase 13 plan, roadmap entry, ADR-095 and finding-to-task register.
- Corrected audit H13 (the 42 screenshots exist) and narrowed H08 to the Scientific Imaging
  95/85-minute mismatch.

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
- Fresh product-audit preview ran at `http://127.0.0.1:4192`.
- Canvas TypeScript diagnostics and IDE lint diagnostics pass with no errors.
- No full application check was rerun because the audit changed no runtime source or content.

## In progress

- P13-T01 is next; no runtime Phase 13 changes have landed yet.
- The external Canvas correction is complete and clean.

## Next three steps

1. Complete P13-T01 functional fixes and focused tests.
2. Implement the case 0.2 mission/narrative/evidence contract in P13-T02.
3. Replace blocking stages and add the guided first-run experience in P13-T03.

## Blockers/questions for the user

- Self-guided trainee use is blocked by an unclear case mission, an untaught interaction model and
  evidence/differential systems that are optional to the scored path.
- The Home surface promotes the advanced case before introducing Case Lab, and the relationship
  among Pathway, Course, Case Lab and Challenge is not explained.
- Physical-device approval requires Android/iOS hardware or an approved device service, a
  production HTTPS URL and a CORS-capable DICOM host.
- A presenter-led IT capability demo is conditionally viable after the immediate functional issues
  are fixed; the current trainee journey is not self-explanatory.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`; audit baseline commit `ec8f8ae`
  (`docs(P12-AUD): record trainee UX audit`).
- Worktree contains the active P13-T00 docs and the user's untouched untracked
  `docs/reference docs/`.
- Node/npm/Playwright: 24.19.0 / 11.17.0 / 1.63.0
- Browser cache override:
  `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`
- Browser targets: desktop Chromium 1440 × 900 and touch-phone Chromium 375 × 812.
- Original Phase 12 preview: `http://127.0.0.1:4181`, strict port, `VITE_E2E=true`.
- Fresh product-audit preview: `http://127.0.0.1:4192`.
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
- On desktop, the main anatomy controls sit below the tall 3D viewport. On phone, Clues and Notes
  also sit after the viewport; the clue bottom sheet initially shows its headers before the clue
  card and removes the task from view.
- Case notes are described as optional and non-scoring, but the comparison uses their confidence
  ratings; skipping them can produce `You: Not rated` after a correct diagnosis.
- Browser tests refresh screenshot evidence. Restore unintended evidence churn after verification;
  the committed Phase 11 and Phase 12 evidence sets are the retained closeout artifacts.
- Playwright uses SwiftShader. It proves the WebGL contract, not hardware GPU performance.
- Segment volumes, branches and findings are illustrative configured geometry, not patient-derived
  segmentation or validated anatomy.
- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Existing Vite warnings cover Cornerstone codec browser externalization, the large lazy imaging
  chunk and Rolldown `inlineDynamicImports` deprecation; all checks and budgets pass.
