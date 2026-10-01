# Phase 4: Standard primitives

## Goal

Make every non-DICOM primitive in the canonical registry strictly validated, playable, completable
and, where it assesses the learner, deterministically evaluated through the Phase 3 player without
course-specific React. Phase 4 ends when an internal showcase lesson containing every standard
primitive runs from introduction to completion through the real lesson route.

## Scope

- Content primitives: upgraded `rich_text` and `image`, plus `zoomable_image`, `image_hotspot`,
  `image_compare`, `video`, `audio`, `carousel`, `data_table`, `chart`, `formula` and
  `pdf_reference`.
- Assessment primitives: upgraded `multiple_choice`, plus `multiple_select`, `true_false`,
  `classification`, `match_pairs`, `ordering`, `fill_blank`, `numeric` and the timed-response
  wrapper.
- Scenario primitive: branching paths with two to four decision points, consequences and outcomes.
- Supporting contracts: pure per-type definitions, fractional scoring, resumable drafts, keyed
  interactions, review and reveal policies, engine-decided completion and strict validation.
- Runtime proof: migrated placeholder content, an internal showcase course and a development
  primitive gallery.
- Out of scope: Phase 5 gamification, all Phase 6 `dicom_*` primitives, Phase 7 offline media
  delivery, Phase 8 celebration polish, the Phase 9 physical-device matrix, pdf.js rendering,
  authoring tools and adaptive sequencing.

### Primitive catalogue

Completion modes in **bold** are new. "Scored" means the definition supplies an evaluator and the
step contributes to the activity score.

| Type              | Family                | Learner interaction                                          | Default completion          | Scored                         | Key content                                                |
| ----------------- | --------------------- | ------------------------------------------------------------ | --------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `rich_text`       | Content               | Read; activate inline terms for definitions                  | `viewed`                    | No                             | `terms[]` with term and definition                         |
| `image`           | Content               | View; open an in-app pan/zoom overlay; toggle annotations    | `viewed`                    | No                             | Asset-manifest width and height                            |
| `zoomable_image`  | Content               | Pan, zoom, reset and toggle labelled regions                 | `viewed`                    | No                             | `assetId`, `alt`, `regions[]`, `maxZoom`                   |
| `image_hotspot`   | Content or assessment | Reveal regions or locate a target                            | **`explored`** or `answer`  | Assess mode                    | `mode`, normalized regions, `targetRegionIds`              |
| `image_compare`   | Content               | Use a comparison slider or side-by-side view                 | `viewed`                    | No                             | `mode`, `before`, `after`, `initialPosition`               |
| `video`           | Content               | Play, use captions and markers, answer formative checkpoints | **`media_progress`** (0.9)  | No                             | `assetId`, poster, captions, markers, checkpoints          |
| `audio`           | Content               | Play, track progress and read transcript                     | **`media_progress`** (0.9)  | No                             | `assetId`, `transcript`                                    |
| `carousel`        | Content               | Swipe or use previous, next and slide controls               | **`explored`** (all slides) | No                             | Slides with text and optional image; no nested primitives  |
| `data_table`      | Content               | Scroll, inspect highlighted values and open an overlay       | `viewed`                    | No                             | Columns, rows, highlights and caption                      |
| `chart`           | Content               | Inspect points and toggle an accessible table                | `viewed`                    | No                             | Line, bar, scatter or dose-response data; axes and summary |
| `formula`         | Content               | Read rendered scientific expressions                         | `viewed`                    | No                             | TeX expressions with display mode and `ariaLabel`          |
| `pdf_reference`   | Content               | Read a citation card and open the document natively          | `viewed`                    | No                             | `assetId`, citation, summary and optional cover            |
| `multiple_choice` | Assessment            | Select one option                                            | `answer`                    | Yes                            | Options and optional shuffle                               |
| `multiple_select` | Assessment            | Select several options                                       | `answer`                    | Yes, all-or-nothing or partial | Correct IDs, scoring mode and minimum selections           |
| `true_false`      | Assessment            | Choose true or false                                         | `answer`                    | Yes                            | Statement and answer                                       |
| `classification`  | Assessment            | Select an item and place it in a category                    | `answer`                    | Yes, all-or-nothing or partial | Categories and classified items                            |
| `match_pairs`     | Assessment            | Select a left item and then its match                        | `answer`                    | Yes, all-or-nothing or partial | Left and right items, distractors and pairs                |
| `ordering`        | Assessment            | Drag or use keyboard and move buttons to reorder             | `answer`                    | Yes, exact or partial          | Identified items in correct order                          |
| `fill_blank`      | Assessment            | Type or choose an answer for each blank                      | `answer`                    | Yes                            | Tokenized text, accepted answers and optional choices      |
| `numeric`         | Assessment            | Enter a number                                               | `answer`                    | Yes                            | Answer with tolerance or range and unit                    |
| Timed response    | Wrapper               | Complete a compatible assessment before expiry               | Inherited                   | Inherited                      | Existing base `timer` field                                |
| `scenario`        | Domain                | Make sequential decisions and inspect consequences           | `outcome`                   | When choices carry scores      | Start node and context, decision and outcome nodes         |

