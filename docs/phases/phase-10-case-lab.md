# Phase 10: Case Lab capability demo

**Status:** In progress — implementation plan approved; P10-T01 next

## Goal

Add a reusable, configuration-driven case-game capability to the runtime and demonstrate it with
three respiratory sample cases. A learner is placed at an unidentified point in an anatomy model,
works through configured stages, opens clues, locates the finding, interprets the evidence and
commits to a diagnosis. They then receive a composite score with clue-linked feedback and compare
their attempt with an expert benchmark and their own history.

Phase 10 proves a capability, not a customer course. The case engine must know nothing about lungs:
a new organ system is a new anatomy map, assets and case documents.

## Source and framing

- Source brief: `docs/reference docs/Sanofi artifact requirement.pdf`, plus three images sent
  separately in chat: a respiratory anatomy reference, the 12-step end-to-end flow and the
  "three core layers" mock-up.
- The brief is an example of content a prospect may request. It is not a contracted
  specification. Sample assets come from free internet sources. SME review, medical/legal review
  and clinical accuracy are out of scope for this demo.
- Scope was agreed in three rounds of clarification on 2026-10-03 and is recorded below and in
  ADR-066 through ADR-073.
- The detailed implementation plan was approved on 2026-10-03. Its content contracts, scoring
  formula, task dependencies and acceptance criteria are the execution baseline for this phase.

## Agreed scope

### In scope

- **Case content type:** a first-class, validated case document containing a patient profile, a
  clue catalogue, ordered stages of primitives, a tier, timing rules and an expert benchmark.
- **Stage flow:** Orient (locate), Observe (findings), Interpret, Diagnose, followed by Score,
  Feedback and Compare. Stages run in fixed order. Within a stage, the learner opens the stage's
  clues freely and in any order.
- **All 25 existing primitives** are usable inside stages and as clues.
- **New primitive `anatomy_explore`:** a real 3D model with orbit, zoom and pan, tappable tagged
  structures, and branch-by-branch fly-through along authored airway waypoints.
- **New primitive `anatomy_locate`:** drill-down localisation through configured hierarchy levels
  with per-level partial credit. 3D input goes to lobe depth; segment and structure levels use 2D
  regions or choices.
- **Clue-linked feedback:** every scored step can name the clue or clues the learner should have
  read. Wrong responses can override this per option, region or scenario choice.
- **Composite score:** anatomy 40%, diagnosis 40% and speed 20% by default, all configurable. Speed
  is measured per question and per case. Each optional clue opened beyond the essential set costs
  a small configured penalty.
- **Three tiers, all open from the start:**

  | Tier                 | Sample case  | Entry view                                         | Timing                              | Hints   |
  | -------------------- | ------------ | -------------------------------------------------- | ----------------------------------- | ------- |
  | Basic (`foundation`) | Asthma       | Whole 3D model with a marker at the hidden site    | No timer                            | On      |
  | Intermediate         | COPD         | A clue image first, then locate it on the 3D model | Visible stopwatch; speed bonus only | On      |
  | Advanced             | Exacerbation | Camera inside the airway (endoscopic view)         | Countdown                           | Reduced |

- **Compare:** a seeded expert benchmark and the learner's previous attempts at the same case.
- **Gamification hooks:** case-specific badges, separate anatomy, pathophysiology and diagnosis
  mastery, and a daily quick-case challenge.
- **Surfaces:** a featured "Case Lab" section inside Learn and a Case Lab headline card on Home.
  Existing courses remain.
- **Branding:** the app name becomes "Autovrse LevelUp". Add the Autovrse logo and accent colour
  tokens taken from autovrse.com; the rest of the design language is unchanged.
- **Devices:** phone, tablet and desktop treated equally.

### Out of scope

- Multiplayer, live or asynchronous duels, expert (KOL) challenges against real people, and any
  backend.
- Segmented leaderboards (country, specialty, congress or institution).
- DICOM inside cases.
- Offline download of 3D models and case assets. They load online only; the existing course
  offline behaviour is unchanged.
- Pathway gating between tiers.
- SME, medical, legal or regulatory review and clinical validation of sample content.

## Architecture plan

### Case document

Cases are listed in `manifest.json` under a new `cases` array and validated by the same loader and
registry. Proposed shape, refined in P10-T02:

