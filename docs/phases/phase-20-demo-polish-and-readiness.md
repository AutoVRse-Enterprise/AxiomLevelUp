# Phase 20: Demo polish and readiness

**Status:** Complete

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phases 14–19.

## Goal

Make the sanofi experience feel polished, fast, credible and unmistakably game-like on a phone,
prove it against the PRD success criteria with automated evidence, and hand over a deployable
artifact, presenter runbook and honest readiness verdict. Re-prove that the default experience is
unchanged.

## Workstreams

### 1. Visual language and motion

- Premium scientific aesthetic: dark clinical surfaces from the existing `clinical-*` tokens, one
  accent for points, clear typographic hierarchy for scores and round titles. All through
  `html[data-experience='sanofi']` token overrides and shared components; no forks.
- Motion: round transitions, score count-up, reveal entrance and result build-up through the
  existing `src/design/motion` boundary. Reduced motion removes non-essential movement.
- Avoid children's gamification: no cartoon mascots or excessive confetti; effects stay
  configured and brief.

### 2. Vocabulary policy and automated sweep

- Add `e2e/sanofi/vocabulary.spec.ts`, modelled on `e2e/learner-copy.spec.ts`, visiting every
  sanofi route and run state and failing on visible text matching the PRD §17 avoid-list: Course,
  Lesson, Learning Path, Training Module, Curriculum, Learning Objective, Complete Lesson,
  Certification, Course Progress, Continue Learning, Assessment, plus Pass, Fail, Grade, Learning
  outcome, Course completed, XP and "Sanofi".
- Also fail on leaked internal IDs, mechanic names and placeholder copy.
- Prefer-list spot checks: Play, Round, Score, Try again, Challenge a colleague, Leaderboard.

### 3. Accessibility

- axe-core scans every sanofi route and run state on both viewports (reuse
  `e2e/helpers/accessibility.ts`).
- Keyboard-only completion of a full four-round run.
- 200% text scaling without horizontal document scroll.
- Live announcements for timer thresholds, reveals and final score.

### 4. Performance

- Existing Sanofi bundle budgets remain regression gates and available measurements are recorded.
- Lighthouse, first-round latency and anatomy frame-rate thresholds are deferred by product
  direction for this demo. They remain an explicit readiness open point rather than a Phase 20
  blocker; no performance approval may be inferred.

### 5. End-to-end and visual coverage

- Desktop 1440 × 900 and touch-phone 375 × 812 sanofi specs: full challenge on each playable
  difficulty, each additional playable format, timeout path, paid clue path, resume after reload,
  skip-round failure path, share-link replay and comparison, leaderboard filters, You page and
  presenter reset.
