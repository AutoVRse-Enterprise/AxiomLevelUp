# Agent handoff

## Current phase/task

Phase 4 — Standard primitives. P4-T00 is complete; P4-T01 is next.
Phase file: `docs/phases/phase-04-standard-primitives.md`.

## Done

- Phase 1 foundation remains green: validated content, IndexedDB learner state, event bus, PWA shell and isolated DICOM spike.
- Phase 2 application surfaces remain configuration-driven and reflect live learner progress.
- Phase 3 delivered the resumable lesson/challenge engine, lazy primitive registry, immediate feedback and event-driven learning progress.
- P4-T00 formalized the approved Phase 4 scope, primitive catalogue, resolved decisions, checklist,
  PRD traceability, architecture constraints and exit criteria.
- `npm run check` last passed with 10 test files and 52 tests (no code changed since).

## In progress

- None. Phase 4 decisions remain confirmed: synthetic ffmpeg media fixtures, lazy KaTeX + mhchem,
  `@dnd-kit` drag for ordering with button/keyboard equivalents, and an internal hidden showcase
  course.

## Next three steps

1. P4-T01: introduce pure primitive definitions and the lazy component map; migrate the three Phase 3 primitives without behavior change.
2. P4-T02: fractional scoring, session v2 drafts/interaction keys and new completion modes; amend ADR-014.
3. P4-T03/T04: review mode, shared artifact infrastructure and validation hardening (challenge items, asset references, unique primitive IDs).

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

- `implementedTypes` in `src/engines/learning/plan.ts` duplicates the component registry until P4-T01 lands.
- Challenge `items` currently bypass `parsePrimitive`; strict Phase 4 schemas do not apply to them until P4-T04.
- Existing `case-intro`/`trial-case` (`nodes: []`), `escalation-order` (string items) and `dose-curve` (no axes) will fail strict schemas; migrate content in the same commit that tightens each schema.
- The player boundary test globs `src/primitives/*Primitive.tsx`; update it when components move.
- Session version 2 will discard in-flight version 1 sessions by design.
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