```text
case
├── schemaVersion, caseVersion, id, title, summary, tier, conceptIds, estimatedMinutes
├── patient: label, age, sex, presenting complaint, history items, optional image asset
├── anatomyMapId           -> configured anatomy map (model + hierarchy + waypoints)
├── entry                  -> overview_marker | clue_first | endoscopic, with target location
├── clues[]                -> id, category, title, essential, primitive (any content primitive)
├── stages[]               -> id, kind, title, intro, clueIds[], steps[] (primitives), component
├── timing preset          -> resolved from the tier unless overridden
└── expertBenchmark        -> name, duration, clues opened, per-step responses, score breakdown
```

- Clue categories are configured. The respiratory set is visual, anatomical, histological,
  biomarker, audio and history.
- Each stage declares the score component its steps feed: `anatomy`, `diagnosis` or `none`.
- `app-config.json` gains `caseLab`: title, featured case, ordered case IDs, the daily quick case,
  tier presets (timing, hints, entry defaults), score weights, the clue penalty and labels.

### Case player

- New activity kind `case` alongside `lesson` and `challenge`. The plan, session and event types
  widen to include it.
- The case player wraps the existing step player. It adds a stage header, a clue board, stage
  gating, a case clock and entry-view handling. Steps keep using the existing lifecycle, review,
  retry and reveal machinery.
- Opening a clue is an interaction: clues render through the normal primitive renderer inside a
  drawer, sheet or side pane.
- Case sessions are resumable and record the current stage, opened clues and active elapsed time.
- New screens: case intro (patient, tier rules, clue cost), results (component breakdown, clue
  penalty, time) and compare (expert benchmark and own history), with a replay action.

### Scoring

- A pure `src/engines/cases` module computes the composite breakdown from first-attempt fractional
  step scores (ADR-014, ADR-019), active elapsed times, opened clue IDs and configured weights.
- Anatomy and diagnosis are the means of their stages' scored steps. Speed blends per-step time
  against configured targets with total case time against the case target.
- If a tier has no timer, the speed weight is redistributed proportionally, so the default becomes
  50/50 anatomy and diagnosis.
- An expired advanced countdown keeps the existing per-question timeout behaviour (score zero for
  that step, ADR-030). An expired case clock sets case-level speed to zero but does not end the
  case.
- XP comes from configured case rules through the central pipeline, never from components.

### 3D anatomy boundary

- `src/anatomy3d/three/createAnatomyController.ts` is the only module allowed to import `three`. It
  mirrors the Cornerstone boundary: lazy import, imperative controller, reference-counted model
  cache and explicit disposal.
- New asset type `model` (GLB). An anatomy map document declares the model asset, hierarchy levels
  (labels are configured, for example lung → lobe → segment → structure), structures bound to mesh
  names, and an airway waypoint graph for the fly-through and endoscopic entry.
- Accessibility and motion: a keyboard and list alternative for selecting structures, reduced-motion
  camera cuts instead of animated flights, and visible focus and labels.
- The 3D chunk gets its own bundle-budget role. The entry chunk budget is unchanged.

### Events, state and gamification

- New events: `case_started`, `case_clue_opened`, `case_stage_completed`, `case_completed` (with the
  breakdown) and anatomy interaction events. `question_answered` gains optional active `elapsedMs`.
- Learner state v5 adds bounded per-case attempt history for own-history comparison and migrates
  from v4.
- New badge criteria types for case completions (filtered by tier), component thresholds (for
  example "diagnosis correct with at most N optional clues") and speed.
- New concepts: respiratory anatomy, airway pathophysiology and respiratory diagnosis.

## Checklist

- [x] P10-T00 — Capture the agreed scope, architecture plan, decisions and task breakdown.
- [x] P10-T01 — Asset and 3D feasibility spike: source free lung models, sounds, histology,
      bronchoscopy and illustration assets; verify lobe and airway separation, interior
      (endoscopic) rendering, GLB size, three.js chunk size and mobile frame rate; record provenance;
      go or fallback decision.
- [x] P10-T02 — Case content contract: case document and `caseLab` configuration schemas, clue
      catalogue, stage components, tier presets, manifest wiring, semantic validation, JSON Schema
      export and invalid fixtures.
- [x] P10-T03 — Anatomy map and `model` asset type: hierarchy levels, structure-to-mesh bindings,
      waypoint graph, validation against model metadata and a GLB preparation script.
- [x] P10-T04 — Lazy 3D viewer boundary: orbit, zoom, pan, picking, highlight, fly-through,
      endoscopic camera, list alternative, reduced motion, disposal and budget role.
- [x] P10-T05 — `anatomy_explore` primitive: definition, schema, component, completion, events,
      showcase and gallery entries.
- [x] P10-T06 — `anatomy_locate` primitive: drill-down levels across model, image-region and choice
      inputs, per-level partial credit, review reveal, showcase and gallery entries.
