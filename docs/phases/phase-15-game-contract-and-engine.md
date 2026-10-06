# Phase 15: Game contract and engine

**Status:** Planned

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phase 14.

## Goal

Make games first-class validated content and build the pure engine that runs them. A **round** is
a reusable document that wraps one or more existing primitives with a mechanic template, clues,
feedback, time limits, answer pools and difficulty overrides. A **game** orders round slots, and
each slot picks from a pool of rounds. App configuration declares difficulties, scoring, copy,
formats, result messages, leaderboard rows and expert runs. The engine plans a seeded run, scores
each round, summarises the result, encodes share links and emits typed events into the central
pipeline. No UI is built in this phase.

## Why a new content type instead of reusing cases

Case documents model a staged clinical investigation (mission, four stage kinds, clue workspace,
differential checkpoints, evidence citation, Model answer, debrief). A game round needs one
decision, an instant reveal, points and a speed bonus. Forcing that into cases would either
weaken case validation or leak case concepts into the game. Rounds and games therefore get their
own schemas and engine while reusing the shared primitive schemas, primitive definitions,
evaluators, seeded shuffle, anatomy maps and event pipeline. Recorded as ADR-106.

## Vocabulary

| Internal term      | Player-facing term | Meaning                                                              |
| ------------------ | ------------------ | -------------------------------------------------------------------- |
| game               | Challenge          | An ordered set of round slots, e.g. the Respiratory Challenge        |
| format             | Game format        | A hub card that points to a game (Quick Challenge, Anatomy Hunt)     |
| round              | Round              | One decision built from primitives                                   |
| mechanic           | (not shown)        | Reusable round template: `spatial_look`, `spatial_explore`, …       |
| run                | Game               | One seeded play-through with a difficulty                            |
| difficulty         | Difficulty         | Warm-up, Challenge, Expert presets                                   |
| clue               | Clue               | Optional supporting content inside a round                           |

## Content contracts (sketches)

### Round document (`round` 0.1)

```json
{
  "schemaVersion": "0.1",
  "id": "airway-drop-look",
  "title": "Where are you?",
  "mechanic": "spatial_look",
  "anatomyMapId": "respiratory-game-map",
  "intro": "You've been dropped inside an airway. Look around.",
  "timeLimitSeconds": 40,
  "drop": {
    "pools": {
      "warmup": ["carina", "right-main-airway", "left-main-airway"],
      "challenge": ["right-upper-airway", "right-lower-airway", "left-lower-airway"],
      "expert": ["right-lower-posterior-basal-segment", "left-lower-lateral-basal-airway"]
    }
  },
  "primitive": { "type": "anatomy_locate", "content": { "navigation": "look", "answerFrom": "entry",
    "levels": ["…side, region and airway-level choice levels…"] } },
  "clues": [],
  "feedback": {
    "correct": "The branching pattern and airway diameter were the main clues.",
    "incorrect": "The orientation of the branching pattern was the strongest clue.",
    "answerTemplate": "Correct answer: {answer}."
  },
  "difficulty": {
    "expert": { "timeLimitSeconds": 30 }
  }
}
```

### Game document (`game` 0.1)

```json
{
  "schemaVersion": "0.1",
  "id": "respiratory-challenge",
  "title": "Respiratory Challenge",
  "tagline": "Four rounds. One airway. How sharp is your eye?",
  "organSystem": "respiratory",
  "estimatedSeconds": 180,
  "slots": [
    { "id": "r1", "pool": ["airway-drop-look"], "pick": 1 },
    { "id": "r2", "pool": ["airway-explore-a", "airway-explore-b"], "pick": 1 },
    { "id": "r3", "pool": ["histology-mucus-spot"], "pick": 1 },
    { "id": "r4", "pool": ["clinical-call-t2"], "pick": 1 }
  ],
  "difficulties": ["warmup", "challenge", "expert"],
  "defaultDifficulty": "challenge"
}
```

Manifest fields: `rounds: string[]` and `games: string[]` (both `.default([])`). The registry adds
`roundById`, `gameById` and resolved anatomy maps.

### App configuration (`games` block)

