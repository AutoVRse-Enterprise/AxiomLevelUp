# Agent handoff

## Current phase/task

Phase 6 — DICOM learning viewer. P6-T00 scope and implementation contract are complete; P6-T01 is
next.

## Done

- Phase 5 implemented P5-T00 through P5-T16 and satisfies its exit criteria.
- Phase 5 implementation is committed at `6736a96`.
- One queued learner-event subscriber reduces input events through learning progress,
  gamification and mastery and commits learner state once. Informational output events are retained
  in event history without being reduced again.
- Learner state v3 persists reward idempotency, challenge periods, counters, active-run data,
  activity/question results, a celebration queue and digital rewards. Version 2 snapshots migrate by
  deriving completion/perfect reward ledgers.
- XP is configuration/content driven. First-attempt fractional results award rounded question XP;
  first lesson completion, first perfect result, revision, daily/weekly challenges, weekly goals and
  badge unlocks follow distinct idempotent policies.
- Replaying a completed lesson is a revision. It awards revision XP, updates mastery and qualifies
  for streak/weekly activity without repaying completion or perfect bonuses.
- Stars retain the best configured lesson result. Levels derive from lifetime XP, and the seeded
  weekly leaderboard responds immediately to current-week XP.
- Local-calendar helpers drive streaks, weekly activity, weekly XP rollover and daily/weekly
  challenge periods using the configured week start.
- First-attempt fractional assessment results update concept mastery through configured difficulty
  weights, gain/loss amounts and a bounded history.
- Badges use validated criteria for lesson/course completion, perfect lessons, streaks, weekly goals,
  challenges, first-attempt answers and primitive rewards. Progress is derived rather than stored.
- Weekly challenge progress uses the same criteria contract and resets by week.
- Answer feedback shows XP. Completion shows XP, stars, mastery change, rank change and streak.
- Persisted queued Radix dialogs present badge and level-up rewards with focus management, Escape,
  click dismissal and reduced-motion support.
- Home, Profile, Challenge and Pathway use derived streak, badge and period values.
- Developer controls grant XP, unlock lessons and simulate badges/levels through typed demo events.
- Strict content validation resolves all achievement references and reports five courses, thirteen
  lessons and zero warnings.
- ADR-034 through ADR-039 document the event pipeline, XP/revision policy, criteria, calendar,
  mastery and celebration decisions.
- The quality gate passes with 29 test files and 211 tests.
- Browser QA found no document overflow at 375×812, 812×375, 768×900 or 1280×900. Reward dialogs
  expose an accessible heading/description, focus Continue and reduce motion to 0.001 seconds.
- The production entry is 674.74 kB raw / 204.44 kB gzip, 25.35 / 6.64 kB above Phase 4. The PWA
  precache contains 98 entries totaling 5580.88 KiB.

## In progress

- Phase 6 implementation.

## Next three steps

1. Add the hosted-series manifest, verification and configurable base-URL pipeline.
2. Author calibrated normal-anatomy teaching targets from the curated stack.
3. Add strict DICOM primitive contracts and semantic validation.

## Blockers/questions for the user

- The DICOM technical note referenced by the PRD is still unavailable.
- A production external DICOM host URL must be supplied before hosted deployment; local development
  falls back to `/assets/dicom/`.
- Physical Android Chrome and iOS Safari checks are deferred to Phase 9 by product decision.
- Physical Android Chrome and iOS Safari DICOM/PWA checks require an HTTPS host and devices.

## Environment notes

- Workspace: `d:\c0nsulting\Autovrse\AxiomLevelUp`
- Node: 24.19.0
- npm: 11.17.0
- Package manager: npm
- Install/run: `npm install`, `npm run check`, then `npm run dev`.
- Regenerate schemas with `npm run schema:export`.
- ffmpeg 7.1 and Python 3.11.7 are available for fixture generation.
- Local DICOM setup and attribution are documented in `public/assets/dicom/spike/README.md`.

## Gotchas

- Output reward events are informational. Never feed `xp_awarded`, `badge_unlocked`, `level_up`,
  `stars_awarded`, `streak_updated`, `weekly_goal_met`, `mastery_updated` or `reward_granted` back
  into state reducers.
- `course_completed` remains an input follow-up and relies on the handler's event queue.
- First attempts remain authoritative for question XP, mastery and activity score.
- Lesson reward ledgers prevent duplicate completion/perfect XP; revisions deliberately remain
  repeatable.
- Daily challenges award once per local date. Weekly progress and XP use
  `appConfig.product.weekStartsOn`.
- Badge progress is derived from criteria. Do not add mutable percentage updates to components.
- A primitive reward enters the digital ledger before its matching badge criterion is evaluated.
- Celebration dialogs are suppressed during an active immersive session and appear after completion
  or on an ordinary route.
- Seed period dates are rebased; weekly period anchors use the current local week start.
- Internal showcase progress is ordinary learner state and reset clears it.
- Production still skips only the four deferred DICOM types until P6-T11 removes that filter.
- Do not import Cornerstone outside `src/imaging/cornerstone`; the production boundary is now in
  place and remains dynamically loaded.
- The Phase 4 bundle deviation remains; Phase 5 adds 6.47 kB gzip to the entry.