- Visual baselines on both viewports for hub, round intro, Round 1 view, reveal (correct and
  incorrect), result and challenge landing. Phone baselines are justified here because the
  experience is mobile-first (contrast with ADR-102's desktop-only images).
- Scripted rehearsal with human-paced pauses measuring total session length; target 2–4 minutes.

### 6. Default regression proof

- Full `npm run check`, the serial default Playwright suite and the eight Phase 13 golden images;
  compare persisted key names, PWA manifest and budgets with the P14-T00 baseline. ADR-115 records
  the reviewed exception for the one golden that exposed the corrected shared lumen defect.

### 7. Documentation and handover

- `README.md`: experiences overview, commands, and a sanofi manual walkthrough (5–10 minutes)
  alongside the unchanged default walkthrough.
- `docs/qa/phase-20-medical-challenge-runbook.md`: a representative-led script (hand the phone over,
  "Want to try it?"), a presenter-led capability tour (formats, difficulties, share link,
  leaderboard), reset steps and recovery for WebGL or network issues.
- `docs/qa/phase-20-readiness-verdict.md`: evidence against PRD §23, with explicit separation of
  automated evidence, scripted rehearsal and missing human/physical/hosted evidence.
- Deployment notes: build `dist-sanofi/`, host on its own HTTPS origin, generate a QR code for the
  link, configure caching headers for hashed assets; hosting itself remains an external gate.

## PRD §23 success-criteria evidence matrix

| #   | Criterion                                                   | Evidence                                                                                   |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Feels like a game, not training software                    | Vocabulary sweep, hub/result baselines, runbook observation notes                          |
| 2   | A doctor could plausibly enjoy trying this casually         | 2–4 min rehearsal timing; optional human sessions (external)                               |
| 3   | Respiratory setting works as a GeoGuessr-style challenge    | Round 1/2 E2E, spike verdict, pin-versus-actual reveal baseline                            |
| 4   | More than one interaction mechanic                          | Four mechanics exercised per run in E2E                                                    |
| 5   | Exploration degrees create different modes                  | Look-only versus limited-move E2E assertions; difficulty move budgets                      |
| 6   | Medical visuals and clinical information combine            | Round 4 clue tray E2E (audio, table, image)                                                |
| 7   | Scoring and social competition are shareable and repeatable | Share-link replay E2E; leaderboard; Try again with new seed                                |
| 8   | AutoVRse already has the technical ingredients              | Formats composed from the round library; architecture doc; runbook capability tour         |
| 9   | Not a one-off recreation of the client deck                 | Authoring-rule review record (P18)                                                         |
| 10  | The same engine could support many more challenges          | Second organ-agnostic proof: proximity and mechanics have no respiratory constants (tests) |

## Checklist

- [x] **P20-T01 — Visual language and motion pass**
- [x] **P20-T02 — Vocabulary sweep spec and fixes**
- [x] **P20-T03 — Accessibility pass**
- [x] **P20-T04 — Performance evidence deferred; existing budgets remain regression gates**
- [x] **P20-T05 — End-to-end matrix and visual baselines**
- [x] **P20-T06 — Scripted rehearsal timing**
- [x] **P20-T07 — Default regression proof**
- [x] **P20-T08 — README, runbook and architecture/schema closeout**
- [x] **P20-T09 — Deployment package and readiness verdict**
  - Confirm open question 6 (hosting). Physical Android/iPhone checks and hosted HTTPS preflight
    remain external gates; record them as blocked if unavailable, never as passed.
- [x] **P20-T10 — Participant-perspective Quick Challenge UX overhaul**
  - Replace imperceptible/black spatial scenes, require participant-controlled round starts,
    correct timing and celebration/reset defects, and visually re-review all four rounds on both
    target viewports.
- [x] **P20-T11 — Diagnostic lifecycle and lumen follow-up**
  - Prevent duplicate locked-round reveals, keep one anatomy controller through movement and
    correct the shared procedural lumen winding with focused and complete regression evidence.

## Closeout evidence

- `npm run check`: 110 Vitest files / 651 tests, both content roots with zero warnings, both
  production builds and bundle budgets, and default-build isolation all pass.
- `npm run test:e2e:sanofi`: 55 passed / 5 intentional skips, including 20 visual baselines and
  ordinary/restored one-answer-one-event coverage.
- `npx playwright test --workers=1`: all 53 runnable checks passed with 3 intentional skips.
  Seven Phase 13 golden images remain byte-identical; the finding-feedback golden was deliberately
  replaced after fixing the shared lumen wall that its former ring-only black view exposed.
- `dist-sanofi/`: 211 files / 9,174,317 bytes; SHA-256
  `539cb54894e0250d93be095e1aba6b06d586da639f0ee5c821878954b7349349`.
- Hosted HTTPS, physical-device, clinician, scientific-review and performance approval remain open
  external/deferred gates and are not represented as passed.

## Exit criteria

- Every automated gate passes for both experiences.
- The PRD §23 matrix has automated or scripted evidence for every row, with external evidence gaps
  stated plainly.
- The runbook, README and readiness verdict are published.
- The default experience passes its regression gate; ADR-115 records the single intentional
  shared-engine golden correction.

## Risks

- **Polish pressure on shared components.** Polish lands as tokens and shared variants; reject
  experience forks.
- **Over-claiming readiness.** Follow ADR-103 precedent: emulation and scripted runs are not human
  or physical-device evidence.
