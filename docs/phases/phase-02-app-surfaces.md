# Phase 2: Application surfaces

## Goal

Replace the Phase 1 placeholders with polished, responsive product surfaces driven entirely by the validated content registry, persisted learner state and derived selectors.

## Scope

- Home dashboard
- Learn catalog
- Pathway journey
- Course detail
- Daily/weekly challenge shell
- Contextual weekly leaderboard
- Learner profile

The lesson engine, playable challenge flow, reward processing and production DICOM primitives remain in later phases.

## Proposed task outline

- [ ] P2-T00 — Confirm surface-level acceptance criteria and map every display field to configuration, learner state or a selector.
- [ ] P2-T01 — Add reusable course, lesson, progress, badge, stat and activity presentation components.
- [ ] P2-T02 — Build Home with learner status, continue learning, daily challenge, weak-topic revision, active pathway, recent achievements, leaderboard teaser and weekly activity.
- [ ] P2-T03 — Build Learn with pathway and course discovery, progress states, lock states and responsive filtering/grouping.
- [ ] P2-T04 — Build the pathway journey with sequence, current position, optional branches, node types and accessible non-visual relationships.
- [ ] P2-T05 — Build course detail with metadata, aggregate progress, lesson states, prerequisites and navigation into the existing immersive route.
- [ ] P2-T06 — Build the challenge landing shell for daily and weekly challenge configuration without implementing the Phase 3 player.
- [ ] P2-T07 — Build the weekly cohort leaderboard with the learner's contextual rank and future-period controls shown as inactive.
- [ ] P2-T08 — Build Profile with learner summary, derived stats, mastery, badge states and weekly activity.
- [ ] P2-T09 — Add responsive, accessibility and route-level tests; validate all empty, locked and partially complete states.
- [ ] P2-T10 — Run the quality gate and update roadmap, handoff and activity documentation.

## Architecture constraints

- Components render registry/state data; no course-specific content or reward constants belong in React.
- Surface actions emit typed learner events. They do not directly implement Phase 5 gamification.
- Scientific artifacts remain represented as primitives and are not flattened into generic attachments.
- Level, rank and completion stay derived rather than duplicated in persisted state.
- Learner navigation remains absent from immersive lesson and challenge routes.

## Exit criteria

- All Phase 2 routes render useful seeded data without hard-coded course copy.
- Home visibly feels like an established account and includes every PRD-required section.
- Pathway relationships, lock state and current position are understandable visually and to assistive technology.
- Course, challenge, leaderboard and profile surfaces handle seeded and empty states responsively.
- Navigation and primary interactions are keyboard accessible with visible focus.
- Automated tests cover critical data mapping, state variants and route behavior.
- `npm run check` passes and phase documentation is current.