Existing `correct_order` completion remains an alias of `answer` semantics so exhausted attempts
cannot dead-end an ordering step.

### Resolved user decisions

- Generate synthetic video, audio, caption and PDF fixtures locally with ffmpeg and scripts, and
  document their provenance.
- Render formulas with lazy-loaded KaTeX and mhchem.
- Use `@dnd-kit` drag for ordering in addition to button and keyboard reordering; keep
  classification and matching tap-first.
- Deliver the showcase as an internal, catalog-hidden course through the real lesson route. Its
  progress is real and the demo reset clears it.

## Checklist

- [x] P4-T00 — Formalize the phase scope, catalogue, decisions, task sequence and PRD traceability.
- [x] P4-T01 — Add pure primitive definitions and a lazy component map; migrate the Phase 3
      primitives without behavior changes; derive support from definitions and add parity coverage.
- [x] P4-T02 — Add fractional scoring, scored steps, session v2 drafts and interaction keys,
      exploration/media completion and event payload changes.
- [x] P4-T03 — Add review and reveal behavior, draft persistence, focus management, split layout,
      artifact overlay, pan/zoom and seeded shuffle infrastructure.
- [x] P4-T04 — Harden challenge, primitive-ID, asset-reference, timer and manifest validation and
      regenerate schemas.
- [x] P4-T05 — Add the `multiple_select` and `true_false` choice family plus multiple-choice
      shuffle and review.
- [x] P4-T06 — Add classification, matching and accessible ordering; migrate `escalation-order`.
- [x] P4-T07 — Add fill-blank and numeric typed-response assessments.
- [x] P4-T08 — Add the timed-response wrapper, announcements and timeout behavior.
- [x] P4-T09 — Add zoomable, hotspot and comparison image primitives and upgrade `image`.
- [x] P4-T10 — Add data tables, in-house SVG charts and lazy KaTeX/mhchem formulas; migrate
      `dose-curve`.
- [x] P4-T11 — Add video, audio, carousel and PDF-reference primitives, rich-text terms and
      synthetic media fixtures.
- [x] P4-T12 — Add scenario schemas, graph validation, a pure scenario engine and resumable UI;
      migrate `case-intro` and `trial-case`.
- [x] P4-T13 — Add the internal `runtime-showcase` course and `/dev/primitives` gallery.
- [ ] P4-T14 — Add integration, resume, partial-credit, timeout, production-skip, boundary and
      validation coverage.
- [ ] P4-T15 — Run responsive, keyboard, reduced-motion, contrast and bundle QA.
- [ ] P4-T16 — Run the quality gate, record ADRs and close Phase 4 documentation.

## PRD traceability

- Sections 14 and 49–50: P4-T01, P4-T02, P4-T04
- Sections 15.1–15.5: P4-T09, P4-T11
- Sections 15.6–15.8: P4-T11
- Sections 15.9–15.12: P4-T10, P4-T11
- Section 16: P4-T05 through P4-T08
- Section 17: P4-T12
- Sections 41–43: P4-T02, P4-T03
- Sections 68 and 70–73: P4-T03, P4-T09 through P4-T11, P4-T15
- Sections 75–76: P4-T04, P4-T13
- Lesson-engine acceptance criterion in section 81: P4-T13, P4-T14

## Architecture constraints

- Pure, React-free definitions are the single source for primitive support, family, scoring,
  evaluation, review prompt, completion metadata and layout.
- The content layer owns schemas and asset references and does not import the primitives layer.
- Primitive components receive typed configuration, drafts and callbacks only; they never import
  the event bus, learner store or session store.
- Evaluators, scenario transitions, scoring and completion decisions are pure and deterministic.
- The player emits typed learner events; primitives do not award XP, stars, mastery or rewards.
- Large scientific and interaction dependencies remain in lazy primitive chunks.
- All thresholds, defaults, labels, timer settings and reward-related values come from
  configuration or content.
- Unknown and DICOM primitives continue to follow the Phase 3 unsupported-primitive policy.

## Exit criteria

- Every standard primitive validates strictly, renders, completes and, where scored, evaluates
  deterministically with tests.
- The internal showcase lesson runs from introduction to completion in development and production;
  production skips only DICOM steps.
- Partial credit, review, reveal and timers follow configuration, and first attempts remain
  authoritative.
- Reloading during scenario, ordering, classification or matching restores the draft.
- Existing placeholder content is migrated, `case-intro` and `trial-case` are playable, and content
  validation reports no errors or warnings.
- No primitive imports the bus or stores, and definition, component and primitive-type parity holds.
- Every primitive is keyboard completable, meets AA contrast, supports reduced motion and has no
  horizontal overflow at the four Phase 4 QA viewports.
- KaTeX, drag, chart and media code remain lazy, and entry-chunk growth is recorded.
- `npm run check` passes and phase documentation is current.

## Verification

