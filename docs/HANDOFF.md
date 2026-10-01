# Agent handoff

## Current phase/task

Phase 4 — Standard primitives. P4-T00 through P4-T07 are complete; P4-T08 is next.
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
- Safety content `escalation-order` now uses identified items and answer completion.
- ADR-021, ADR-025 through ADR-029 record player lifecycle, structured assessments, artifact
  viewport, semantic validation, choice semantics and typed-response parsing.
- Type checking, lint, 15 test files with 131 tests, content validation and production build pass.

## In progress

- None.

## Next three steps

1. P4-T08: add the timed-response wrapper and timeout behavior.
2. P4-T09: add zoomable, hotspot and comparison image primitives.
3. P4-T10: add data tables, charts and formula primitives.

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
- Production PWA check: `npm run build`, then `npm run preview`.
- Local DICOM setup and attribution are documented in `public/assets/dicom/spike/README.md`.

## Gotchas

- Every new strict primitive schema must provide typed `assetRefs`; timer-capable types must remain
  in parity with the content-layer compatibility list.
- Existing `case-intro`/`trial-case` (`nodes: []`) and `dose-curve` (no axes) must migrate with
  their strict schemas.
- Definitions, content schemas and lazy components must remain in parity.
- Session version 2 discards in-flight version 1 sessions by design.
- Review re-runs the pure evaluator against the stored response; evaluators must stay deterministic.
- Fill-blank responses are complete blank-ID records; numeric responses are raw strings and never
  parsed by the component.
- Numeric input treats one comma or point as the decimal separator and rejects mixed or repeated
  separators, exponent notation and non-finite values.
- Choice shuffle seeds offset review's submitted-attempt count so option order does not change after
  submission.
- Classification and matching responses are complete source-to-target ID records; ordering
  responses are complete ordered ID arrays. Malformed or incomplete responses score zero.
- Single-item ordering exercises cannot be made unsolved; `ensureUnsolvedOrder` returns them
  unchanged.
- iPhone Safari has no element Fullscreen API; use `ArtifactOverlay`.
- Do not import Cornerstone outside the lazy spike module.
- Development plans display unsupported primitives; production plans skip them.
- Retries do not improve score: first-attempt results remain authoritative.
- XP, stars, mastery and rewards remain deferred to Phase 5.
- `npm run format:check` reports the existing line-ending/style baseline; `npm run check` is the
  required gate.
