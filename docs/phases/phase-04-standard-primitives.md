# Phase 4: Standard primitives

## Goal

Make every non-DICOM primitive in the canonical registry strictly validated, playable, completable
and, where it assesses the learner, deterministically evaluated — through the Phase 3 player, with
no course-specific React. Phase 4 ends when an internal showcase lesson containing every standard
primitive runs from intro to completion through the real lesson route.

## Scope

- Content primitives (PRD §15): upgraded `rich_text` and `image`, plus `zoomable_image`,
  `image_hotspot`, `image_compare`, `video`, `audio`, `carousel`, `data_table`, `chart`, `formula`
  and `pdf_reference`.
- Assessment primitives (PRD §16): upgraded `multiple_choice`, plus `multiple_select`, `true_false`,
  `classification`, `match_pairs`, `ordering`, `fill_blank`, `numeric` and the timed-response
  wrapper.
- Scenario primitive (PRD §17): branching, 2–4 decision points, consequences and outcomes.
- Contract upgrades these primitives need: typed per-primitive definitions, fractional (partial
  credit) scoring, resumable in-progress drafts, review mode, answer-reveal policy, engine-decided
  exploration/media completion and stricter content validation.
- An internal showcase course and a development primitive gallery as the runtime QA fixture.
- Migration of the existing placeholder `scenario`, `ordering` and `chart` content to real,
  strictly valid content.

## Out of scope

- XP, stars, levels, mastery, streaks, badges and reward presentation (Phase 5). `scoring.xp`
  remains descriptive event data.
- All `dicom_*` primitives (Phase 6). They stay registered-but-unimplemented and follow ADR-016.
- Course download, media precaching, range-request caching and quota UX (Phase 7).
- Celebration motion, haptics, sound and visual refinement beyond functional state feedback (Phase 8).
- Physical-device matrix and the full 18-item showcase including DICOM (Phase 9).
- pdf.js page rendering, authoring tools, adaptive sequencing, free-form chart building.

## Baseline and gaps found in the Phase 3 code

| Area | Current state | Phase 4 consequence |
| --- | --- | --- |
| Supported types | `implementedTypes` in `src/engines/learning/plan.ts` is separate from the component map in `src/primitives/registry.tsx` | Two lists drift as 16 types are added; unify into one definition source |
| Typed content | Only three types have strict schemas; components re-validate with ad-hoc type guards | Each definition owns its schema; the renderer passes a parsed, typed primitive |
| Scoring | `EvaluationResult.correct` is boolean; summary counts `kind === 'assessment'` only | Partial credit (PRD §16) and scored scenarios need a fractional score and a per-definition `scored` decision |
| Resume | Only submitted `response` is persisted | Mid-scenario, mid-ordering or mid-classification reloads would lose work |
| Feedback | The feedback phase replaces the primitive with `FeedbackPanel` | Structured answers need per-item review in place |
| Interactions | `minimum_interactions` counts every `onInteract` call | Repeated taps on one hotspot or slide would inflate completion |
| Validation | Challenge `items` are never passed through `parsePrimitive`; content asset IDs (`content.assetId`, `imageAssetId`) are not cross-referenced; primitive IDs are not checked for uniqueness within an activity | Strict Phase 4 schemas would be bypassed for challenges; session progress is keyed by primitive ID |
| Content | `case-intro` and `trial-case` scenarios have `nodes: []`; `escalation-order` items are bare strings; `dose-curve` has no axes | All fail strict schemas and must be migrated in the same commit that tightens each schema |
| Media assets | No video, audio, captions or documents in `public/assets` or `assets.json` | Synthetic, provenance-documented fixtures are required; ffmpeg 7.1 is available locally |
| Tests | Boundary test globs `src/primitives/*Primitive.tsx` | Must follow any new primitive folder layout |

## Primitive catalogue

Completion modes in **bold** are new. "Scored" means the definition supplies an evaluator and the
step contributes to the activity score.

