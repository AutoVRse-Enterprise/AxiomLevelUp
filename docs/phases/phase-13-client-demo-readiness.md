# Phase 13: Client demo readiness

**Status:** Active — P13-T00 started 2026-10-04

## Goal

Turn the technically complete runtime into a self-explanatory guided Case Lab that an IT stakeholder
can watch in a presenter-led session and then explore without help. A trainee doctor should
understand the mission, gather evidence, evolve a differential, reconstruct location in 3D, commit
to a conclusion and understand the debrief.

Phase 13 closes on usability evidence, not automation alone.

## Audience and boundary

- Primary audience: IT and engineering stakeholders evaluating product and technical feasibility.
- Secondary evaluation persona: trainee doctor using the Case Lab without presenter assistance.
- Clinical, anatomical, legal and regulatory accuracy review is out of scope.
- Real multiplayer, backend synchronization, real KOL identity, AI reasoning and a cross-specialty
  pack are out of scope.

## Target reasoning loop

1. Mission brief.
2. Reconstruct location in 3D.
3. Gather and weigh evidence.
4. Update a differential.
5. Interpret the patient trajectory.
6. Cite evidence and commit to a conclusion.
7. Review one prioritized takeaway and next action.

## UX principles

1. Every screen answers: what am I doing, why does it matter and what do I do next.
2. The task, relevant evidence and primary action remain visible together.
3. Scored decisions depend on evidence; questions do not restate their answers.
4. Features without an in-flow learning purpose are removed or integrated.

## Checklist

- [x] **P13-T00 — Baseline and rescope** — completed 2026-10-04
  - Commit the post-Phase-12 UX audit docs.
  - Add this phase, roadmap entry, ADR-095 and the Phase 13 finding register.
  - Correct H13 (the 42 screenshots exist) and narrow H08 to the actual 95/85-minute mismatch.

- [x] **P13-T01 — Immediate functional fixes** — completed 2026-10-04
  - Repair the two invalidly encoded SVG assets and add SVG encoding/XML validation.
  - Make DICOM tools usable at 375 px and shorten the educational badge.
  - Remove unavailable reward rows and contradictory badge messaging.
  - Remove internal learner copy, gate `/dev*`, fix the weekly case challenge and resolve pathway
    case nodes to Case Lab.
  - Correct the Scientific Imaging duration.

- [x] **P13-T02 — Case schema 0.2** — completed 2026-10-04
  - Add mission, stage purpose/update and finding significance fields.
  - Require decisive clue references for scored steps.
  - Validate estimated duration and reject numeric clue-to-answer leakage.
  - Migrate all four cases, export schemas and record ADR-096.

- [x] **P13-T03 — Briefing, onboarding and continuous stages** — completed 2026-10-04
  - Add a mission card and configured explanation of the case loop/rules.
  - Add a replayable first-run Case Lab walkthrough in learner state v8.
  - Remove blocking stage dialogs; replace them with an inline accessible StageBanner.
  - Simplify stage chrome and record ADR-097.

- [x] **P13-T04 — Unified case workspace** — completed 2026-10-04
  - Add a two-column desktop workspace and Task/Evidence/Notes mobile workspace.
  - Replace the fixed edge rail with an in-flow evidence panel.
  - Add a case-only StepActionSlot for a sticky primary action.
  - Keep the task prompt and action visible at 1440 × 900 and 375 × 812.

- [x] **P13-T05 — Clue economy and scoped notes** — completed 2026-10-04
  - Show clue cost, status and current-question relevance at the decision point.
  - Confirm the first optional clue and simplify progress language.
  - Show only unlocked clues, inspected findings and appropriate hypothesis detail in Case notes.

- [x] **P13-T06 — In-flow differential and evidence citation** — completed 2026-10-04
  - Add `case_differential` and `case_evidence_select` primitives.
  - Store differential checkpoints in session v6 and result v8 with legacy migrations.
  - Re-author all cases to remove answer leakage and weak distractors.
  - Require decisive evidence before a full diagnosis score; remove `Not rated` outcomes.
  - Record ADR-098.

- [x] **P13-T07 — Anatomy interaction contract** — completed 2026-10-04
  - Keep controls adjacent to the 3D viewport on desktop and cap the mobile viewport.
  - Add interaction guidance, arrival feedback and finding significance.
  - Rewrite prompts as learning objectives and frame localisation as the commitment.

