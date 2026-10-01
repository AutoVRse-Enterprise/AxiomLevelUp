# Agent handoff

## Current phase/task

Phase 3 is complete. Phase 4 — Standard primitives — is next.

## Done

- Phase 1 foundation remains green: validated content, IndexedDB learner state, event bus, PWA shell and isolated DICOM spike.
- Phase 2 application surfaces remain configuration-driven and reflect live learner progress.
- Replaced immersive placeholders with guarded lesson and challenge players.
- Added a pure activity plan, resumable session reducer, completion rules and first-attempt scoring.
- Added a lazy primitive registry with rich text, image, multiple-choice and unsupported fallbacks.
- Added immediate feedback, retry/continue behavior, source display, completion review and protected exits.
- Added an event-driven learning progress reducer for lesson, course, challenge and lifetime aggregates.
- `npm run check` passes with 10 test files and 52 tests.

## In progress

- None.

## Next three steps

1. Draft Phase 4 from PRD sections 15–17 and the primitive showcase requirements.
2. Prioritize standard primitive schemas/evaluators while preserving the Phase 3 registry contract.
3. Add interaction-complete and assessment behavior coverage for each new primitive family.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is not present.
- Real Android Chrome and iOS Safari DICOM/PWA checks still require an HTTPS host and physical devices.
- No product blocker prevents Phase 4.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Node: 24.19.0
- npm: 11.17.0
- Package manager: npm
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Production PWA check: `npm run build`, then `npm run preview`.
- Local DICOM setup and attribution are documented in `public/assets/dicom/spike/README.md`.

## Gotchas

- DICOM binaries are intentionally ignored; the committed manifest and provenance file do not install the local stack.
- The development routes are URL-only and must not be linked from learner navigation.
- Do not import Cornerstone outside the lazy spike module.
- The PWA icon files are excluded from Workbox's glob because vite-plugin-pwa adds manifest icons separately; including both creates conflicting precache entries and breaks service-worker evaluation.
- The DICOM route is a feasibility spike, not the Phase 6 production primitive.
- Development activity plans display unsupported primitives; production plans skip them. Unsupported-only activities remain unavailable.
- Only one incomplete activity session is retained and it is invalidated by activity/version mismatch.
- Retries do not improve score: first-attempt correctness is authoritative.
- XP, stars, mastery and rewards are intentionally not awarded until Phase 5.
- Seed activity dates shift when a seed is applied; persisted dates intentionally age normally until the next reset.
- At the start of a calendar week, only shifted activity dates within that week count toward the weekly strip.
- Lifetime profile stats intentionally exceed the visible four-course catalog because they represent prior learning history.
- `npm run format:check` currently reports the repository's existing line-ending/style baseline; the required `npm run check` gate is green.