| Type | Family | Learner interaction | Default completion | Scored | Key content |
| --- | --- | --- | --- | --- | --- |
| `rich_text` | Content | Read; activate inline terms for definitions | `viewed` | No | + `terms[]` (term, definition) |
| `image` | Content | View; open in-app overlay with pinch/zoom; toggle annotations | `viewed` | No | + `width`/`height` from asset manifest |
| `zoomable_image` | Content | Pan, zoom, reset, overlay; toggle labelled regions | `viewed` | No | `assetId`, `alt`, `regions[]`, `maxZoom` |
| `image_hotspot` | Content or assessment | Explore: reveal region info. Assess: locate a target | **`explored`** / `answer` | Assess mode | `mode`, `regions[]` (circle/rect/polygon, normalized), `targetRegionIds` |
| `image_compare` | Content | Swipe slider or side-by-side | `viewed` | No | `mode`, `before`, `after`, `initialPosition` |
| `video` | Content | Play, captions, chapter markers, formative pause-points | **`media_progress`** (0.9) | No | `assetId`, `posterAssetId`, `captions[]`, `markers[]`, `checkpoints[]` |
| `audio` | Content | Play, progress, transcript | **`media_progress`** (0.9) | No | `assetId`, `transcript` |
| `carousel` | Content | Swipe, previous/next, slide indicators | **`explored`** (all slides) | No | `slides[]` (title, body, optional image) — no nested primitives |
| `data_table` | Content | Horizontal scroll, sticky first column, overlay | `viewed` | No | `columns[]` (unit, emphasis), `rows[]`, `highlights[]`, `caption` |
| `chart` | Content | Inspect points, toggle accessible table | `viewed` | No | `chartType` (line/bar/scatter/dose_response), axes (label, unit, scale), `series[]`, optional 4PL fit, `summary` |
| `formula` | Content | Read rendered expressions | `viewed` | No | `expressions[]` (TeX, display/inline, `ariaLabel`) |
| `pdf_reference` | Content | Read reference card; open document natively | `viewed` | No | `assetId`, citation, `summary`, optional cover |
| `multiple_choice` | Assessment | Select one | `answer` | Yes | + `shuffle` |
| `multiple_select` | Assessment | Select several | `answer` | Yes (all-or-nothing or partial) | `correctOptionIds`, `scoringMode`, `minSelections` |
| `true_false` | Assessment | Choose true or false | `answer` | Yes | `statement`, `answer` |
| `classification` | Assessment | Tap item, then tap category | `answer` | Yes (all-or-nothing or partial) | `categories[]`, `items[]` with `categoryId` |
| `match_pairs` | Assessment | Tap a left item, then its match | `answer` | Yes (all-or-nothing or partial) | `left[]`, `right[]` (distractors allowed), `pairs[]` |
| `ordering` | Assessment | Drag to reorder (`@dnd-kit`), or move up/down by button or keyboard | `answer` | Yes (exact or partial) | `items[]` with IDs in correct order |
| `fill_blank` | Assessment | Type or choose per blank | `answer` | Yes | `text` with `{{blankId}}` tokens, `blanks[]` (accepted answers, case rule, optional choices) |
| `numeric` | Assessment | Enter a number | `answer` | Yes | `answer`, `tolerance` (absolute/percent) or `range`, `unit` |
| Timed response | Wrapper | Countdown on a compatible assessment | Inherited | Inherited | Existing base `timer` field |
| `scenario` | Domain | Sequential decisions with consequences | `outcome` | When choices carry scores | `startNodeId`, `nodes[]` (context/decision/outcome) |

Existing `correct_order` completion is retained as an alias of `answer` semantics so that exhausted
attempts can never dead-end an ordering step.

## Contract design

### Primitive definitions (one source of truth)

Each implemented type gets a pure, React-free definition, and a separate lazy component map:

```text
src/content/schema/primitives/<type>.ts   Zod content schema + semantic refinements
src/primitives/definitions/<type>.ts      definePrimitive({ type, schema, family,
                                            scored(primitive), responseSchema, evaluate,
                                            reviewPrompt, assetRefs, explorableKeys,
                                            layout, timerCompatible })
src/primitives/definitions/index.ts       definition map (engine + loader import this)
src/primitives/components/<Type>.tsx      presentation only
src/primitives/registry.tsx               lazy component map + PrimitiveRenderer
```

- `buildActivityPlan` derives `supported`, `kind` and the new `scored` flag from definitions; the
  hard-coded `implementedTypes` set is removed.