- [x] P10-T07 — Clue-linked feedback: `clueIds` on steps, per-response overrides, validation and
      feedback-panel presentation with a reopen-clue action.
- [x] P10-T08 — Timing: active per-step elapsed time, `elapsedMs` on events and tier timing modes
      (none, stopwatch, countdown).
- [x] P10-T09 — Pure case scoring engine: components, speed blend, clue penalty, weight
      redistribution and configuration.
- [x] P10-T10 — Case session and player: entry views, stage shell, clue board, gating, resume,
      results and compare screens.
- [ ] P10-T11 — Events, pipeline and learner state v5: case events, XP rules, mastery, case badge
      criteria, attempt history and migration.
- [ ] P10-T12 — Case Lab surfaces: Learn section, Home headline card, case intro route and
      developer gallery support.
- [ ] P10-T13 — Daily quick case through the existing challenge rewards.
- [ ] P10-T14 — Autovrse LevelUp branding: name, logo, accent tokens with AA contrast, PWA manifest
      and icons.
- [ ] P10-T15 — Demo content: asthma, COPD and exacerbation cases, the quick case, expert
      benchmarks, badges, concepts and integrated assets with asset-manifest hashes.
- [ ] P10-T16 — QA: automated end-to-end coverage for each case, browser QA across the four target
      viewports, accessibility, motion, performance and 3D memory checks.
- [ ] P10-T17 — Close: architecture, schema, decisions, roadmap, handoff and final gate.

## Sequencing

1. P10-T01 runs first because model availability and interior rendering decide the shape of
   P10-T03 through P10-T06.
2. P10-T02, P10-T07, P10-T08 and P10-T09 do not depend on 3D and can proceed alongside the spike.
3. P10-T03 → P10-T04 → P10-T05/P10-T06 form the 3D track.
4. P10-T10 and P10-T11 integrate both tracks. P10-T12 through P10-T15 build on the integrated
   player.
5. P10-T16 and P10-T17 close the phase.

## Rules

- No case, organ or prospect name appears in runtime code. Cases, clue categories, hierarchy level
  labels, tier presets, weights, penalties, XP and badge thresholds are all configuration.
- New primitives join the registry, the showcase and the parity test (ADR-064). They emit typed
  events and never mutate gamification state.
- `three` is imported only inside `src/anatomy3d/three`.
- Every downloaded asset records its source URL and stated licence in the asset provenance record,
  even though licensing is not a release gate for this internal demo.
- Sample medical content is illustrative and carries the existing educational-only framing.

## Exit criteria

- The three sample cases and the quick case complete start to finish through configured content
  only, including entry view, clues, drill-down localisation, diagnosis, results and compare.
- A fourth case could be added with JSON and assets alone. An automated test loads a fixture case
  without code changes.
- Composite scores, clue penalties, speed and weight redistribution are covered by pure tests and
  appear correctly in results.
- Case badges, mastery and the daily quick case update through the central event pipeline.
- The 3D viewer works across the four target viewports in Chromium with reduced motion and keyboard
  alternatives, and the bundle budgets pass with the new 3D role.
- `npm run check` passes, and the Phase 10 decisions, schema, architecture, roadmap and handoff are
  current.

## Risks

- **Model quality:** free lung models may not separate lobes cleanly or may lack a usable airway
  interior. The agreed fallback stops 3D at lobe depth. If the endoscopic view is not convincing,
  P10-T01 escalates before advanced-tier work starts.
- **Mobile GPU and memory:** 3D rendering has not been tested on physical devices, and the Phase 9
  physical gate is still open. Device evidence for 3D joins that gate.
- **Bundle size:** three.js adds a sizeable lazy chunk. It must not touch the entry budget.
- **Phone UX:** the 3D view, clue board and stage instructions compete for space on 390 px screens
  and need a layout decision in P10-T10.
- **Content volume:** three cases with full clue sets is substantial content work, even with sample
  assets.

## Approved implementation defaults

1. Within a stage, clues can be opened in any order, but the stage's scored steps run in sequence.
2. Without a timer, the speed weight is redistributed (basic tier scores 50/50 anatomy and
   diagnosis).
3. On the advanced tier, the case clock expiring zeroes case-level speed but does not end the case.
4. The default clue penalty is 2 points per optional clue, capped at 10 points out of 100.
5. The daily quick case is a separate short case document of about three minutes, rewarded through
   the existing daily challenge rules.
6. The advanced demo seed includes one prior basic-case attempt so own-history comparison is
   visible on the first demo run.
7. Phase 9 stays open for its physical-device gates while Phase 10 proceeds (ADR-065 is unchanged).
