# Phase 8: Product polish

**Status:** In progress

## Goal

Turn the functionally complete learning runtime into a responsive, accessible, animated,
performant and resilient product. Phase 8 ends when the core learner journeys have intentional
motion, designed loading/empty/error states, polished layouts at every target viewport and
automated accessibility and bundle-budget protection.

## Scope

- Token-driven motion with system and learner reduced-motion control.
- Optional event-driven haptics and lazy celebration effects; no sound.
- Animated answer feedback, XP, progress, rewards, completion and pathway updates.
- Designed boot, primitive, media and DICOM loading states.
- Actionable asset, content, imaging, offline, quota and route error states.
- Consistent empty states across all learner surfaces.
- Desktop navigation, large-screen artifact layouts and landscape immersion.
- Visual hierarchy, spacing, elevation, game-surface and badge refinement.
- Route focus, skip navigation, live announcements and automated axe checks.
- Bundle budgets, route splitting, performance profiling and responsive browser QA.
- Out of scope: dark mode, sound, course-specific UI, physical-device testing and production
  DICOM hosting.

### Resolved product decisions

- Use Motion's `LazyMotion`/`m` boundary and load `canvas-confetti` only when a configured
  celebration needs it.
- Persist motion and haptic preferences as device state, separate from learner progress.
- Drive haptics and celebration effects from typed learner events; primitives remain callback-only.
- Store presentation moments and haptic patterns in validated product configuration while keeping
  durations and easing in design tokens.
- Keep scientific artifacts visually restrained; richer color and motion belong to reward,
  challenge and completion surfaces.

## Checklist

- [x] P8-T00 — Formalize scope, architecture, decisions, task sequence and PRD traceability.
- [x] P8-T01 — Establish bundle, visual and Lighthouse baselines and enforce budgets.
- [x] P8-T02 — Add the motion runtime, tokens, provider and device preferences.
- [x] P8-T03 — Add validated presentation configuration.
- [x] P8-T04 — Add event-driven haptics and Profile experience controls.
- [x] P8-T05 — Add reusable animated-number, loading and notice UI.
- [x] P8-T06 — Animate answer selection, feedback, XP and player transitions.
- [x] P8-T07 — Add staged activity-completion presentation.
- [ ] P8-T08 — Polish badge/level celebrations and persistent XP/streak chrome.
- [ ] P8-T09 — Animate pathway and progress surfaces.
- [ ] P8-T10 — Add route transitions, scroll restoration, focus management and skip navigation.
- [ ] P8-T11 — Add designed boot, primitive, media and DICOM loading states.
- [ ] P8-T12 — Complete all required actionable error states.
- [ ] P8-T13 — Standardize actionable empty states.
- [ ] P8-T14 — Refine desktop, landscape, artifact and text-scaling layouts.
- [ ] P8-T15 — Complete visual and AA-contrast refinement.
- [ ] P8-T16 — Add live announcements and automated accessibility checks.
- [ ] P8-T17 — Profile and enforce runtime and bundle performance.
- [ ] P8-T18 — Complete automated behavior coverage.
- [ ] P8-T19 — Run responsive, reduced-motion, keyboard, offline and Lighthouse browser QA.
- [ ] P8-T20 — Run the final gate, record ADRs and close Phase 8 documentation.

## Rules

- Motion durations and easing live in design tokens; product moments and haptic patterns live in
  validated configuration.
- Every animation follows the resolved motion preference and has an equivalent reduced-motion state.
- Normal motion lasts 150–500 ms. Celebration sequences may be longer and remain dismissible.
- Haptics and confetti subscribe to learner events. Primitives never call device or reward effects.
- Every substantial artifact has a designed loading state without an isolated spinner.
- Every error explains what happened and offers a valid recovery action.
- Large scientific runtimes remain lazy and scientific artifacts retain a serious visual language.

## PRD traceability

- Sections 8–13 and 63–64: P8-T10, P8-T14, P8-T15
- Sections 37, 40–41 and 65–67: P8-T03 through P8-T10
- Sections 68–69: P8-T14
- Section 70: P8-T02, P8-T10, P8-T14, P8-T16, P8-T19
- Section 71: P8-T01, P8-T11, P8-T17, P8-T19
- Section 72: P8-T05, P8-T11
- Section 73: P8-T05, P8-T12, P8-T13
- Sections 79, 81–82: P8-T16 through P8-T20

## Exit criteria

- Answer feedback, XP, progress, badge, level-up, challenge completion and pathway updates animate
  with complete reduced-motion parity.
- All required loading states and all six PRD error cases are designed, actionable and covered.
- Empty states are consistent and guide learners to the next useful action.
- Mobile portrait, mobile landscape, tablet, desktop and 200% text layouts have no document overflow.
- Main navigation, dialogs, player steps and artifacts remain usable with keyboard and visible focus.
- Automated axe checks and the enforced bundle budget pass.
- `npm run check` and Phase 8 browser QA pass and documentation is current.

## Deviations

- Physical Android Chrome and iOS Safari validation remains Phase 9 work.