- The loader uses the same schemas for lessons **and** challenge items.
- `PrimitiveRenderer` narrows with the definition schema and passes a typed primitive; a parse
  failure renders the existing fallback rather than throwing.
- A parity test asserts that definitions, components and `primitiveTypes` agree.

### Evaluation and scoring

```ts
interface EvaluationResult {
  score: number                 // 0..1
  correct: boolean              // score === 1
  explanation: string | null
  items?: Record<string, 'correct' | 'incorrect' | 'missed'>
}
```

- Evaluators parse the response with the definition's `responseSchema`; malformed input scores 0.
- `PrimitiveProgress` adds `firstScore` and `lastScore`; the activity score becomes
  `Σ(firstScore × weight) / Σ(weight)` across scored steps. Accuracy counts fully correct first
  attempts. Retries still never improve the score (ADR-014 is amended, not replaced).
- Partial modes: multiple select `max(0, (correct − incorrect selections) / correct options)`;
  classification and matching use the correct-item fraction; ordering uses the fraction of items
  in the correct position.

### Session state version 2

- `PrimitiveProgress` adds `draft` (in-progress interaction state reported by the primitive),
  `interactionKeys` (distinct keys) and `mediaProgress` (0..1).
- Primitives receive `draft` and `onDraftChange`; the player persists drafts (debounced) so a reload
  restores a half-finished scenario path, ordering or classification.
- `minimum_interactions` counts distinct keys. `explored` compares keys with
  `definition.explorableKeys(primitive)`. `media_progress` compares `mediaProgress` with the
  configured threshold. Completion stays a pure engine decision (ADR-015).
- `ACTIVITY_SESSION_VERSION` becomes 2 and version 1 sessions are discarded. Sessions are transient,
  so no learner aggregate is lost.

### Review and answer reveal

- During the feedback phase, the player renders the primitive in read-only `review` mode, with
  per-item results, above `FeedbackPanel`. Focus moves to the feedback heading.
- `feedback.revealAnswer: 'never' | 'final_attempt' | 'always'` controls whether correct answers are
  shown. The default is configured in `product.player` as `final_attempt` so retries are not spoiled.
- The completion summary uses `definition.reviewPrompt(primitive)` instead of assuming
  `content.prompt`.

### Events

- `question_answered` adds `score` and an optional `timedOut`.
- `artifact_interacted` adds `activityKind`, `activityId`, `primitiveType` and a typed interaction
  name. Continuous gestures (pan, zoom, slider) emit one semantic event per gesture, not per frame.
- New: `scenario_decision_made` (primitive, node, choice, decision index) and `media_progressed`
  (25/50/75/100% milestones).
- Primitives still only call props callbacks; the player emits every event.

### Shared infrastructure

- `ArtifactOverlay`: an in-app full-viewport Radix dialog. The element Fullscreen API is not
  available on iPhone Safari, so it is not used.
- `usePanZoom`: pointer, pinch, wheel, keyboard and button control backed by pure, tested transform
  math, which also maps screen points to normalized image coordinates for hotspots.
- Seeded shuffle (`primitiveId` + attempt) so option order is stable across resume and tests, and
  never already solved for ordering.
- Step layout hint `stacked | split`: artifact-heavy primitives and scenarios use an instruction
  pane plus artifact pane at desktop and landscape widths (PRD §68).
- Timer: `StepFrame` shows a countdown for timer-compatible primitives. Expiry submits the current
  response with `timedOut: true`. Resume restarts the item timer. Remaining time is announced at
  configured thresholds, and countdown motion respects reduced motion.

### Content validation additions

- Per-type semantic refinements: referenced option, item, category, region and node IDs exist; IDs
  are unique within a primitive; fill-blank tokens match blank definitions; chart series and table
  rows are shape-consistent; numeric tolerance is non-negative and ranges are ordered.
- Scenario graphs: start node exists; every `next` resolves; the graph is acyclic; every path ends at
  an outcome; no node is unreachable; paths outside 2–4 decisions produce a warning.
- `definition.assetRefs` references are cross-checked against the asset manifest and asset type
  (for example `video` must reference a video asset).
