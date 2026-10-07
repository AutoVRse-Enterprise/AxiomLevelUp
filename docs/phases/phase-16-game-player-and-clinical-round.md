# Phase 16: Game player and clinical-call round

**Status:** Complete

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phase 15.

## Goal

Build the shared game player that turns a planned run into the PRD loop:
**Start → Play → Answer → Reveal → Next round → Final score**. Prove it end to end with a real
Round 4 (`clinical_call`) that combines multimodal clues into one clinical decision. The player
reuses the shared primitive renderer, evaluators and effects; it does not reuse the LMS-shaped
ActivityPlayer lifecycle (intro page, retries, review mode, completion summary).

## Scope

### In scope

- Shared game routes and layout registered by the sanofi experience.
- Round lifecycle UI, lock-in action, countdown timer with timeout, reveal card, points
  breakdown, cumulative score ticker and a basic final result screen.
- Presentation-context label overrides so shared primitives read as a game in this context and
  read exactly as today everywhere else.
- Compact clue tray with free and paid clues for `clinical_call`.
- Exit, resume and abandon semantics.
- Event-driven haptics and confetti for game moments.
- The authored Round 4 content and a two-round fixture game used for loop testing.

### Out of scope

- Spatial rounds (Phase 17), spot the finding (Phase 18).
- Full result page, share flow, leaderboard and hub (Phase 19).
- Final visual polish (Phase 20).

## Design

### Routes (shared, in `src/routes/games/`)

| Path              | Layout       | Purpose                                                           |
| ----------------- | ------------ | ----------------------------------------------------------------- |
| `/play/:gameId`   | `GameLayout` | Plans or resumes a run and hosts every round plus the final score |
| `/results/:runId` | shell        | Saved result for a completed run (expanded in Phase 19)           |

Query parameters: `difficulty`, `seed` (development and links), `challenge` (Phase 19 token). The
sanofi definition registers these routes; default does not.

### `GameLayout`

- Full-bleed, no bottom navigation, safe-area aware, dark scientific surface from theme tokens.
- Top bar: exit button, round progress ("Round 2 of 4" plus dots), cumulative score ticker using
  `AnimatedNumber`, and a countdown ring.
- Skip link and focus management on round change, mirroring `ImmersiveLayout`.

### Round lifecycle

```text
intro ──(auto after configured ms or tap)──► playing ──(Lock in | timeout)──► locked
locked ──(evaluate)──► reveal ──(Next round)──► intro of next slot … ──► final
```

- **Intro:** one line from the round's `intro`, mechanic badge and time limit. No instructional
  page.
- **Playing:** the round primitive renders through `PrimitiveRenderer` in `interactive` mode. The
  primary action uses a game action outlet (generalising `StepActionScope`/`StepActionSlot` with a
  `game` placement anchored above the safe area).
- **Locked:** input is disabled; the run reducer records the response and elapsed time.
- **Reveal:** `RoundReveal` shows **Correct** or **Not quite**, the correct answer line from the
  feedback template when incorrect, exactly one explanatory sentence, the points breakdown
  (base, speed bonus, clue cost) with a short count-up, and the new cumulative total.
- **Final:** total points, correct count, total seconds, best round, difficulty, the matched
  message and **Play again** (new seed). Phase 19 replaces this with the full result page.

### Timer and timeout

- Countdown from `timeLimitSeconds × difficulty.timeMultiplier`.
- Announce remaining time at the configured `timerAnnouncements` thresholds through the shared
  `PresentationAnnouncer`.
- On expiry, evaluate the current draft through `evaluatePrimitiveTimeout` where a primitive
  defines timeout credit, otherwise accuracy is zero; mark the round timed out (no speed bonus).
- Pause the clock when the document is hidden. Free and revealed clues expand inline while time
  continues; only the paid-clue cost confirmation pauses the clock (ADR-108).

### Presentation context and labels