- P4-T00: phase structure, checklist, catalogue, resolved decisions and PRD traceability were
  reconciled with the approved execution plan.
- P4-T01: strict schemas, typed asset references, pure definitions, typed lazy components,
  definition-driven planning/evaluation and malformed-content fallback are covered by 56 tests.
- P4-T02: normalized fractional evaluation and first-attempt weighted summaries, session v2
  drafts/keyed interactions/media progress, exploration and media completion, answer-compatible
  `correct_order`, and expanded learner events are covered by 62 tests.
- P4-T03: player-owned read-only review, configurable reveal policy, debounced drafts, focused
  partial-aware feedback, labelled stacked/split frames, mapped scenario/media events, milestone
  de-duplication, an in-app artifact overlay, pure pan/zoom coordinate math and deterministic
  unsolved shuffling are covered by 70 tests.
- P4-T04: lessons and challenges share strict primitive and semantic validation with scoped
  primitive-ID uniqueness, typed asset-reference checks, content-layer timer compatibility and
  precise diagnostics; the asset manifest accepts text assets and optional media metadata.
- P4-T05: multiple-choice, multiple-select and true/false share accessible choice/review rendering,
  strict schemas, deterministic shuffle and pure malformed-safe evaluators; partial multiple-select
  scoring subtracts incorrect selections and floors the result at zero.
- P4-T06: classification, matching and ordering have strict semantic references, resumable
  structured drafts, reveal-aware review and malformed-safe exact/partial evaluators. Ordering adds
  deterministic unsolved starts, delayed pointer/touch drag, sortable keyboard controls,
  announcements and always-present move buttons; `escalation-order` uses identified items.
- P4-T07: fill-blank and numeric assessments have strict mutually consistent schemas, resumable raw
  drafts, generic accessible labels and reveal-aware review. Fill-blank evaluation normalizes NFKC
  text and scores each blank; numeric evaluation accepts comma or point decimals without accepting
  grouping, exponent or non-finite syntax.
- P4-T08: timer-compatible assessments use the base timer per attempt, with configured polite
  threshold announcements, hidden-document pausing and full-duration restart on activity resume.
  Expiry submits the current draft at zero score with `timedOut: true` and follows the configured
  retry and max-attempt policy.
- P4-T09: ordinary images use manifest dimensions, annotation controls and the shared pan/zoom
  overlay; zoomable images add bounded wheel, pointer, pinch and keyboard navigation with labelled
  regions. Hotspots support all-region exploration and normalized point assessment against circle,
  rectangle and polygon targets; comparisons provide accessible slider and responsive side-by-side
  modes. Original synthetic SVG fixtures include local provenance.
- P4-T10: strict data tables provide scoped semantic headers, a focusable labelled scroll region,
  sticky first columns, authored alignment/emphasis/highlight markers and artifact expansion.
  In-house SVG line, bar, scatter and dose-response charts use pure scale/tick/4PL functions,
  required summaries, labelled axes, focusable shape-distinguished data and source-table toggles.
  Formula expressions lazy-load KaTeX, mhchem and CSS with safe runtime options, while Node content
  validation rejects invalid TeX. The placeholder dose curve now uses the strict logarithmic
  dose-response contract.
- P4-T11: native video and audio use caption/transcript alternatives and unioned played-range
  coverage reported at five-percent steps. Video adds marker seeking and formative pause
  checkpoints; carousels expose scroll-snap slides, controls, dots, arrow keys and distinct
  observation keys; PDF references open native documents at authored page fragments. Rich text
  tokenizes first term occurrences and emphasis into React text nodes, and original ffmpeg/Node
  fixtures include provenance.
- P4-T12: strict scenario context, decision, choice and outcome schemas feed content-layer graph
  validation for unique IDs, start/transition integrity, acyclicity, outcome termination and
  reachability, with warnings outside the two-to-four-decision target. A pure engine drives
  resumable `{ path, current, revealed }` drafts, scored-choice means and outcome completion; the
  lazy split-layout UI locks decisions, announces consequences, emits typed decision events and
  reviews paths with best choices. Both placeholder scenarios are now three-decision converging
  cases playable through their lesson routes.
- P4-T13: course visibility defaults to learner-facing while `internal` courses remain indexed and
  directly routable. The hidden `runtime-showcase` course contains all 21 standard primitive types
  across 22 ordered examples, and `/dev/primitives` renders those examples with local-only
  interactive, review, disabled, reset and missing-asset controls.
- Type checking, lint, content validation, production build and `git diff --check` pass.
- Runtime verification remains pending for P4-T10 through P4-T16.

## Deviations

The approved sequence named the P4-T11 media decision ADR-027, but ADR-027 was already assigned to
content-layer semantic validation at the required starting commit. The media decision is recorded as
ADR-032 to preserve unique, append-only ADR numbering.

P4-T13 requested ADR-028 when available, but ADR-028 was already assigned to shared choice
assessment semantics at the required starting commit. Internal-course visibility and gallery
isolation are recorded as ADR-033, the next available append-only number.
