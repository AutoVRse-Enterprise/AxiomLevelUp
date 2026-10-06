# Agent handoff

## Current phase/task

The Medical Challenge programme (Phases 14–20, from `newDemoPRD.md`) is planned and documented but
not started. The next task is **P14-T00** in
`docs/phases/phase-14-multi-experience-foundation.md`.

Phase 13 remains Active and independent: P13-T15 is blocked on five qualifying human sessions and
P13-T16 on HTTPS hosting, a production DICOM origin and physical Android/iPhone access. The user
declined a desktop-only waiver on 2026-10-05 (ADR-103). The external Case Lab verdict remains
No-go.

## Done

- Read the full documentation set, the revised demo PRD, the source Sanofi deck and the runtime
  areas the programme touches (router, shell, content loading, schemas, anatomy viewer, image
  hotspot, event pipeline, learner store, service worker, build and test configuration).
- Wrote `docs/MEDICAL_CHALLENGE_PLAN.md`: constraints, gap analysis, target architecture, build
  matrix, game domain model, Respiratory Challenge round design, phase map and dependency graph,
  cross-cutting definition of done, verification strategy, PRD traceability, open questions,
  risks and scope exclusions.
- Wrote phase files 14–20 under `docs/phases/`, each with goal, design, checklist (task IDs
  `P14-T00` onward), exit criteria and risks:
  - 14 multi-experience foundation (`VITE_EXPERIENCE`, `dev:default`, `dev:sanofi`, static
    `@experience` alias, default unchanged);
  - 15 game contract and engine;
  - 16 game player and clinical-call round;
  - 17 spatial rounds (spike first);
  - 18 spot the finding and the full four-round challenge;
  - 19 game hub, results, challenge links, leaderboard, expert runs and You page;
  - 20 polish, vocabulary sweep, accessibility, performance, E2E and readiness.
- Added Phases 14–20 as Planned in `docs/ROADMAP.md`.
- Added ADR-105 (build-time experience selection) and ADR-106 (games as a new content type), both
  Proposed. ADR-107 to ADR-110 are reserved for decisions recorded in Phases 16–19.

## In progress

- Nothing. No runtime source, content or configuration has changed for the programme.

## Next three steps

1. User reviews the plan and answers or accepts defaults for the open questions.
2. P14-T00: capture the default baseline (route table, persisted keys, PWA manifest, bundle sizes,
   golden images) and confirm ADR-105.
3. P14-T01 onward: experience types, mode files and scripts, then the router move with the
   `createAppRoutes` compatibility export.

## Blockers/questions for the user

Open questions from `docs/MEDICAL_CHALLENGE_PLAN.md` §11 (recommended defaults in brackets; none
blocks Phase 14):

1. Player-facing name [app "Medical Challenge", game "Respiratory Challenge", AutoVRse logo].
2. Leaderboard disclosure [small "Demo leaderboard" caption, configurable to hidden].
3. Difficulty playability [all three playable].
4. Additional formats [Quick Challenge and Anatomy Hunt playable; Spot the Finding if three quality
   rounds exist; Clinical Mystery "New soon"].
5. Player name [anonymous "You"; optional name when sharing or joining the leaderboard].
6. Hosting of `dist-sanofi/` [external gate like P13-T16].
7. Default experience scope [default does not register game routes].

Phase 13 blockers are unchanged (participants, HTTPS/DICOM origin, physical devices).

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`; branch `master`. The planning docs, roadmap and
  decision edits, and `newDemoPRD.md`, are uncommitted.
- Node/npm/Playwright: 24.19.0 / 11.17.0 / 1.63.0.
- Browser cache override: `PLAYWRIGHT_BROWSERS_PATH=C:\Users\c0n\AppData\Local\ms-playwright`.
- Serial browser command:
  `$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\c0n\AppData\Local\ms-playwright'; npx playwright test --workers=1`
- `npm run check:demo -- --workers=1` does not pass the worker option through; use the direct
  command above.
- Last full baseline (P13-T14): `npm run check` with 73 files / 500 tests; Playwright 53 passed,
  3 intentional skips; eight desktop golden images pass.
- Planned ports: default dev 5173, sanofi dev 5174, sanofi preview 4174, sanofi E2E 4182 (default
  E2E stays on 4181).
- No development, preview or test processes are running.

## Gotchas

- "Default unchanged" is defined precisely in Phase 14 (routes, navigation, Home, copy, persisted
  keys, PWA manifest, bundle shape, golden images). Any task that needs a default re-baseline must
  stop and ask the user.
- Keep Home eager in the default build; that is why experiences resolve through a static alias, not
  a runtime registry.
- The default experience keeps its legacy IndexedDB/localStorage keys and cache names; only
  non-default experiences are namespaced.
- The thoracic CT fixture shows normal anatomy and must not be used for abnormality spotting.
- `unknown_waypoint` entry and `answerFrom: 'entry'` currently depend on `useCaseReasoningContext`;
  Phase 17 replaces that with a neutral entry context.
- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone` or `three` outside
  `src/anatomy3d/three`.
- Learner-visible sanofi text must never contain "Sanofi" or the PRD §17 LMS vocabulary.
- Playwright uses SwiftShader; it proves the WebGL contract, not hardware GPU performance or
  physical-device behaviour.