- [x] **P13-T08 — Unknown-point reconstruction** — completed 2026-10-04
  - Spike neutral-label navigation.
  - Add seeded `unknown_waypoint` entry and `answerFrom: entry` localisation.
  - Store the attempt seed in session v6 and validate every candidate.
  - Use the mechanic in the advanced case and record ADR-099.

- [x] **P13-T09 — Narrative, timing and commitment** — completed 2026-10-04
  - Add the evolving patient timeline to the workspace.
  - Replace the Foundation clock with “Untimed practice”; explain other timing modes.
  - Disclose first-attempt commitment before the first scored answer.
  - Align advertised and configured duration.

- [x] **P13-T10 — Results and debrief redesign** — completed 2026-10-04
  - Show one outcome, one prioritized takeaway and one recommended next action.
  - Collapse score details and reduce duplication with comparison.
  - Reframe the benchmark as a Model answer and show differential evolution.

- [ ] **P13-T11 — Navigation and terminology**
  - Recommend the first incomplete tier.
  - Add `/learn/cases` with a tier ladder and route “View all cases” there.
  - Explain Pathway, Course, Case Lab and Daily challenge.
  - Standardize learner terminology and extend the copy sweep.
  - Record ADR-100.

- [ ] **P13-T12 — Demo profiles**
  - Make a fresh trainee profile the client-build default.
  - Retain Maya as an experienced learner with a training-aligned role.
  - Add demo-only profile switching/reset and label the leaderboard “Sample cohort.”
  - Record ADR-101.

- [ ] **P13-T13 — Simulated concept previews**
  - Add an explicitly simulated recorded-opponent challenge.
  - Add country, specialty and institution filters over seeded leaderboard data.
  - This is the first task to defer if schedule or quality is at risk.

- [ ] **P13-T14 — Automated and visual regression coverage**
  - Update component, route and E2E tests for the new flow.
  - Add direct tests for ClueBoard, CaseNotes and StageBanner.
  - Add a bridge-free advanced case spec and viewport action/prompt assertions.
  - Add approximately eight desktop golden-screen visual baselines.
  - Pass `npm run check` and serial Playwright; record ADR-102.

- [ ] **P13-T15 — Moderated usability validation**
  - Publish a protocol and run five unaided sessions: at least three clinicians/trainees and two IT
    proxies.
  - Require 4/5 mission comprehension, 4/5 unaided Foundation and Advanced completion, first 3D
    action within 20 seconds, 80% decisive-evidence review and SUS ≥ 70.
  - Fix and retest failures; publish results.

- [ ] **P13-T16 — Delivery and closeout**
  - Deploy one exact HTTPS candidate and complete host/service-worker/DICOM preflight.
  - Run Android and iPhone smoke tests or record a desktop-only waiver.
  - Publish a 10-minute presenter script, hands-on handout and readiness verdict.
  - Close the phase docs, PRD, architecture, schema docs, handoff and activity log.

## Sequencing

1. P13-T00 and P13-T01 establish the baseline and quick fixes.
2. P13-T02 establishes contracts. P13-T03/P13-T04 and P13-T05 follow.
3. P13-T06 establishes the reasoning loop. P13-T07/P13-T08 then P13-T09/P13-T10 complete it.
4. P13-T11 and P13-T12 close product context. P13-T13 is optional.
5. P13-T14, P13-T15 and P13-T16 validate and close.

## Exit criteria

- Every active Phase 13 finding is closed or explicitly deferred with rationale.
- No blocking stage dialogs remain.
- Task, evidence and action are visible together at desktop and phone sizes.
- The answer-leak validator passes and full diagnosis credit requires decisive evidence.
- Differential checkpoints always produce a meaningful comparison.
- The unknown-point case works end to end.
- Broken images, mobile DICOM controls, reward copy and production dev-route exposure are fixed.
- `npm run check`, serial Playwright, visual baselines and the usability thresholds pass.

## Risks

- Neutral-label 3D navigation may remain confusing; validate it in the spike and usability sessions.
- A shared sticky action outlet touches every assessment primitive; gate it to the Case Lab context.
- Schema and state migrations must retain current v5-v7 records.
- Human recruitment and physical device access are external dependencies.