- Primitive IDs are unique within each lesson and challenge.
- The asset manifest adds a `text` type (captions/transcripts) plus optional `mimeType`, `width` and
  `height` for layout-stable placeholders.
- `timer` on a non-timer-compatible primitive is an error.
- Learner-facing strings remain plain text; no HTML or Markdown is injected.

## Checklist

### Milestone A — Contracts

- [x] P4-T00 — Confirm acceptance criteria, contract design, execution order and PRD traceability.
- [ ] P4-T01 — Introduce pure primitive definitions and the lazy component map; migrate
  `rich_text`, `image` and `multiple_choice` with no behavior change; derive plan support from
  definitions; add the parity test and update the boundary-test glob.
- [ ] P4-T02 — Upgrade evaluation, scoring and session contracts: fractional scores, `scored` steps,
  session v2 drafts and interaction keys, `explored`/`media_progress` completion and the event
  payload changes. Amend ADR-014.
- [ ] P4-T03 — Build player and shared infrastructure: review mode, reveal policy, draft
  persistence, focus management, `ArtifactOverlay`, `usePanZoom`, seeded shuffle, split layout and
  definition-provided step labels.
- [ ] P4-T04 — Harden content validation: challenge items, unique primitive IDs, content asset
  references and types, asset manifest extensions and invalid fixtures; regenerate JSON Schemas.

### Milestone B — Assessments

- [ ] P4-T05 — Choice family: `multiple_select`, `true_false`, `multiple_choice` shuffle and review.
- [ ] P4-T06 — Structured family: `classification` and `match_pairs` with tap-first,
  keyboard-equivalent interaction; `ordering` with `@dnd-kit` drag (pointer, touch and keyboard
  sensors, drag handle) plus move buttons; live move announcements; migrate `escalation-order`.
- [ ] P4-T07 — Typed-response family: `fill_blank` (normalization, accepted variants, optional
  choices) and `numeric` (comma or point decimals, tolerance, range, units).
- [ ] P4-T08 — Timed-response wrapper, configured warning thresholds and time-out feedback.

### Milestone C — Scientific content artifacts

- [ ] P4-T09 — Image family: upgraded `image`, `zoomable_image`, `image_hotspot` (explore and
  assess with a keyboard crosshair) and `image_compare`; author SVG fixtures.
- [ ] P4-T10 — Data family: `data_table`, `chart` (in-house SVG, linear/log axes, 4PL dose-response
  curve, accessible table toggle) and `formula` (lazy KaTeX with mhchem); migrate `dose-curve`.
- [ ] P4-T11 — Media and reference family: `video`, `audio`, `carousel`, `pdf_reference` and
  `rich_text` terms; add a script that generates synthetic media, captions and document fixtures
  with provenance.

### Milestone D — Scenario

- [ ] P4-T12 — Scenario schema and graph validation, a pure scenario engine (transitions and path
  scoring), consequence/outcome UI with draft resume and split layout; author real `case-intro` and
  `trial-case` scenarios.

### Milestone E — Showcase and verification

- [ ] P4-T13 — Internal `runtime-showcase` course containing every standard primitive (hidden from
  learner surfaces, linked from `/dev`) and a `/dev/primitives` gallery that renders each primitive
  in default, review, disabled and error states without emitting events.
- [ ] P4-T14 — Integration coverage: showcase play-through, mid-interaction resume, partial-credit
  summary, time-out, production DICOM skipping, extended boundary and content-validation tests.
- [ ] P4-T15 — Browser QA at 375 × 812, 812 × 375, 768 × 900 and 1280 × 900; keyboard-only and
  reduced-motion runs; contrast checks; bundle audit.
- [ ] P4-T16 — Run the quality gate and close Phase 4 documentation.

## Task detail

### P4-T01 — Primitive definitions

- **Files:** `src/content/schema/primitives/*`, `src/content/schema/index.ts`,
  `src/primitives/definitions/*`, `src/primitives/components/*` (moved from `src/primitives/*Primitive.tsx`),
  `src/primitives/registry.tsx`, `src/primitives/evaluators.ts` (removed),
  `src/engines/learning/plan.ts`, `src/player/player.test.tsx`.
- **Tests:** parity test; existing 52 tests unchanged in behavior.
- **Commit:** `refactor(P4-T01): unify primitive definitions`.