```json
"games": {
  "difficulties": [
    { "id": "warmup", "label": "Warm-up", "timeMultiplier": 1.5, "maxMoves": 5, "freeClues": 3,
      "clueCostPoints": 50, "speedBonus": true, "optionSet": "standard" },
    { "id": "challenge", "label": "Challenge", "timeMultiplier": 1, "maxMoves": 3, "freeClues": 2,
      "clueCostPoints": 100, "speedBonus": true, "optionSet": "standard" },
    { "id": "expert", "label": "Expert", "timeMultiplier": 0.75, "maxMoves": 2, "freeClues": 1,
      "clueCostPoints": 150, "speedBonus": true, "optionSet": "similar" }
  ],
  "scoring": {
    "roundMaxPoints": 1000,
    "speedBonuses": [
      { "maxFractionOfLimit": 0.25, "points": 150, "label": "Lightning bonus" },
      { "maxFractionOfLimit": 0.5, "points": 100, "label": "Fast answer bonus" }
    ],
    "minAccuracyForSpeedBonus": 0.5,
    "correctThreshold": 0.8,
    "proximity": { "exact": 1, "sameSegment": 0.85, "sameLobe": 0.6, "sameSide": 0.25, "none": 0 }
  },
  "messages": [
    { "when": { "minCorrect": 4 }, "text": "Sharp eye. Strong finish." },
    { "when": { "minCorrect": 3, "lastRoundCorrect": false }, "text": "Almost perfect. One clue got you." },
    { "when": { "minCorrect": 3 }, "text": "You know your airways." },
    { "when": {}, "text": "Good run. Ready for a rematch?" }
  ],
  "copy": { "lockIn": "Lock in", "nextRound": "Next round", "correct": "Correct",
            "incorrect": "Not quite", "seeResult": "See your score" },
  "formats": [],
  "leaderboard": { "entries": [], "disclosure": "Demo leaderboard" },
  "expertRuns": [],
  "historyLimit": 20
}
```

Formats, leaderboard rows and expert runs are filled in Phases 18–19; their schemas land here.

## Engine design (`src/engines/games/`)

All modules are pure, framework-free and deterministic.

| Module          | Responsibility                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `mechanics.ts`  | Mechanic templates: allowed primitive types, required content fields, accuracy source, timeout policy, presentation hints.    |
| `plan.ts`       | `planRun(game, rounds, difficulty, seed)`: pick rounds per slot, pick drop points, apply difficulty and per-round overrides.  |
| `seed.ts`       | Seed creation, daily seed (`gameId` + local date), deterministic picks via `src/primitives/shared/seededShuffle.ts`.         |
| `scoring.ts`    | Accuracy → base points, speed bonus tiers, clue costs, floor at zero, correct/incorrect classification, run totals.          |
| `proximity.ts`  | Hierarchy proximity for spatial answers using anatomy-map parent chains and waypoint `answerIds`; organ-agnostic.            |
| `session.ts`    | Run reducer: `start`, `roundStarted`, `clueRevealed`, `draftChanged`, `submitted`, `timedOut`, `revealed`, `next`, `complete`. |
| `results.ts`    | Summary (total, correct count, total seconds, best round, difficulty), message rule matching, round strip view model.         |
| `links.ts`      | Challenge-link codec: versioned base64url payload `{v, gameId, difficulty, seed, from, score}` with a checksum.               |
| `leaderboard.ts`| Merge configured rows with the player's bests by period and difficulty; rank and highlight.                                   |
| `progress.ts`   | Pipeline reducer applying game events to learner state.                                                                       |

### Scoring model

`roundPoints = max(0, round(roundMaxPoints × accuracy) + speedBonus − clueCosts)`

- `accuracy` comes from the primitive evaluator score (0–1), from proximity for spatial mechanics
  or from tap precision for `spot_finding`.
- `speedBonus` is the first configured tier whose `maxFractionOfLimit` the elapsed time satisfies,
  only when `accuracy ≥ minAccuracyForSpeedBonus` and the difficulty enables it.
- `clueCosts` counts paid clues revealed before submission.
- A round is **Correct** when `accuracy ≥ correctThreshold`.
- Worked example: accuracy 0.85, answered at 40% of the limit, no paid clues →
  `850 + 100 = 950`, shown as **+850** and **Fast answer bonus +100**.

Elapsed time excludes the reveal and any paused state (app backgrounded), reusing the
active-elapsed approach in `src/player/useActiveElapsed.ts` at the player layer.

### Proximity model

Each drop candidate resolves to an answer path, for example
`{ side: right, lobe: right-lower-lobe, segment: posterior-basal, airwayLevel: segmental }`.
A guess is compared from the deepest level upward, and the configured proximity table maps the
deepest matching level to accuracy. The implementation reads level order from the anatomy map, so
another organ map works without code changes.

### Events (added to `src/events/types.ts`)

| Event                 | Payload (summary)                                                                 |
| --------------------- | --------------------------------------------------------------------------------- |
| `game_opened`         | `gameId`, `source: 'hub' | 'link' | 'expert' | 'daily'`                           |
| `game_started`        | `gameId`, `runId`, `difficulty`, `seed`, `challengeToken?`                       |
| `game_round_started`  | `runId`, `slotId`, `roundId`, `mechanic`                                         |
| `game_clue_revealed`  | `runId`, `roundId`, `clueId`, `paid`, `cost`                                     |
| `game_round_answered` | `runId`, `roundId`, `accuracy`, `correct`, `points`, `speedBonus`, `elapsedMs`, `timedOut` |
| `game_completed`      | `runId`, `gameId`, `difficulty`, `seed`, `total`, `correctCount`, `durationSeconds`, `roundResults`, `challengeToken?` |
| `game_abandoned`      | `runId`, `slotIndex`                                                              |
| `game_shared`         | `runId`, `channel: 'native' | 'copy' | 'mock'`                                   |
| `game_challenge_opened` | `token`, `fromName`, `targetScore`                                             |

