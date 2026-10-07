import type { GameConfig, GameRunRecord } from '@/content/schema'
import { differenceInLocalDays, localDateFromTimestamp } from '@/engines/gamification/calendar'
import type { LearnerEvent } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

export function applyGameProgressEvent(
  state: LearnerData,
  event: LearnerEvent,
  config: GameConfig,
): boolean {
  if (event.event !== 'game_completed') return false

  const previous = state.games[event.gameId] ?? {
    plays: 0,
    bestTotal: null,
    bestByDifficulty: {},
    lastPlayedAt: null,
    history: [],
  }
  if (previous.history.some(({ runId }) => runId === event.runId)) return false

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
  return true
}
