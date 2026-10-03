# Phase 10 Case Lab demo-readiness audit

**Date:** 2026-10-03  
**Source:** `case-lab-demo-readiness-audit.canvas.tsx`  
**Original Phase 10 verdict:** No-go for an unsupervised client-facing demonstration
**Phase 12 closeout:** All 12 Phase 12 implementation findings are closed. The unsupervised/external
approval verdict remains No-go because the F19 physical-device and F21 content-review boundaries
remain open external gates.

## Summary

Phase 10 delivered a reusable, configuration-driven technical scaffold, but it did not establish a
credible client demonstration. The audit found 52 issues: 8 P0 demo blockers, 20 P1 major defects,
19 P2 incomplete areas and 5 P3 polish issues.

The principal failure is that the 3D scene is not the source of clinically meaningful evidence.
Canvas selection is unreliable, the advanced airway is not navigable, precise locations are not
supported by visible findings, and mobile controls can be intercepted by fixed chrome. Automated
completion and no-overflow checks therefore do not constitute demo-readiness evidence.

## Triage policy

- **Phase 11:** follow P11-T01 through P11-T13 in dependency order: establish the real-WebGL
  harness, repair the shared golden-path primitives/player, migrate truthful attempts, author the
  five-minute exacerbation case and rehearse the exact build. F24, F35–F38, F50 and F52 are
  explicitly included even though they are not P0/P1.
- **Phase 12:** retain non-golden catalogue breadth, F12 clue-consumption generalization, F26
  tier-level clue totals, F29, F31–F33, F39, F46, F51, deeper F10 anatomy, general timeout partial
  credit, broad schema semantics and general accessibility/polish/offline model packaging.
- **Phase 9:** remains the release gate for physical Android and iOS evidence. Phase 11 does not
  waive or duplicate P9-M01 through P9-M03.

## Finding map

