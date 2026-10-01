# Agent handoff

## Current phase/task

Phase 4 — Standard primitives. P4-T00 through P4-T02 are complete; P4-T03 is next.
Phase file: `docs/phases/phase-04-standard-primitives.md`.

## Done

- Phase 1 foundation remains green: validated content, IndexedDB learner state, event bus, PWA shell and isolated DICOM spike.
- Phase 2 application surfaces remain configuration-driven and reflect live learner progress.
- Phase 3 delivered the resumable lesson/challenge engine, lazy primitive registry, immediate feedback and event-driven learning progress.
- P4-T00 formalized the approved Phase 4 scope, primitive catalogue, resolved decisions, checklist,
  PRD traceability, architecture constraints and exit criteria.
- P4-T01 moved the `rich_text`, `image` and `multiple_choice` schemas into content-owned primitive
  modules with typed asset references.
- Pure definitions now drive primitive support, family, scoring status, layout, review prompt,
  exploration keys and evaluation; lazy typed components live under `src/primitives/components/`.
- The entry-bundle baseline is 595.12 kB raw and 182.85 kB gzip.
- Evaluations and weighted summaries support normalized fractional scores while first attempts
  remain authoritative.
- Activity session v2 stores drafts, distinct interaction keys, monotonic media progress and first
  and latest scores; migration discards version 1 in-flight sessions.
- Completion supports distinct-key `minimum_interactions`, `explored`, configured
  `media_progress`, and answer-compatible `correct_order` semantics.
- Learner events carry fractional/timed answer data, typed artifact context, scenario decisions and
  media milestones.
- Type checking, lint, 11 test files with 62 tests, content validation and production build pass.

## In progress

- None.

## Next three steps

1. P4-T03: add review mode, debounced draft persistence, split layout and shared artifact
   infrastructure.
2. P4-T04: harden challenge-item, asset-reference, timer and unique-ID validation.
3. P4-T05: add multiple-select and true/false assessment primitives.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is not present.
- Real Android Chrome and iOS Safari DICOM/PWA checks still require an HTTPS host and physical devices.

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

- Challenge `items` currently bypass `parsePrimitive`; strict Phase 4 schemas do not apply to them until P4-T04.
- Existing `case-intro`/`trial-case` (`nodes: []`), `escalation-order` (string items) and `dose-curve` (no axes) will fail strict schemas; migrate content in the same commit that tightens each schema.
- Definitions, content schemas and lazy components must remain in parity as new primitives land.
- Session version 2 discards in-flight version 1 sessions by design.
- iPhone Safari has no element Fullscreen API; use the planned in-app overlay.
- DICOM binaries are intentionally ignored; the committed manifest and provenance file do not install the local stack.
- The development routes are URL-only and must not be linked from learner navigation.
- Do not import Cornerstone outside the lazy spike module.
- The PWA icon files are excluded from Workbox's glob because vite-plugin-pwa adds manifest icons separately.
- Development activity plans display unsupported primitives; production plans skip them. Unsupported-only activities remain unavailable.
- Retries do not improve score: first-attempt results are authoritative.
- XP, stars, mastery and rewards are intentionally not awarded until Phase 5.
- Seed activity dates shift when a seed is applied; persisted dates age normally until the next reset.
- `npm run format:check` reports the repository's existing line-ending/style baseline; the required `npm run check` gate is green.
