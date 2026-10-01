# Agent handoff

## Current phase/task

Phase 2 is complete. Phase 3 — Core lesson engine — is next; the lesson and challenge player routes remain deliberate immersive placeholders.

## Done

- Phase 1 foundation remains green: validated content, IndexedDB learner state, event bus, PWA shell and isolated DICOM spike.
- Replaced every Phase 1 learner placeholder with Home, Learn, Pathway, Course, Challenge, Leaderboard and Profile surfaces.
- Added pure view selectors for prerequisite locks, continuation, course/pathway progress, weekly activity, revision, rank, badges, stats and level progress.
- Added shared accessible presentation components, content-derived route headers and responsive layouts.
- Added reference-relative seed dates and an injectable clock so reset demo state remains current.
- Added surface intent events and route-level behavior tests. `npm run check` passes with 7 files and 35 tests.

## In progress

- None.

## Next three steps

1. Draft the Phase 3 lesson-engine execution plan from PRD sections 12–14, 40–42 and 59–60.
2. Define lesson session state and completion boundaries without mixing them into persisted aggregate state.
3. Replace the immersive lesson and challenge placeholders with a configured primitive sequence and feedback shell.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is not present.
- Real Android Chrome and iOS Safari DICOM/PWA checks still require an HTTPS host and physical devices.

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
- Seed activity dates shift when a seed is applied; persisted dates intentionally age normally until the next reset.
- At the start of a calendar week, only shifted activity dates within that week count toward the weekly strip.
- Lifetime profile stats intentionally exceed the visible four-course catalog because they represent prior learning history.
- `npm run format:check` currently reports the repository's existing line-ending/style baseline; the required `npm run check` gate is green.
