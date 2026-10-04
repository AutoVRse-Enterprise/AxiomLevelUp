# Agent handoff

## Current phase/task

Phase 13 client demo readiness is active. P13-T00 through P13-T08 are complete; P13-T09
narrative, timing and commitment is next. Phase 9 remains active for physical Android and iOS gates
P9-M01 through
P9-M03.

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
- Closed immediate functional defects: invalid SVG encoding, mobile DICOM control wrapping,
  unavailable/contradictory completion rows, internal comparison copy and production dev routes.
- Weekly progress now supports `cases_completed`; the configured sprint, pathway case node and
  Scientific Imaging duration match runtime behavior.
- Case schema 0.2 now requires a mission and stage purpose, supports patient updates and finding
  significance, and validates duration, decisive clue references and numeric answer leakage.
- All four cases and fixtures are migrated; generated JSON Schema and authoring docs are current.
- Case intro pages now establish the learner role, objective, deliverables and four operating
  rules before launch.
- Learner state v8 records the first-run Case Lab walkthrough. The walkthrough can be replayed and
  pauses both case and task timing.
- Blocking stage dialogs are removed. Inline, focus-managed stage banners introduce each purpose
  and patient update, and the case header exposes one four-stage progress model.
- Active cases now use an in-flow two-column desktop workspace and Task/Evidence/Notes mobile
  segments; fixed clue rails and mobile evidence sheets are no longer part of the active route.
- Shared sticky action slots keep assessment and continuation actions reachable above mobile safe
  areas without covering the task.
- Clues disclose status, exact cost and question relevance before opening. Optional-clue
  confirmation is once per run, and notes include only unlocked evidence and inspected findings.
- Full cases now require differential ratings after Observe and Interpret and a scored
  reviewed-evidence citation before conclusion. Session v6 and result v8 persist checkpoint
  history with legacy defaults.
- Anatomy tasks now pair the viewport with adjacent desktop controls, cap the mobile viewport,
  teach interaction once per learner, announce waypoint arrival, explain finding significance and
  frame localisation as a scored commitment.
- The advanced case now starts from a seeded unknown airway point, uses neutral branch labels,
  conceals anatomical names until commitment and derives localisation answers from the selected
  entry. Session v6 preserves the seed across resume and E2E builds support a fixed query seed.

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
- P13-T03 full unit suite: **71 files / 481 tests passed**.
- P13-T03 ESLint: passed with zero warnings.
- P13-T06 full unit suite: **73 files / 486 tests passed**.
- P13-T06 TypeScript, ESLint and content validation pass with zero warnings.
- P13-T07 focused anatomy/state/case-flow suite: **5 files / 52 tests passed**; TypeScript, ESLint
  and content validation pass.
- P13-T08 focused plan/viewer/case-flow suite: **3 files / 28 tests passed**; TypeScript, content
  validation and patch checks pass.

## In progress

- P13-T09 narrative, timing and commitment is next.

## Next three steps

1. Add patient timeline, timing semantics and first-attempt notice in P13-T09.
2. Redesign results and comparison in P13-T10.
3. Add the Case Lab hub, recommendation selector and glossary in P13-T11.

## Blockers/questions for the user

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
- Worktree contains the active Phase 13 implementation and the user's untouched untracked
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
