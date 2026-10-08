import type { GameConfig, GameRunRecord } from '@/content/schema'
import { differenceInLocalDays, localDateFromTimestamp } from '@/engines/gamification/calendar'
import { selectLeaderboard } from '@/engines/games/leaderboard'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

export function applyGameProgressEvent(
  state: LearnerData,
  event: LearnerEvent,
  config: GameConfig,
): LearnerEventDraft[] {
  if (event.event === 'game_challenge_opened') {
    if (!state.gameChallenges.incoming.some(({ token }) => token === event.token)) {
      state.gameChallenges.incoming = [
        {
          token: event.token,
          gameId: event.gameId,
          from: event.fromName,
          score: event.targetScore,
          openedAt: event.occurredAt,
          playedRunId: null,
        },
        ...state.gameChallenges.incoming,
      ].slice(0, 10)
    }
    return []
  }
  if (event.event !== 'game_completed') return []

  const previous = state.games[event.gameId] ?? {
    plays: 0,
    bestTotal: null,
    bestByDifficulty: {},
    lastPlayedAt: null,
    history: [],
  }
  if (previous.history.some(({ runId }) => runId === event.runId)) return []
  const personalBest = event.total > 0 && event.total > (previous.bestTotal ?? 0)
  const previousRank = selectLeaderboard({
    entries: config.leaderboard.entries,
    playerHistory: previous.history.map((result) => ({
      gameId: event.gameId,
      difficulty: result.difficulty,
      score: result.total,
      completedAt: result.completedAt,
    })),
    gameId: event.gameId,
    difficulty: event.difficulty,
    period: 'all_time',
    visibleWindow: Number.MAX_SAFE_INTEGER,
    playerName: state.player.displayName,
  }).playerRank

  const record: GameRunRecord = {
    resultVersion: 1,
    runId: event.runId,
    difficulty: event.difficulty,
    seed: event.seed,
    mode: event.mode,
    total: event.total,
    correctCount: event.correctCount,
    durationSeconds: event.durationSeconds,
    roundResults: structuredClone(
      event.roundResults.map((result) => ({
        ...result,
        skipped: result.skipped ?? false,
      })),
    ),
    ...(event.challengeToken ? { challengeToken: event.challengeToken } : {}),
    personalBest,
    completedAt: event.occurredAt,
  }

  state.games[event.gameId] = {
    plays: previous.plays + 1,
    bestTotal: Math.max(previous.bestTotal ?? 0, event.total),
    bestByDifficulty: {
      ...previous.bestByDifficulty,
      [event.difficulty]: Math.max(previous.bestByDifficulty[event.difficulty] ?? 0, event.total),
    },
    lastPlayedAt: event.occurredAt,
    history: [...previous.history, record].slice(-config.historyLimit),
  }

  if (event.mode === 'daily') {
    const playedDate = localDateFromTimestamp(event.occurredAt)
    const daysSinceLast = state.gameDaily.lastPlayedDate
      ? differenceInLocalDays(playedDate, state.gameDaily.lastPlayedDate)
      : null
    state.gameDaily = {
      lastPlayedDate: playedDate,
      streakDays:
        daysSinceLast === 0
          ? state.gameDaily.streakDays
          : daysSinceLast === 1
            ? state.gameDaily.streakDays + 1
            : 1,
    }
  }
  if (event.challengeToken) {
    state.gameChallenges.incoming = state.gameChallenges.incoming.map((challenge) =>
      challenge.token === event.challengeToken
        ? { ...challenge, playedRunId: event.runId }
        : challenge,
    )
  }

  const nextRank = selectLeaderboard({
    entries: config.leaderboard.entries,
    playerHistory: state.games[event.gameId]!.history.map((result) => ({
      gameId: event.gameId,
      difficulty: result.difficulty,
      score: result.total,
      completedAt: result.completedAt,
    })),
    gameId: event.gameId,
    difficulty: event.difficulty,
    period: 'all_time',
    visibleWindow: Number.MAX_SAFE_INTEGER,
    playerName: state.player.displayName,
  }).playerRank
  const followUps: LearnerEventDraft[] = []
  if (personalBest) {
    followUps.push({
      event: 'game_personal_best',
      runId: event.runId,
      gameId: event.gameId,
      score: event.total,
    })
  }
  if (event.total > 0 && nextRank !== null && (previousRank === null || nextRank < previousRank)) {
    followUps.push({
      event: 'game_rank_improved',
      runId: event.runId,
      gameId: event.gameId,
      difficulty: event.difficulty,
      previousRank,
      rank: nextRank,
    })
  }
  return followUps
}
