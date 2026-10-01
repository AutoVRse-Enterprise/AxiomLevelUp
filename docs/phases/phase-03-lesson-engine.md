# Phase 3: Core lesson engine

## Goal

Run a configured lesson or daily challenge from introduction through ordered primitives, immediate
feedback and completion while keeping in-flight session state separate from aggregate learner state.

## Scope

- Lesson and daily-challenge activity plans
- Resumable activity sessions, progression and completion rules
- Rich text, image and multiple-choice rendering
- Immediate assessment feedback, retries and missed-question review
- Event-driven lesson, course and challenge progress
- Graceful unsupported-primitive handling

XP, stars, mastery, streaks and rewards remain in Phase 5. Additional standard primitives remain in
Phase 4 and DICOM primitives remain in Phase 6.

## Checklist

- [x] P3-T00 — Confirm acceptance criteria, execution boundaries and PRD traceability.
- [x] P3-T01 — Type the primitive completion, scoring and feedback contracts and player defaults.
- [x] P3-T02 — Build the pure activity plan builder for lessons and challenges.
- [x] P3-T03 — Build the pure session reducer, completion rules and summary selectors.
- [x] P3-T04 — Persist one versioned, resumable activity session outside learner aggregate state.
- [x] P3-T05 — Extend the learner-event taxonomy for player lifecycle and outcomes.
- [x] P3-T06 — Apply learning events to lesson, course, challenge and lifetime progress.
- [x] P3-T07 — Add the primitive registry and Phase 3 primitive renderers.
- [x] P3-T08 — Build the accessible player shell, feedback and completion summary.
- [x] P3-T09 — Replace immersive placeholders with guarded lesson and challenge routes.
- [x] P3-T10 — Add representative content and player fixtures.
- [ ] P3-T11 — Add unit, component and route integration coverage plus responsive browser QA.
- [ ] P3-T12 — Run the quality gate and close Phase 3 documentation.

## PRD traceability

- Sections 12–14: P3-T02, P3-T03, P3-T07, P3-T08
- Sections 40–43: P3-T05, P3-T06, P3-T08
- Sections 49–50: P3-T01, P3-T02, P3-T07
- Sections 59–60: P3-T02 through P3-T09
- Lesson-engine acceptance criterion: P3-T09 through P3-T12

## Architecture constraints

- Primitive components receive data and callbacks; they never import the event bus or learner store.
- Pure evaluators determine primitive results; the player emits typed learner events.
- In-flight session state is persisted separately from aggregate learner progress.
- The learning engine does not calculate or award XP, stars, mastery, streaks or badges.
- Unsupported primitives never crash or silently complete an otherwise unplayable activity.

## Exit criteria

- The configured `thoracic-ct` lesson and daily challenge execute from intro to completion.
- Immediate feedback follows configured retry and attempt settings without dead-ending progress.
- Reloading mid-activity offers resume; completion updates status, best score, attempts and statistics.
- Course, pathway and home selectors reflect newly completed and unlocked learning.
- Unsupported primitives follow the documented development and production fallback policy.
- The player is keyboard operable with visible focus, live feedback and reduced-motion support.
- `npm run check` passes and phase documentation is current.
