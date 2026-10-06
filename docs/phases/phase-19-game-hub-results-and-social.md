# Phase 19: Game hub, results, social and competition

**Status:** Planned

Programme context: `docs/MEDICAL_CHALLENGE_PLAN.md`. Depends on Phase 16; final hub content uses
Phase 18 formats. Can run in parallel with Phases 17 and 18.

## Goal

Build the sanofi homepage as a game hub and close the competitive loop: a strong result page,
**Challenge a colleague** with a link that replays identical rounds, **Score to beat**, a per-game
leaderboard, expert challenges, a lightweight **You** page and a daily challenge. All social and
competitive features are client-only and convincing; nothing implies a live backend.

## Information architecture (sanofi)

| Path              | Surface                 | Navigation item |
| ----------------- | ----------------------- | --------------- |
| `/`               | Game hub (homepage)     | Play            |
| `/play/:gameId`   | Game run (Phase 16)     | —               |
| `/results/:runId` | Result page             | —               |
| `/c/:token`       | Challenge landing       | —               |
| `/leaderboard`    | Leaderboard             | Leaderboard     |
| `/you`            | Player stats and history| You             |

Bottom navigation on phones and header navigation on desktop come from the sanofi definition's
`navigation` (three items). The header status shows the player's best score instead of XP and
streak (`shell.headerStatus` set to a shared `BestScoreStatus` component).

## Hub (sanofi homepage)

`src/experiences/sanofi/HomePage.tsx` composes shared components from `src/components/game/`.
All copy comes from `games.hub` configuration.

1. **Hero:** game title, one-line tagline and the dominant **Start a quick challenge** button. A
   compact difficulty picker (Warm-up / Challenge / Expert) sits under it with Challenge
   preselected.
2. **Continue game** banner when a run is active.
3. **Incoming challenge** banner when the player opened a challenge link and has not played it:
   "Asha challenged you · Score to beat 3,420".
4. **Today's challenge:** a daily-seeded run with the player's daily streak.
5. **Game formats:** cards for Quick Challenge, Anatomy Hunt, Spot the Finding and Clinical Mystery
   with mechanic icons, round counts, estimated time and status (playable or "New soon").
6. **Your stats strip:** best score, last score, games played, current daily streak.
7. **Leaderboard preview:** top three plus the player's position.
8. **Expert challenge card:** a configured expert run with its score to beat.
9. **Recent games:** the last three runs.

Primary action and model prefetch: when the hero becomes visible, prefetch the first round's model
URL through the existing model cache.

## Result page

- Large animated total ("3,420 points"), reduced-motion safe.
- Four stats: correct count ("3 / 4 correct"), total time ("72 sec total"), best round
  ("Best round: 940") and difficulty.
- The matched personality message.
- Round strip: mechanic icon, outcome and points per round; tapping opens the round's one-line
  feedback again.
- Comparison banner when the run came from a challenge or expert run: "You beat Asha by 240" or
  "180 short of Asha".
- Actions: **Challenge a colleague** (primary), **Try again** (new seed), **Beat your best** when
  not a personal best, **Leaderboard**, and **Credits** (Phase 18).
- Personal-best and rank-change moments trigger configured effects through events.

## Challenge a colleague

- `ShareChallengeSheet` previews the configured message template:
  "I scored {score} on the {gameTitle}. Think you can beat me?" plus the link.
- Actions: native share (`navigator.share`) when available, **Copy link**, and mock channel buttons
  (messaging, email) that open the same share text. Each emits `game_shared`.
- The first share prompts once for an optional display name; skipping uses the configured
  fallback ("A colleague").
- The link encodes `{gameId, difficulty, seed, from, score}` with the Phase 15 codec at
  `/c/:token`.
- **Challenge landing:** "{from} scored {score} on the {gameTitle} ({difficulty}). Same rounds,
  same clock." with **Accept challenge**. Invalid or outdated tokens show a friendly fallback with
  **Start a quick challenge**.
- After the run, the result page shows the comparison and offers **Rematch** (same seed) and
  **Challenge back**.
- Copy and documentation state internally that tracking is not live; no learner-visible claim of
  real-time competition.

## Leaderboard

- Segments: **Today**, **This week**, **All time**; filters: game and difficulty.
- Rows: configured sample players (name, specialty, country, score) merged with the player's bests
  via the Phase 15 selector; the player's row is highlighted and pinned when outside the visible
  window.
- Disclosure caption per open question 2 (default "Demo leaderboard").
- Sample identities are fictional; no real clinicians or institutions.

## Expert challenges

- `games.expertRuns[]`: title, fictional persona ("Respiratory specialist", initials avatar),
  gameId, difficulty, fixed seed and target score.
- Playing an expert run is a normal seeded run with comparison on the result page.

## You page

- Best score per format and difficulty, games played, daily streak, last 10 runs with date,
  difficulty and score (from learner state v9 history), and saved-result links.
- Display name edit.
- Presenter controls, visible only when `demo.enabled` and the URL has `?presenter=1`: reset local
  progress and seed a "returning player" history. Reuses the existing validated seed replacement
  path.

## Checklist

- [ ] **P19-T00 — Decisions**
  - Confirm open questions 2 (leaderboard disclosure) and 5 (player name). Record ADR-110 for
    client-only seeded challenge links.

- [ ] **P19-T01 — Sanofi navigation and header status**
  - Three-item navigation and `BestScoreStatus`; default shell unaffected.

- [ ] **P19-T02 — Hub components and homepage**
  - Shared hub components and the sanofi homepage composition, including Continue game, daily
    challenge and model prefetch.

- [ ] **P19-T03 — Result page**
  - Full result page replacing the Phase 16 basic summary; saved results at `/results/:runId`.

- [ ] **P19-T04 — Share sheet and challenge links**
  - Share sheet, native share and copy fallbacks, display-name prompt, challenge landing, rematch
    and challenge-back.

- [ ] **P19-T05 — Leaderboard**
  - Periods, filters, merging, pinning, disclosure and sample content.

- [ ] **P19-T06 — Expert challenges and daily challenge**
  - Configuration, cards and comparison on results.

- [ ] **P19-T07 — You page and presenter controls**
  - Stats, history, display name and gated presenter reset/seed.

- [ ] **P19-T08 — Tests and closeout**
  - Component and route tests; sanofi Playwright: hub → run → result → share link → open link in a
    fresh context → replay identical rounds → comparison; leaderboard filters; presenter reset.
  - `npm run check` passes; default regression gate passes; README and architecture updated.

## Exit criteria

- The hub communicates "play" within the first viewport on 375 × 812, with one dominant action.
- A share link opened in a clean browser context replays the same rounds and difficulty and shows
  the score to beat and the final comparison.
- Leaderboard, expert run, daily challenge and You page work from configuration and local state.
- No surface states or implies live multiplayer.

## Risks

- **Seed drift.** Content edits change what a seed resolves to; links carry the game version and
  outdated links fall back gracefully.
- **Web Share API variance.** Desktop browsers often lack it; copy-link fallback is mandatory and
  tested.
- **Hub clutter.** Keep the hero dominant; sections below the fold are secondary and collapsible.