### P4-T02 — Scoring and session v2

- **Files:** `src/primitives/types.ts`, `src/engines/learning/{session,completionRules,plan,sessionStore,progress}.ts`,
  `src/events/types.ts`, `src/player/ActivityPlayer.tsx`, `src/content/schema/index.ts`.
- **Tests:** weighted partial scores; retries not improving `firstScore`; distinct-key counting;
  `explored` and `media_progress`; v1 session discarded; event payload typing.
- **ADR:** ADR-014 amendment; session v2 draft persistence.

### P4-T03 — Player infrastructure

- **Files:** `src/player/{ActivityPlayer,StepFrame,FeedbackPanel,CompletionSummary}.tsx`,
  `src/components/artifact/{ArtifactOverlay,usePanZoom,panZoomMath}.ts(x)`, `src/lib/seededShuffle.ts`,
  `public/content/app-config.json` (`revealAnswer`, timer thresholds).
- **Tests:** pan/zoom math and coordinate mapping; shuffle determinism; review mode rendering;
  reveal policy matrix; focus after submit.

### P4-T04 — Validation hardening

- **Files:** `src/content/loader.ts`, `src/content/schema/index.ts`, `public/content/assets.json`,
  `public/content/fixtures/*`, `schemas/**`, `docs/CONTENT_SCHEMA.md`.
- **Tests:** challenge item errors reported with JSON paths; duplicate primitive IDs; missing and
  type-mismatched asset references.

### P4-T05 to P4-T12 — Primitive families

Each family task delivers, for every type in the family:

1. A strict content schema with semantic refinements and an exported JSON Schema.
2. A pure evaluator with table-driven tests (scored types), including malformed responses.
3. A presentation component with default, disabled, review and missing-asset states.
4. Keyboard operation, visible focus, labelled controls, live announcements and reduced motion.
5. Component tests for the submitted payload, draft reporting and review rendering.
6. Content migration for any existing placeholder of that type in the same commit.
7. An activity-log entry and a Conventional Commit, for example `feat(P4-T06): add structured assessments`.

### P4-T13 — Showcase

- `Course` gains `visibility: 'learner' | 'internal'` (default `learner`). Learn, Home, Pathway,
  Course and Profile selectors exclude internal courses; the lesson route and `/dev` still reach them.
- The showcase lesson runs through the real `ActivityPlayer` and records real progress, which the
  demo reset clears. Phase 9 appends the DICOM steps.

## Sequencing

```text
A: T01 → T02 → T03 → T04
                     │
B:                   ├→ T05 → T06 → T07 → T08
C:                   ├→ T09 → T10 → T11        (independent of B; can interleave)
D:                   └→ T12                   (needs T02 drafts and T03 split layout)
E: T13 → T14 → T15 → T16                       (after B, C and D)
```

If schedule pressure appears, `pdf_reference` and video checkpoints are the first items to trim. Both
are PRD low priority.

## PRD traceability

- §14, §49–50 (primitive contract, unknown handling): P4-T01, P4-T02, P4-T04
- §15.1–15.5 (text and image family): P4-T09, P4-T11
- §15.6–15.8 (video, audio, carousel): P4-T11
- §15.9–15.12 (table, chart, formula, PDF): P4-T10, P4-T11
- §16 (assessments, timed response): P4-T05 to P4-T08
- §17 (scenario): P4-T12
- §41–43 (feedback, explanation, interaction history): P4-T02, P4-T03
- §68, §70–73 (responsive, accessibility, performance, loading, errors): P4-T03, P4-T09 to P4-T11, P4-T15
- §75–76 (showcase lesson, validation): P4-T04, P4-T13
- §81 lesson-engine acceptance (all required non-DICOM primitives execute start to finish): P4-T13, P4-T14

## Architecture constraints

- Definitions are pure TypeScript; engines and the loader never import React components.
- Primitive components receive typed configuration, draft and callbacks only. They never import the
  event bus, learner store or session store.
- Evaluators and the scenario engine are pure and deterministic, given primitive, response and seed.
- Completion is decided by engine rules from reported interactions, never by a primitive alone.
- No XP, stars or mastery are calculated or displayed.
- Large dependencies (KaTeX, `@dnd-kit`, chart code, media components) live in lazy primitive
  chunks only.
