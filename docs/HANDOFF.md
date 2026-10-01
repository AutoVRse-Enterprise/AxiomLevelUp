# Agent handoff

## Current phase/task

Phase 4 — Standard primitives. P4-T00 through P4-T05 are complete; P4-T06 is next.
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
- ADR-021, ADR-026, ADR-027 and ADR-028 record player lifecycle, artifact viewport, semantic
  validation and shared choice semantics.
- Type checking, lint, 13 test files with 95 tests, content validation and production build pass.

## In progress

- None.

## Next three steps

1. P4-T06: add classification, matching and accessible ordering.
2. P4-T07: add fill-blank and numeric typed-response assessments.
3. P4-T08: add the timed-response wrapper and timeout behavior.

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
- Existing `case-intro`/`trial-case` (`nodes: []`), `escalation-order` (string items) and
  `dose-curve` (no axes) must migrate with their strict schemas.
- Definitions, content schemas and lazy components must remain in parity.
- Session version 2 discards in-flight version 1 sessions by design.
- Review re-runs the pure evaluator against the stored response; evaluators must stay deterministic.
- Choice shuffle seeds offset review's submitted-attempt count so option order does not change after
  submission.
- Single-item ordering exercises cannot be made unsolved; `ensureUnsolvedOrder` returns them
  unchanged.
- iPhone Safari has no element Fullscreen API; use `ArtifactOverlay`.
- Do not import Cornerstone outside the lazy spike module.
- Development plans display unsupported primitives; production plans skip them.
- Retries do not improve score: first-attempt results remain authoritative.
- XP, stars, mastery and rewards remain deferred to Phase 5.
- `npm run format:check` reports the existing line-ending/style baseline; `npm run check` is the
  required gate.
