# Phase 5: Gamification and mastery

## Goal

Make XP, levels, stars, streaks, weekly goals, challenge rewards, badges, leaderboard rank and
concept mastery update from real learner events through independent, configuration-driven engines.
Phase 5 ends when lesson and challenge completion visibly update every affected learner surface,
persist across reload and reset to a known seed state.

## Scope

- One ordered learner-event pipeline that composes learning progress, gamification and mastery.
- XP for first-attempt question performance, lesson completion, revision, perfect performance,
  challenges, weekly goals and badges.
- Derived levels, per-lesson stars, local-calendar streaks, weekly activity and weekly XP.
- Deterministic concept mastery with bounded history and weak-topic recommendations.
- Validated badge and weekly-challenge criteria with derived progress.
- Functional completion rewards, answer XP, badge and level-up presentation.
- Current-week leaderboard movement driven by real XP.
- Event-driven developer simulations for repeatable demos.
- Out of scope: DICOM-specific rewards, generated revision sessions, monthly/all-time leaderboards,
  haptics, sound, rich celebration animation and external reward redemption.

### Resolved product decisions

- Completing an already-completed lesson is a revision session. It awards revision XP instead of
  first-completion XP, qualifies for streak and weekly-goal activity and updates mastery.
- Question XP is paid only for a run's first attempt. Lesson completion and perfect bonuses pay once
  per lesson. Daily challenge rewards pay once per local day.
- Phase 5 delivers accessible functional reward UI with reduced-motion-safe transitions. Phase 8
  owns richer motion, haptics and sound.

## Checklist

- [x] P5-T00 — Formalize scope, architecture, decisions, task sequence and PRD traceability.
- [x] P5-T01 — Add strict gamification configuration, criteria contracts, reference validation and
      reconciled badge/challenge content.
- [x] P5-T02 — Add learner state v3, migration, consistent seeds, calendar fields and reset support.
- [x] P5-T03 — Separate typed input/output events and add difficulty, demo and celebration events.
- [x] P5-T04 — Add one ordered pipeline with a single learner-state commit per input event.
- [x] P5-T05 — Add calendar helpers, streak, weekly goal, target reward and weekly XP rollover.
- [x] P5-T06 — Add question, completion, revision, perfect and challenge XP, stars and levels.
- [x] P5-T07 — Add deterministic weighted mastery and bounded history.
- [x] P5-T08 — Add badge criteria, unlocks, reward cascades and the digital reward ledger.
- [x] P5-T09 — Add gamification selectors and derive badge, streak, challenge and rank views.
- [x] P5-T10 — Show XP, stars, mastery and rank changes in feedback and completion.
- [x] P5-T11 — Add accessible queued badge and level-up presentation.
- [x] P5-T12 — Update Home, Profile, Challenge, Pathway and Leaderboard surfaces.
- [x] P5-T13 — Enable event-driven reward simulation tools.
- [x] P5-T14 — Add unit, migration, integration, persistence and boundary coverage.
- [x] P5-T15 — Run responsive, accessibility, reduced-motion and bundle QA.
- [x] P5-T16 — Run the final gate, record ADRs and close Phase 5 documentation.

## Rules

- The event bus accepts typed input events and publishes informational output events.
- A pure pipeline reduces each input event in learning, gamification and mastery order and commits
  one complete state snapshot. Informational output events are never reduced again.
- Reward amounts, thresholds, labels, criteria and mastery weights come from validated content.
- First-attempt activity results remain authoritative for XP, stars and mastery.
- Replays of completed lessons are revisions; they cannot repay first-completion or perfect bonuses.
- Streaks and weekly state use local calendar dates through the injectable clock.
- Badge progress is derived from state and counters. Stored badge state contains unlock time only.
- Primitive components never import the bus, stores or gamification/mastery engines.
- Celebration state is persisted and presented outside active primitive interaction.

## PRD traceability

- Sections 25–32 and 61: P5-T01, P5-T05, P5-T06, P5-T08
- Sections 29–30 and 62: P5-T07
- Sections 33–35: P5-T06, P5-T09, P5-T12
- Sections 36–38: P5-T01, P5-T08, P5-T11
- Sections 39–41: P5-T10, P5-T12
- Sections 43–45: P5-T02, P5-T03, P5-T04, P5-T13
- Sections 79–81: P5-T03, P5-T04, P5-T14

## Exit criteria

- XP, stars, levels, streaks, weekly goals, badges, challenge rewards and mastery update only through
  the event pipeline without double counting.
- No reward amount, threshold, label or badge criterion is hard-coded in a component or engine.
- Revision and repeat-reward policy is deterministic and covered by tests.
- Day/week rollover is correct for streaks, weekly XP, goals and challenge periods.
- Badge progress is derived, unlocks are idempotent and badge XP can trigger one level-up.
- Completion and answer feedback show real rewards; celebrations are accessible and reduced-motion
  safe.
- Home, Profile, Leaderboard, Challenge and Pathway update immediately and after reload.
- Reset restores a known seed and all developer simulations use learner events.
- `npm run check` passes and phase documentation is current.

## Verification

- P5-T00: the implementation plan was reconciled with the Phase 4 handoff, PRD sections 25–45,
  61–62 and 79–81, existing event contracts, learner state, content configuration and surfaces.
- P5-T01 through P5-T04: strict reward/mastery configuration and criteria validate with resolved
  references. Learner state v3 persists reward ledgers, periods, counters, run results and
  celebrations. Typed input events reduce through one queued atomic pipeline; informational output
  events are logged but never reapplied.
- P5-T05 through P5-T08: local-calendar tests cover week boundaries, streak extension/reset and
  weekly rollover. Pipeline tests cover fractional question XP, first completion, revision, perfect
  results, daily challenge periods, stars, level crossings, weighted/clamped mastery, bounded
  history, badge progress, primitive rewards and badge-to-level cascades.
- P5-T09 through P5-T13: selectors derive current streaks, badge progress and challenge periods.
  Answer feedback shows XP, completion shows XP/stars/mastery/rank/streak, and queued Radix dialogs
  present badge and level-up rewards. Home, Profile, Challenge and Pathway consume derived values;
  all developer reward controls emit typed demo commands.
- P5-T14: 29 test files with 211 tests cover the engines, v2-to-v3 migration, persistence/reset,
  event re-entrancy/no-double-counting, rewarded challenge flow, surfaces and import boundaries.
- P5-T15: the development/reward surface had no document-level overflow at 375×812, 812×375,
  768×900 or 1280×900. Badge and level dialogs exposed their heading/description, focused Continue,
  dismissed by Escape/click and reduced animation/transition duration to 0.001 seconds under
  reduced-motion emulation. Profile exposed live mastery and derived badge progress.
- The production entry is 674.74 kB raw / 204.44 kB gzip, an increase of 25.35 / 6.64 kB over the
  Phase 4 entry. The PWA precache contains 98 entries totaling 5580.88 KiB.
- Type checking, lint, 29 test files with 211 tests, content validation and production build pass.
- ADR-034 through ADR-039 record the ordered pipeline, reward/revision rules, derived achievement
  criteria, calendar periods, weighted mastery and celebration queue.

## Deviations

- None.
