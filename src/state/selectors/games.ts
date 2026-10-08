import type { ContentRegistry } from '@/content/loader'
import type { GameRunRecord } from '@/content/schema'
import { localDateFromTimestamp } from '@/engines/gamification/calendar'
import type { LearnerData } from '@/state/learnerStore'

export interface RecentGameRun {
  gameId: string
  gameTitle: string
  record: GameRunRecord
}

export function selectPlayerGameStats(state: Pick<LearnerData, 'games' | 'gameDaily'>) {
  const runs = Object.values(state.games).flatMap(({ history }) => history)
  const ordered = [...runs].sort(
    (left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt),
  )
  return {
    bestScore: Math.max(0, ...Object.values(state.games).map(({ bestTotal }) => bestTotal ?? 0)),
    lastScore: ordered[0]?.total ?? 0,
    gamesPlayed: Object.values(state.games).reduce((sum, progress) => sum + progress.plays, 0),
    dailyStreak: state.gameDaily.streakDays,
  }
}

export function selectRecentRuns(
  games: LearnerData['games'],
  registry: ContentRegistry,
  limit: number,
): RecentGameRun[] {
  return Object.entries(games)
    .flatMap(([gameId, progress]) =>
      progress.history.map((record) => ({
        gameId,
        gameTitle: registry.gameById.get(gameId)?.title ?? gameId,
        record,
      })),
    )
    .sort(
      (left, right) => Date.parse(right.record.completedAt) - Date.parse(left.record.completedAt),
    )
    .slice(0, limit)
}

export function selectBestByFormatAndDifficulty(
  games: LearnerData['games'],
  registry: ContentRegistry,
) {
  const config = registry.appConfig.games
  if (!config) return []
  return config.formats
    .filter((format) => format.status === 'playable' && format.gameId)
    .map((format) => ({
      format,
      scores: config.difficulties.map((difficulty) => ({
        difficulty,
        score: games[format.gameId!]?.bestByDifficulty[difficulty.id] ?? 0,
      })),
    }))
}

export function selectDailyStatus(
  progress: LearnerData['games'][string] | undefined,
  localDate: string,
) {
  const record = [...(progress?.history ?? [])]
    .reverse()
    .find(
      (candidate) =>
        candidate.mode === 'daily' && localDateFromTimestamp(candidate.completedAt) === localDate,
    )
  return { completed: Boolean(record), score: record?.total ?? null }
}

export function selectPendingIncomingChallenge(state: Pick<LearnerData, 'gameChallenges'>) {
  return state.gameChallenges.incoming.find(({ playedRunId }) => playedRunId === null) ?? null
}

export function selectFormatCards(registry: ContentRegistry) {
  const config = registry.appConfig.games
  if (!config) return []
  return config.formats.map((format) => {
    const game = format.gameId ? registry.gameById.get(format.gameId) : undefined
    const mechanics = game
      ? [
          ...new Set(
            game.slots.flatMap(({ pool }) =>
              pool.flatMap((roundId) => {
                const mechanic = registry.roundById.get(roundId)?.mechanic
                return mechanic ? [mechanic] : []
              }),
            ),
          ),
        ]
      : []
    return {
      ...format,
      game,
      mechanics,
      roundCount: game?.slots.reduce((sum, slot) => sum + slot.pick, 0) ?? 0,
      minutes: game ? Math.max(1, Math.round(game.estimatedSeconds / 60)) : null,
    }
  })
}