| ID  | Severity | Finding                                                                          | Evidence                                                                                      | Target                                           |
| --- | -------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| F01 | P0       | Lobe meshes cannot be selected reliably from the canvas                          | `src/anatomy3d/three/createAnatomyController.ts:297-314`                                      | P11-T03                                          |
| F02 | P0       | The advertised endoscopic airway navigation is not navigable                     | `src/primitives/components/AnatomyLocatePrimitive.tsx:199-225`                                | P11-T05                                          |
| F03 | P0       | No catalogue case uses the `anatomy_explore` capability                          | `public/content/cases/exacerbation-advanced.json:208-279`                                     | P11-T11                                          |
| F04 | P0       | The 3D scene contains no disease finding to discover                             | `public/content/anatomy/lung-map.json:1-149`                                                  | P11-T06                                          |
| F05 | P0       | Exact localisation answers are arbitrary or leaked                               | `public/content/cases/asthma-foundation.json:180-224`                                         | P11-T11 golden path; P12-T01 other cases         |
| F06 | P0       | Fixed mobile chrome intercepts primary controls                                  | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-mobile-start-obstructed-600.png` | P11-T09                                          |
| F07 | P0       | Exploration can time out and zero the entire multi-level anatomy task            | `src/player/ActivityPlayer.tsx:219-314`                                                       | P11-T02, P11-T07; general partial credit P12-T04 |
| F08 | P1       | The rendered 3D presentation is not client-demo quality                          | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-mobile-3d.png`                   | P11-T06                                          |
| F09 | P1       | The accessibility fallback is the dominant interaction                           | `src/anatomy3d/viewer/AnatomyViewer.tsx:144-231`                                              | P11-T09                                          |
| F10 | P1       | The anatomical hierarchy stops at gross lobes                                    | `public/content/anatomy/lung-map.json:3-83`                                                   | P12-T02; P11-T11 uses authored route/decoys only |
| F11 | P1       | Clue-first entry does not visibly present the clue on mobile                     | `src/player/case/CasePlayer.tsx:396-405`                                                      | P11-T08                                          |
| F12 | P1       | Opening is treated as learning even when content is not consumed                 | `src/player/case/ClueBoard.tsx:20-33`                                                         | P12-T03                                          |
| F13 | P1       | Two clocks compete and clue reading is not time-safe                             | `src/player/case/CasePlayer.tsx:539-559`                                                      | P11-T07                                          |
| F14 | P1       | Saved results falsify the speed sub-breakdown                                    | `src/routes/cases/CaseAttemptPage.tsx:42-56`                                                  | P11-T10                                          |
| F15 | P1       | Comparison exposes internal IDs and uses order-sensitive equality                | `src/player/case/CaseCompare.tsx:91-107`                                                      | P11-T10                                          |
| F16 | P1       | The result total is mathematically opaque                                        | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-attempt-detail.png`              | P11-T10                                          |
| F17 | P1       | Starting a case requires two nearly identical start screens                      | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-redundant-start.png`             | P11-T09                                          |
| F18 | P1       | End-to-end tests replace the core demo with an unavailable-WebGL mock            | `src/routes/play/caseFlow.test.tsx:27-59`                                                     | P11-T01                                          |
| F19 | P1       | Phone/tablet acceptance is claimed while physical-device gates remain open       | `docs/qa/phase-10-browser-qa.md:92-96`                                                        | P11-T13 and P9-M01–P9-M03                        |
| F20 | P1       | The headline asset is online-only                                                | `docs/phases/phase-10-case-lab.md:68-75`                                                      | P11-T12                                          |
| F21 | P1       | Client-facing content has no SME, medical, legal or regulatory review            | `docs/phases/phase-10-case-lab.md:18-27`                                                      | P11-T11                                          |
| F22 | P2       | The workspace becomes a cramped nested three-column layout                       | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-advanced-orient.png`             | P11-T09                                          |
| F23 | P2       | Core controls are separated by excessive vertical scrolling                      | `C:\Users\c0n\AppData\Local\Temp\cursor\screenshots\case-lab-mobile-orient.png`               | P11-T09                                          |
| F24 | P2       | Three progress systems disagree                                                  | `src/primitives/components/AnatomyLocatePrimitive.tsx:279-319`                                | P11-T09                                          |
| F25 | P2       | The first stage intro is skipped                                                 | `src/player/case/CasePlayer.tsx:499-517`                                                      | P11-T09                                          |
| F26 | P2       | Clue totals change meaning between stages                                        | `src/player/case/CasePlayer.tsx:519-538`                                                      | P12-T03                                          |
| F27 | P2       | A previously selected clue can leak into the next stage                          | `src/player/case/CasePlayer.tsx:525-529`                                                      | P11-T08                                          |
| F28 | P2       | The case often reveals the answer before reasoning begins                        | `public/content/cases/asthma-foundation.json:1-20`                                            | P12-T01                                          |
| F29 | P2       | The three tiers repeat the same eight-step template                              | `public/content/cases/copd-intermediate.json:181-437`                                         | P12-T01                                          |
| F30 | P2       | Safety boilerplate overwhelms the simulation                                     | `public/content/cases/exacerbation-advanced.json:1-20`                                        | P11-T11                                          |
| F31 | P2       | There is no evidence workspace or evolving hypothesis                            | `src/player/case/ClueBoard.tsx:37-109`                                                        | P12-T05                                          |
| F32 | P2       | Missed evidence is listed but cannot be reviewed in context                      | `src/player/case/CaseResults.tsx:99-112`                                                      | P12-T05                                          |
| F33 | P2       | The expert benchmark is a score dump, not an expert explanation                  | `src/player/case/CaseCompare.tsx:45-109`                                                      | P12-T05                                          |
| F34 | P2       | A stale service worker can serve the pre-Phase-10 product                        | `docs/HANDOFF.md:77-80`                                                                       | P11-T12                                          |
| F35 | P3       | Long durations are displayed as raw seconds                                      | `src/player/case/CaseResults.tsx:42-53`                                                       | P11-T10                                          |
| F36 | P3       | Scores and best scores omit their denominator                                    | `src/routes/cases/CaseIntroPage.tsx:131-149`                                                  | P11-T10                                          |
| F37 | P3       | The star rating is exposed as decorative glyph text                              | `src/player/case/CaseResults.tsx:47-51`                                                       | P11-T10                                          |
| F38 | P3       | Technical implementation labels leak into the learner UI                         | `src/player/case/CaseCompare.tsx:91-107`                                                      | P11-T10                                          |
| F39 | P3       | Case metadata presentation is inconsistent                                       | `src/routes/cases/CaseIntroPage.tsx:56-64`                                                    | P12-T06                                          |
| F40 | P0       | The next question can time out behind a blocking stage dialog                    | `src/player/case/CasePlayer.tsx:499-587`                                                      | P11-T07                                          |
| F41 | P1       | Foundation's configured overview marker is cleared after load                    | `src/anatomy3d/viewer/AnatomyViewer.tsx:87-90`                                                | P11-T04                                          |
| F42 | P1       | Mobile can display evidence without recording it, while Reopen clue stays closed | `src/player/case/ClueBoard.tsx:124-150`                                                       | P11-T08                                          |
| F43 | P1       | Untimed Foundation completion reports 0 seconds and 0% Speed                     | `src/engines/cases/scoring.ts:234-240`                                                        | P11-T10                                          |
| F44 | P1       | Advanced results hide time spent after the case countdown expires                | `src/engines/cases/clock.ts:41-94`                                                            | P11-T07                                          |
| F45 | P1       | Home, Results and the reward ledger can show three different XP outcomes         | `src/engines/gamification/index.ts:430-510`                                                   | P11-T10                                          |
| F46 | P1       | Daily comparison can display the completed attempt twice                         | `src/routes/play/ChallengePlayerPage.tsx:44-69`                                               | P12-T06                                          |
| F47 | P2       | The metric labelled Speed also includes answer accuracy                          | `src/engines/cases/scoring.ts:113-143`                                                        | P12-T03                                          |
| F48 | P2       | Retries cannot repair the composite score, but the learner is not told           | `src/player/case/CasePlayer.tsx:188-218`                                                      | P11-T10                                          |
| F49 | P2       | Following remediation can reduce the learner's final score                       | `src/engines/cases/scoring.ts:208-225`                                                        | P11-T08                                          |
| F50 | P2       | The featured advanced case has no seeded history to compare                      | `public/content/seeds/advanced.json:31-52`                                                    | P11-T11                                          |
| F51 | P2       | The quick case declares a 3D marker entry but contains no anatomy primitive      | `src/engines/cases/plan.ts:29-39`                                                             | P12-T02                                          |
| F52 | P2       | There is no complete five-minute Case Lab demonstration path                     | `docs/phases/phase-10-case-lab.md:50-64`                                                      | P11-T11                                          |

## Phase 11 closeout disposition

The P11-T13 audit on 2026-10-03 reconciled all 52 findings against the approved phase split.

- **Closed in Phase 11 (40):** F01–F09, F11, F13–F25, F27, F30, F34–F38, F40–F45, F48–F50 and F52.
  The task-by-task implementation evidence is recorded in
  `docs/phases/phase-11-case-lab-demo-hardening.md`; the final real-WebGL and responsive evidence is
  recorded in `docs/qa/phase-11-browser-qa.md`.
- **Explicitly deferred to approved Phase 12 tasks (12):** F10, F12, F26, F28, F29, F31–F33, F39,
  F46, F47 and F51. Their task ownership remains exactly as listed in the finding map and
  `docs/phases/phase-12-case-lab-depth-and-polish.md`.
- **Conditional boundary:** F19's misleading emulation claim is closed by explicit documentation.
  Physical-device approval itself is not closed: P9-M01 through P9-M03 remain active until hardware
  evidence or an authorized waiver.
- **Content approval boundary:** F21's missing-review condition is made visible and controlled, not
  clinically approved. All claims remain blocked for external presentation until the sign-offs in
  `docs/qa/phase-11-golden-case-content-review.md` are recorded.

## Phase 12 rebaseline

P12-T00 reran both technical gates after committing the complete Phase 11 baseline. `npm run check`
and the 16-test real-WebGL `npm run check:demo` suite pass. The 12 approved deferrals remain open
and keep their existing task ownership, with task numbers expanded in
`docs/phases/phase-12-case-lab-depth-and-polish.md`.

Phase 12 also closes the whole PRD section 80 product tour. The rebaseline found two additional
whole-product gaps, recorded as W01 and W02 in `docs/qa/phase-12-baseline.md`: placeholder
Leaderboard periods and weekly challenge cards without a continuation action. P12-T08 closed both.
No F-series finding was reclassified or hidden by the expanded scope.

## Phase 12 closeout disposition

P12-T12 reconciled every finding assigned to Phase 12. **All 12 are closed, with zero silent
deferrals:**

| Finding | Closed by | Closure evidence |
| ------- | --------- | ---------------- |
| F10 | P12-T03 | ADR-087 and `docs/CONTENT_SCHEMA.md` define validated procedural segment volumes; the foundation segment selection passes in `docs/qa/phase-12-browser-qa.md`. |
| F12 | P12-T02 | ADR-086 separates idempotent review from opening; catalogue-wide clue states pass the 236-scan accessibility run in `docs/qa/phase-12-accessibility-performance.md`. |
| F26 | P12-T02 | ADR-086 defines stable case totals separately from stage availability; the four-case browser paths in `docs/qa/phase-12-browser-qa.md` exercise the resulting clue UI. |
| F28 | P12-T06 | ADR-090 requires neutral entry copy and one case-summary disclaimer; `asthma-foundation` completes in the final browser suite without answer-revealing entry copy. |
| F29 | P12-T06 | ADR-090 and `docs/qa/phase-12-catalogue-content-review.md` record differentiated foundation, intermediate and quick compositions; all four cases complete in the final browser suite. |
| F31 | P12-T04 | ADR-088 defines local pinned evidence, current location and authored differential state; state is persisted in result-v7 and exercised by catalogue accessibility/resume coverage. |
| F32 | P12-T05 | ADR-089 defines actionable key-evidence remediation; each case's results capture and state scan covers debrief evidence in the Phase 12 browser evidence. |
| F33 | P12-T05 | ADR-089 requires authored expert path, evidence weighting and diagnosis rationale; each case's comparison capture and state scan covers the teaching view. |
| F39 | P12-T07 | Configured learner-facing metadata formatters replace raw organ-system IDs; the learner-copy browser sweep and all case intros pass. |
| F46 | P12-T07 | Attempt history explicitly excludes the current attempt; focused route tests and daily challenge comparison in the final browser suite pass without duplication. |
| F47 | P12-T01 | ADR-084 defines `time_eligible` speed independent of correctness and result-v7 persistence; scoring/migration tests pass in the final `npm run check`. |
| F51 | P12-T06 | ADR-090 requires entry modes to be consumed; `wheeze-quick` now performs real marker exploration in both final browser projects. |

The general timeout item is also closed by **P12-T01**: ADR-085 makes timeout credit an explicit
primitive-definition policy, `anatomy_locate` uses `committed_progress`, and the final unit gate
verifies preserved weighted credit with an explicit timed-out result and zero step-speed factor.

The boundaries that were never assigned as Phase 12 implementation closures remain explicit:

- **F19 physical boundary:** desktop and 375 px Chromium evidence closes browser implementation
  proof only. P9-M01 through P9-M03 still require physical Android/iOS evidence or approved waivers.
- **F21 review boundary:** the app and claim ledgers expose the unapproved educational/synthetic
  boundary, but no clinical, anatomy/pathology, client or legal approval is claimed. The unreviewed
  items in `docs/qa/phase-12-catalogue-content-review.md` remain release gates.

Audience-specific use is decided in `docs/qa/phase-12-demo-readiness-verdict.md`; implementation
completeness does not satisfy either boundary.

## Evidence interpretation

The source audit combined repository inspection, production desktop and phone playthroughs, saved
results and screenshots. Screenshot paths above are local evidence references and may not be
portable to another workstation. Code and content references identify the audited Phase 10 state;
line numbers may move as Phase 11 changes are implemented.

Phase 10's automated and Chromium QA remains useful evidence for configuration loading, flow
completion, no-overflow checks, fallback behavior and resource disposal. It does not verify real
canvas picking, branch traversal, pathology discovery, mobile hit-testing, clue-consumption
semantics or physical-device acceptance.

## Demo gate

The original technical no-go is lifted for controlled internal and supervised technical
demonstration because the presentation build now completes the gate below. The unsupervised or
external-use no-go remains until the external approvals described after the list are recorded:

1. direct selection of a visible 3D structure;
2. at least one authored airway branch traversal;
3. a patient-specific finding that supports the scored location and diagnosis;
4. evidence review that cannot time out or alter penalties after submission;
5. an explainable `/100` result and non-duplicated expert/history comparison;
6. real-WebGL browser coverage and a clean deployment/cache rehearsal; and
7. applicable Phase 9 physical-device evidence, or an explicit authorized waiver.

Items 1–6 now have automated production-preview evidence in
`docs/qa/phase-12-browser-qa.md`. Item 7 remains open. Clinical, anatomy/pathology and client/legal
sign-off also remains open, so the complete release gate is not satisfied.