Primitive interactions inside a round are still emitted as `artifact_interacted` with
`activityKind: 'game'` (extend `EventActivityKind`).

### Learner state v9

- Add `games: Record<gameId, { plays, bestTotal, bestByDifficulty, lastPlayedAt, history[] }>`
  (bounded by `historyLimit`), `gameDaily: { lastPlayedDate, streakDays }` and
  `player: { displayName: string | null }`.
- `migrateLearnerState` defaults the new fields; v5–v8 case attempts remain readable. Seeds gain
  the optional fields.
- The pipeline calls `applyGameProgressEvent` alongside the existing reducers. Run IDs make
  completion idempotent (ledger keyed by `runId`). Game events award no XP unless
  `games.xp` is configured; the sanofi configuration omits it.

### Run session store

A separate persisted `game-session` store (scoped key) holds the active run so a doctor who
switches apps can continue. It is distinct from `activity-session` so lesson and case sessions are
untouched.

## Semantic validation

- Round primitive type is allowed by its mechanic; mechanic-required fields are present.
- Anatomy map exists; every drop candidate exists, is reachable under the round's movement rule
  (Phase 17) and has `answerIds` for every answer level.
- Clue IDs are unique; clue primitives are valid content primitives; paid/free counts are
  satisfiable for every difficulty.
- Every game slot pool references existing rounds; `pick` ≤ pool size; slot IDs unique.
- Every difficulty referenced by a game exists in configuration; per-round overrides reference
  known difficulties and only override allowed fields.
- Feedback templates resolve their placeholders.
- Timing: the sum of slot time limits at each difficulty, plus a configured reveal allowance,
  falls within the game's declared window; outside 120–240 seconds produces a warning.
- Answer leakage: round intros, prompts and free clues must not contain the label of the correct
  answer for that round (reuse the Case 0.2 leak checks).
- Message rules: the last rule must be unconditional.

## Checklist

- [ ] **P15-T00 — Decisions**
  - Confirm ADR-106 (game runtime as a new content type). Confirm open question 3 (difficulty
    playability).

- [ ] **P15-T01 — Round and game schemas**
  - Add `src/content/schema/game.ts` (round, game, slot, drop, feedback, overrides).
  - Extend the manifest and registry; export `schemas/round.schema.json` and
    `schemas/game.schema.json`.

- [ ] **P15-T02 — Mechanic templates**
  - Implement `mechanics.ts` with the four templates and unit tests for allowed primitives and
    required fields.

- [ ] **P15-T03 — Games configuration**
  - Add the `games` app-config block (difficulties, scoring, messages, copy, formats, leaderboard,
    expert runs) with strict schemas and defaults.

- [ ] **P15-T04 — Scoring and proximity**
  - Implement `scoring.ts` and `proximity.ts` with table-driven tests, including timeouts, clue
    costs, floor at zero, speed-bonus eligibility and organ-agnostic proximity.

- [ ] **P15-T05 — Seeds and run planning**
  - Implement `seed.ts` and `plan.ts`; prove determinism (same seed → same rounds and drop points),
    daily seeds and difficulty application.

- [ ] **P15-T06 — Run session reducer and store**
  - Implement the reducer and the scoped persisted `game-session` store with resume semantics.

- [ ] **P15-T07 — Events, learner state v9 and pipeline**
  - Add the event payloads, `activityKind: 'game'`, state v9 migration, seed fields and
    `applyGameProgressEvent`; prove idempotent completion and bounded history.

- [ ] **P15-T08 — Results, messages and leaderboard selectors**
  - Implement `results.ts`, message matching and `leaderboard.ts` with tests.

- [ ] **P15-T09 — Challenge-link codec**
  - Implement `links.ts` with version, checksum, malformed-input rejection and round-trip tests.
    Document that links are not tamper-proof.

- [ ] **P15-T10 — Validation, fixtures and docs**
  - Add the semantic rules above, valid/invalid fixtures, a two-round fixture game in the sanofi
    root, `docs/CONTENT_SCHEMA.md` game sections and an architecture update.
  - `npm run check` passes for both experiences; default regression gate passes.

## Exit criteria

- Round and game documents validate strictly with path-precise errors.
- A fixture run plans, scores and summarises deterministically from a seed.
- Game events reduce into learner state v9 through the central pipeline; replays do not double
  count.
- Share links round-trip and reject malformed input.
- No React code was added to engines; no default content or behaviour changed.

## Risks

- **Over-generalization.** Keep mechanics to the four the PRD needs; add new ones only with a
  content use.
- **Score inflation or confusion.** Keep the formula simple and expose only points and named
  bonuses to players.
- **State migration.** v9 must keep all v5–v8 data readable; covered by migration tests over the
  existing seeds.
