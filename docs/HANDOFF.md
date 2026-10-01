# Agent handoff

## Current phase/task

Phase 4 — Standard primitives. P4-T00 through P4-T12 are complete; P4-T13 is next.
Phase file: `docs/phases/phase-04-standard-primitives.md`.

## Done

- Phase 1 foundation, Phase 2 application surfaces and the Phase 3 lesson/challenge runtime remain
  green.
- Primitive definitions are the source of truth for support, family, scoring, layout, review
  prompts, exploration keys and evaluation.
- Fractional first-attempt scoring and activity session v2 support drafts, distinct interactions and
  monotonic media progress.
- The player renders submitted primitives read-only above feedback and applies the configured
  `never`, `final_attempt` or `always` reveal policy; the default is `final_attempt`.
- Draft callbacks persist after a 300 ms debounce and flush before submission, continuation or
  unmount.
- Scenario and media interactions map to typed events, with monotonic milestone de-duplication.
- Feedback supports correct, partial and incorrect states and focuses its heading.
- Step frames expose definition labels, timer content and stacked/split responsive layouts.
- Shared primitive infrastructure now includes a full-viewport Radix artifact overlay,
  `usePanZoom`, pure clamping/zoom/coordinate math and deterministic unsolved shuffling.
- Lesson primitives and challenge items now share strict parsing, scoped primitive-ID checks,
  semantic concept/reward/asset validation and content-layer timer compatibility.
- Typed primitive asset references verify manifest existence and expected type; the manifest now
  supports text assets plus optional MIME type and dimensions.
- Multiple-choice, multiple-select and true/false share native accessible choice controls, draft
  reporting, deterministic per-attempt shuffle and reveal-aware review marks.
- Multiple-select supports all-or-nothing and bounded partial scoring; malformed responses score
  zero, and true/false responses remain booleans through draft and submission.
- Classification and matching use resumable ID assignment records, tap-first interaction,
  reveal-aware review, strict internal references and exact/partial scoring; matching accepts
  right-side distractors and displays stable numbered choices.
- Ordering uses a deterministic unsolved start, delayed pointer/touch drag, sortable keyboard
  sensors, announcements and always-present move controls. Responses are ordered item IDs and
  partial scoring counts exact positions.
- Fill-blank uses exact one-to-one `{{blankId}}` tokens, raw per-blank drafts, NFKC/whitespace
  normalization, configurable case matching and optional select choices.
- Numeric responses stay as raw strings, accept comma or point decimals, reject grouping syntax
  and non-finite values, and evaluate against an answer/tolerance or inclusive range policy.
- Timer-compatible assessments run a fresh timer for each attempt, pause while the document is
  hidden and restart the current item's full timer when a saved activity resumes.
- Timeout submits the current draft with zero score and `timedOut: true`, shows generic feedback and
  follows the same retry/max-attempt policy as an ordinary incorrect response.
- The timer badge exposes `role="timer"`, announces configured thresholds politely and does not use
  motion-dependent presentation.
- Image primitives now share manifest-aware sizing and accessible image interaction: ordinary
  images have annotation controls and a pan/zoom overlay, while zoomable images add bounded
  pointer, pinch, wheel and keyboard navigation with optional labelled regions.
- Image hotspots use normalized circle, rectangle and polygon regions. Explore mode reports each
  region key once; assessment mode persists a normalized marker and evaluates it with pure hit
  testing. Image comparisons support an accessible native slider and responsive side-by-side mode.
- Three original synthetic SVG showcase assets and their provenance are under
  `public/assets/images/showcase`.
- Data tables use strict complete-row schemas, semantic scoped headers, focusable labelled
  horizontal scrolling, sticky first columns, authored units/alignment/emphasis/highlight markers
  and the shared full-screen artifact overlay.
- Native SVG charts support line, bar, scatter and dose-response contracts with required summaries,
  labelled/unit-bearing axes, linear/log/category scales, focusable shape-distinguished points,
  source-table toggles and optional 4PL curves/EC50 markers.
- Formulas lazy-load KaTeX, mhchem and their CSS, render with an untrusted non-throwing runtime
  policy, expose authored labels/variables and receive a strict Node parse during content
  validation.
- Video and audio use native controls and unioned played-range coverage reported in five-percent
  steps. Video includes required captions, marker seeking and formative pause checkpoints; audio
  includes a transcript disclosure.
- Carousels provide two to eight scroll-snap slides, previous/next and dot controls, arrow-key
  navigation and distinct observed slide interactions. PDF citations open native documents with
  `noopener` and optional page fragments.