Shared primitives and the renderer contain lesson-flavoured strings ("Loading activity", "Activity
could not load", "Retry activity", "Commit your localisation", "Level 1 of 3"). Add a
`PresentationContext` with `variant: 'lesson' | 'case' | 'game'` and a label map.

- The default context value reproduces every current string, so lessons and cases are unchanged.
- The game player provides labels from `games.copy` (for example "Loading round", "Lock in",
  "Step 1 of 3").
- Only strings that a game round can display are routed through the context; no behaviour
  changes.

### Clue tray (`clinical_call`)

- Clues render as compact cards: patient snapshot (`rich_text`), biomarkers (`data_table`), breath
  sound (`audio`, the existing `wheeze-audio` asset), pathology image (`image`) and an optional
  spirometry trend (`chart`).
- The difficulty's `freeClues` count is open from the start. Remaining clues show their cost
  ("Reveal · −100") before opening; opening emits `game_clue_revealed` and is recorded by the run
  reducer.
- Audio clues use the shared audio primitive with transcript available.
- The answer is a `multiple_choice` primitive with four plausible options; Expert may supply a
  more similar option set through the round's difficulty override.

### Events and effects

- The player emits only typed game events and the existing `artifact_interacted` interaction
  events with `activityKind: 'game'`. It never writes learner state directly.
- `src/effects` subscribes to `game_round_answered` (haptic on correct) and `game_completed`
  (confetti above a configured score ratio). Moments and patterns live in
  `product.presentation`.

### Exit, resume and abandon

- Exit asks for confirmation once and keeps the run in the `game-session` store.
- Returning to `/play/:gameId` with an active run offers **Continue game** or **New game**.
- Abandoning emits `game_abandoned`; it does not count toward history or bests.

### Accessibility and motion

- Every round is completable by keyboard. Reveal results are announced politely. Focus moves to
  the reveal heading and then to the next round's prompt.
- Reduced motion removes count-up animation and transitions without hiding values.

### Round 4 content

- Author `clinical-call-t2` in the sanofi round library: a synthetic adult with variable wheeze and
  nocturnal symptoms; free clues (patient snapshot, breath sound), paid clues (blood eosinophils
  and FeNO table, histology thumbnail, peak-flow trend); four options such as "Asthma
  exacerbation with type 2 inflammation", "COPD exacerbation", "Community-acquired pneumonia",
  "Vocal cord dysfunction". Feedback names the strongest clue. No product or treatment claims.
- Author a two-round fixture game (Round 4 plus a simple `multiple_choice` warm-up round) for loop
  testing. It is development-only and hidden from formats.

## Checklist

- [x] **P16-T00 — Decisions**
  - Record ADR-107: a dedicated game player over shared primitives instead of extending
    ActivityPlayer.
  - Accepted 2026-10-07. ADR-108 records fair elapsed checkpoints, game presentation
    configuration, a URL-only fixture and the paid-clue confirmation pause.

- [x] **P16-T01 — Routes and `GameLayout`**
  - Add shared routes, layout, top bar, progress dots and score ticker; register them in the
    sanofi definition.

- [x] **P16-T02 — Round lifecycle and action outlet**
  - Implement intro/playing/locked/reveal/final states over the Phase 15 reducer and the game
    action outlet.

- [x] **P16-T03 — Presentation context**
  - Add `PresentationContext`, route renderer and primitive strings through it, and prove default
    lesson/case copy is byte-identical in existing tests.

- [x] **P16-T04 — Timer and timeout**
  - Countdown, announcements, visibility pause and timeout evaluation with tests.

- [x] **P16-T05 — Reveal card and points breakdown**
  - `RoundReveal`, cumulative ticker and reduced-motion behaviour; all copy from configuration.

- [x] **P16-T06 — Clue tray**
  - Free/paid clue cards, cost disclosure, event emission and pausing while open.

- [x] **P16-T07 — Basic final score**
  - Summary, message and Play again with a new seed.

- [x] **P16-T08 — Exit, resume, abandon and effects**
  - Confirmation, Continue game, abandon event, haptics and confetti subscriptions.

- [x] **P16-T09 — Round 4 and fixture content**
  - Author the clinical call and the fixture game; content validates with zero warnings.

- [x] **P16-T10 — Tests and closeout**
  - Component tests for lifecycle, reveal, timer and clue tray; route tests for resume; a sanofi
    Playwright spec that completes the fixture game on desktop and 375 × 812, including a timeout
    path.
  - `npm run check` passes for both experiences; default regression gate passes; docs updated.

## Closeout

Completed 2026-10-07. The sanofi build now registers the shared game player and compact saved-result
route while the default route table remains unchanged. The deterministic two-round fixture and
single-round timeout fixture complete on desktop and 375 × 812 Chromium. The final verification
counts are recorded in `docs/qa/phase-16-regression.md`.

## Exit criteria

- The fixture game completes from `/play/:gameId` to the final score on both viewports.
- Every round shows exactly one outcome, one sentence and a points breakdown, then **Next round**.
- Timeouts, paid clues and resume behave as configured and are covered by tests.
- Lesson and case copy is unchanged; no game state is mutated outside events and the run reducer.

## Risks

- **Primitive layout assumptions.** Some primitives assume lesson spacing or sticky slots; scope
  fixes to the game outlet and presentation context.
- **Timer fairness.** Backgrounding a phone must not burn time; covered by visibility pause tests.
- **Copy leakage.** Unrouted strings can surface LMS wording; Phase 20's sweep is the backstop,
  but each new game screen is checked manually in this phase.
