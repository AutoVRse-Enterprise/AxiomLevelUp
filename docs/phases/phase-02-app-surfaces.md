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

- [x] P2-T00 — Confirm surface-level acceptance criteria and map every display field to configuration, learner state or a selector.
- [x] P2-T01 — Add the pure selector/view-model layer for course, lesson, pathway, activity, rank, badge and profile states.
- [x] P2-T02 — Add reusable learning components, asset resolution, dynamic route headers and split route modules.
- [x] P2-T03 — Build Home with learner status, continue learning, daily challenge, weak-topic revision, active pathway, recent achievements, leaderboard teaser and weekly activity.
- [x] P2-T04 — Build Learn with pathway and course discovery, progress states, lock states and responsive filtering/grouping.
- [x] P2-T05 — Build the pathway journey with sequence, current position, optional branches, node types and accessible non-visual relationships.
- [ ] P2-T06 — Build course detail with metadata, aggregate progress, lesson states, prerequisites and navigation into the existing immersive route.
- [ ] P2-T07 — Build the challenge landing shell for daily and weekly challenge configuration without implementing the Phase 3 player.
- [ ] P2-T08 — Build the weekly cohort leaderboard with the learner's contextual rank and future-period controls shown as inactive.
- [ ] P2-T09 — Build Profile with learner summary, derived stats, mastery, badge states and weekly activity.
- [ ] P2-T10 — Add responsive, accessibility and route-level tests; validate all empty, locked and partially complete states.
- [ ] P2-T11 — Run the quality gate and update roadmap, handoff and activity documentation.

## Surface data map

- **Configuration:** app/cohort labels, course and lesson metadata, pathway graph, challenge definitions, badge definitions, concepts, leaderboard peers, level thresholds and product display limits.
- **Persisted learner state:** identity, XP, streak, completed learning days, lesson attempts/results, challenge progress, badge progress/unlock dates, mastery and lifetime stats.
- **Derived selectors:** level and next threshold, effective prerequisite locks, course progress/status, current lesson and remaining time, pathway position, recommendations, weekly activity, leaderboard rank/movement, badge views and accuracy.
- **Clock:** greeting period and the current calendar week. Seed activity dates are rebased from their configured `referenceDate` only when a seed is applied.

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