- Rich text safely tokenizes first terminology occurrences and authored emphasis into React nodes.
  Original synthetic MP4, poster, AAC audio and PDF fixtures plus hand-authored accessibility text
  and provenance are registered in the asset manifest.
- Scenarios use strict context, decision and outcome graphs with content-layer reference,
  acyclicity, terminal-path and reachability validation plus two-to-four-decision warnings.
- The pure scenario engine persists `{ path, current, revealed }`, averages only authored choice
  scores and powers a lazy split-layout UI with locked decisions, announced consequences, outcome
  recaps and best-choice review.
- `case-intro` and `trial-case` are real three-decision converging scenarios, and their lesson
  routes are playable once prerequisites are complete.
- Data interpretation's `dose-curve` now uses positive logarithmic x values, complete axes and a
  fitted 4PL model.
- Safety content `escalation-order` now uses identified items and answer completion.
- ADR-021 through ADR-032 record player lifecycle, scenarios, scientific data, structured
  assessments, artifact viewport, semantic validation, assessment semantics, timed-response
  lifecycle and normalized image regions.
- Type checking, lint, 19 test files with 176 tests, content validation and production build pass.

## In progress

- None.

## Next three steps

1. P4-T13: add the internal showcase course and primitive gallery.
2. P4-T14: add cross-runtime and boundary coverage.
3. P4-T15: run responsive, accessibility and bundle QA.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is not present.
- Real Android Chrome and iOS Safari DICOM/PWA checks still require an HTTPS host and physical
  devices.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Node: 24.19.0
- npm: 11.17.0
- Package manager: npm
- ffmpeg 7.1 and Python 3.11.7 are available for fixture generation.
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Regenerate original media fixtures with `npm run media:fixtures`.
- Production PWA check: `npm run build`, then `npm run preview`.
- Local DICOM setup and attribution are documented in `public/assets/dicom/spike/README.md`.

## Gotchas

- Every new strict primitive schema must provide typed `assetRefs`; timer-capable types must remain
  in parity with the content-layer compatibility list.
- Scenario drafts are `{ path, current, revealed }`; a revealed decision remains locked until its
  consequence is continued, and outcome submission completes the primitive.
- Definitions, content schemas and lazy components must remain in parity.
- Session version 2 discards in-flight version 1 sessions by design.
- Review re-runs the pure evaluator against the stored response; evaluators must stay deterministic.
- Fill-blank responses are complete blank-ID records; numeric responses are raw strings and never
  parsed by the component.
- Numeric input treats one comma or point as the decimal separator and rejects mixed or repeated
  separators, exponent notation and non-finite values.
- Timer state is intentionally not persisted: activity resume restarts the current item timer,
  while retry starts a new full timer and background visibility pauses the current remainder.
- Image regions are normalized to `[0, 1]`; circle bounds, rectangle extents, polygon points,
  duplicate IDs and hotspot target references are rejected during parsing.
- Explore hotspots must use uncapped `explored` completion so every configured region is required;
  assess hotspots must use `answer` completion and persist `{ x, y }` normalized points.
- Timeout is an ordinary zero-score attempt for retry/completion purposes, but is distinguished by
  `lastTimedOut` in the session and `timedOut` on `question_answered`.
- Choice shuffle seeds offset review's submitted-attempt count so option order does not change after
  submission.
- Classification and matching responses are complete source-to-target ID records; ordering
  responses are complete ordered ID arrays. Malformed or incomplete responses score zero.
- Single-item ordering exercises cannot be made unsolved; `ensureUnsolvedOrder` returns them
  unchanged.
- iPhone Safari has no element Fullscreen API; use `ArtifactOverlay`.
- Data-table row cells must cover every declared column exactly once. Log chart values must be
  positive; dose-response x axes are always logarithmic.
- KaTeX CSS and fonts live in the formula lazy chunk; Node content validation intentionally parses
  formula TeX more strictly than the non-throwing learner renderer.
- Media completion is based on the union of native `played` ranges, not `currentTime`; components
  report every crossed five-percent step and the player applies the configured threshold.
- Carousel IntersectionObserver support has scroll/control fallbacks, and every slide ID is reported
  at most once per mount.
- Scenario graph warnings count decisions on every start-to-outcome path; authored demo paths must
  stay within two to four decisions to keep content validation warning-free.
- ADR-027 was already allocated at the P4-T11 baseline, so the media decision is ADR-032.
- Do not import Cornerstone outside the lazy spike module.
- Development plans display unsupported primitives; production plans skip them.
- Retries do not improve score: first-attempt results remain authoritative.
- XP, stars, mastery and rewards remain deferred to Phase 5.
- `npm run format:check` reports the existing line-ending/style baseline; `npm run check` is the
  required gate.