- All thresholds, defaults and timer settings come from app configuration or content.

## Testing strategy

- **Unit:** schemas (valid, invalid, semantic), evaluators, scoring, completion modes, scenario
  engine, pan/zoom math, hit testing, numeric parsing, text normalization and shuffle.
- **Component:** each primitive's interaction, payload, draft, review and disabled states via
  Testing Library. jsdom lacks media and layout APIs, so `HTMLMediaElement` and geometry are stubbed
  and gesture behavior is verified in the browser.
- **Integration:** the showcase lesson through the lesson route; resume; production plan.
- **Architecture:** primitives import no bus or store modules; definition, component and type parity.
- **Browser:** responsive widths including landscape, keyboard-only completion, reduced motion and
  a bundle audit comparing entry-chunk size with the Phase 3 baseline.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Breadth: 19 primitive types plus contract changes | Contracts first; families share infrastructure; low-priority items are named for trimming |
| iOS Safari: no element fullscreen, inline video, pinch conflicts | In-app overlay, `playsinline`, `touch-action` scoped to artifact surfaces, landscape QA |
| Event-history flooding from continuous gestures | Semantic, per-gesture interactions; keyed completion |
| KaTeX fonts enlarge the precache | Lazy chunk; measure in P4-T15; Phase 7 owns offline asset policy |
| Touch drag conflicts with page scrolling on mobile | Drag handle only, touch activation delay/tolerance, `touch-action` on the handle; move buttons always available |
| jsdom cannot exercise media and gestures | Pure-function tests plus documented browser QA |
| Session v2 discards in-flight v1 sessions | Acceptable for transient state; documented in the ADR and handoff |
| Authored scenario and showcase copy could be mistaken for clinical guidance | Educational demo framing; sources shown where cited; no patient data |

## Planned ADRs

- ADR-018: Primitive definitions are the single source of support, schema and evaluation.
- ADR-019: Fractional first-attempt scores and partial-credit modes (amends ADR-014).
- ADR-020: Session version 2 persists primitive drafts and distinct interaction keys.
- ADR-021: Review mode and configurable answer reveal.
- ADR-022: Scenario graph model, convergence and path scoring.
- ADR-023: In-house SVG charts.
- ADR-024: Lazy KaTeX with mhchem for scientific notation.
- ADR-025: `@dnd-kit` drag for ordering with button/keyboard equivalents; tap-first classification
  and matching.
- ADR-026: In-app artifact overlay instead of the Fullscreen API.
- ADR-027: Formative embedded media questions and a native-open PDF reference.
- ADR-028: Internal course visibility for the showcase.
- ADR-029: Timed-response semantics.

## Resolved decisions (confirmed by the user on 2026-10-01)

1. **Media fixtures:** synthetic video, audio, captions and PDF generated locally with ffmpeg and
   scripts, with provenance notes.
2. **Formula rendering:** lazy-loaded KaTeX with mhchem.
3. **Drag and drop:** add `@dnd-kit` drag for `ordering` now, on top of button and keyboard
   reordering. Classification and matching remain tap-first.
4. **Showcase delivery:** an internal hidden course through the real lesson route, recording real
   progress that the demo reset clears.

## Exit criteria

- Every standard primitive validates strictly, renders, completes and, where scored, evaluates
  deterministically with tests.
- The internal showcase lesson executes from intro to completion in development and production
  builds; production plans skip only the DICOM steps.
- Partial credit, review, reveal policy and timers behave as configured; first attempts remain
  authoritative.
- Reloading during a scenario, ordering, classification or match restores the draft.
- Existing placeholder content is migrated; `npm run validate:content` reports no errors or warnings.
- `case-intro` and `trial-case` become playable.
- No primitive imports the bus or stores; the parity test passes.
- Every primitive can be completed by keyboard alone, with AA contrast and reduced-motion support,
  and without horizontal overflow at the four QA viewports.
- KaTeX, chart and media code load only in lazy chunks; growth of the entry chunk is recorded.
- `npm run check` passes and phase documentation is current.

## Verification

Pending.

## Deviations

None yet.
