# Agent handoff

## Current phase/task

Phase 10 (Case Lab capability demo): P10-T00 planning is approved and complete; P10-T01 is next.
Phase 9 remains open only for its physical Android/iOS gates (P9-M01 through P9-M03).

## Done

- Analysed the prospect's example brief (`docs/reference docs/Sanofi artifact requirement.pdf` plus
  three images sent in chat). The brief is an example of possible requirements, not a contract.
- Agreed the demo scope with the user in three clarification rounds. It is recorded in
  `docs/phases/phase-10-case-lab.md`.
- Accepted ADR-066 through ADR-073: the phase redefinition, case documents, clue-linked feedback,
  composite scoring, the lazy three.js boundary, the anatomy hierarchy and drill-down localisation,
  local attempt comparison and the branding scope.
- Phase 10 roadmap row redefined. No runtime code changed.
- Phase 9 agent-executable work is complete. `npm run check` last passed with 38 test files and 248
  tests.

## In progress

- P10-T01 — asset and 3D feasibility spike: ready to start.
- P9-M01 through P9-M03: physical-device runs not started.

## Next three steps

1. Start P10-T01: source a free lung GLB and clue assets, test lobe separation, endoscopic interior
   rendering, chunk size and frame rate, and record provenance.
2. Begin the non-3D contracts in parallel: P10-T02 (case schema) and P10-T09 (pure scoring engine).
3. Implement P10-T03 and P10-T04 after the spike selects the model and 3D approach.

## Blockers/questions for the user

- Phase 9 still needs physical Android/iOS hardware, a production HTTPS URL and a CORS-capable DICOM
  host.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Branch: `master`
- Node: 24.19.0
- npm: 11.17.0
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Refresh asset integrity metadata with `npm run assets:hash`.
- Local cross-origin QA: `npm run dicom:serve`, set
  `VITE_DICOM_BASE_URL=http://localhost:4174/`, then build/preview on another origin.
- The user has an unrelated staged change to `AGENTS.md`, and `docs/reference docs/` is untracked.
  Phase 10 planning commits must not sweep these in.
- autovrse.com palette observed: `#5C4ACF`, `#8564D4`, `#7E48B7`, accent `#C46DD2`; typography is
  Inter.

## Gotchas

- Never import `@cornerstonejs/*` outside `src/imaging/cornerstone`. Under the Phase 10 plan,
  `three` is likewise restricted to `src/anatomy3d/three`.
- New primitives (`anatomy_explore`, `anatomy_locate`) must be added to the showcase or the parity
  test fails (ADR-064).
- Widening the activity kind to `case` touches plans, sessions, events and learner-state schemas;
  learner state moves to v5 with a migration.
- DICOM binaries remain ignored and outside the application precache.
- `offline-courses-v1` is the only source of verified readiness; `dicom-studies-v1` is best effort.
- A waiting service worker can make a preview tab look stale; activate the update or use a clean
  origin before comparing bundles.
- Motion tests should assert semantic presence unless they explicitly advance animation frames.
- Chromium emulation does not satisfy physical install, pinch, haptic, Safari safe-area,
  memory-pressure or (for Phase 10) 3D GPU acceptance.
