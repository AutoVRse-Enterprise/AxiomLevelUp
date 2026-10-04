# Phase 13 demo-readiness verdict

**Current verdict:** No-go for an external client demo  
**Local engineering candidate:** Pass  
**Supervised local desktop rehearsal:** Go within the limitations below

## What is ready

- The guided Case Lab implementation is configuration-driven and covers briefing, continuous
  stages, in-flow clues and notes, differential checkpoints, evidence citation, unknown-point
  spatial reconstruction, prioritized results and Model answer comparison.
- Fresh and experienced presenter profiles are resettable from the learner-facing Profile page.
- Recorded-opponent and segmented-leaderboard concepts are explicitly labeled as simulated.
- Automated coverage includes direct component tests, a bridge-free Advanced-case flow, viewport
  prompt/action checks at 1440 × 900 and 375 × 812, and eight desktop golden screens.
- The final local gate passed on 2026-10-05: `npm run check` completed with 73 test files and 500
  tests, and serial Playwright completed with 53 passed, three intentional project skips and zero
  failures.
- A presenter script, attendee handout and recovery steps are available in
  `docs/qa/phase-13-demo-runbook.md`.

## Gates that are not satisfied

1. **Human usability:** five qualifying unaided sessions have not been run, so mission
   comprehension, completion, first-action timing, evidence use and SUS thresholds are not
   measured.
2. **Hosted candidate:** no HTTPS application URL, DICOM URL, hosting account or deployment remote
   is available in this workspace. The exact candidate therefore has not completed hosted
   service-worker, CORS and DICOM preflight.
3. **Physical devices:** no Android device or iPhone is available. A desktop-only-demo waiver has
   not yet been approved.

These are evidence gaps, not claims that automated emulation or a local preview can replace.

## Required approval path

- Run P01–P05 using `docs/qa/phase-13-usability-protocol.md`, enter the observations in
  `docs/qa/phase-13-usability-results.md`, fix any threshold failure and retest it.
- Provide an HTTPS deployment target and production DICOM origin, deploy the frozen build once,
  and complete `docs/qa/phase-09-hosting-prerequisites.md`.
- Test Android Chrome and iPhone Safari using the Phase 9 scripts, or explicitly approve a
  desktop-only-demo waiver and keep all mobile-device claims out of the presentation.
- Reissue this verdict as Go only when every applicable item above has dated evidence.

## Approved scope if a desktop-only waiver is granted

A supervised desktop presentation may demonstrate the product flow and technical architecture.
It may not be described as an unaided-usability pass, a physical-mobile pass, a clinical validation,
or a production deployment.
