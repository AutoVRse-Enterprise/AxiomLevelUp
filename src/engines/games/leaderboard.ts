import type { GameConfig } from '@/content/schema/game'

export type GameLeaderboardPeriod = 'today' | 'week' | 'all_time'
export type ConfiguredGameLeaderboardEntry = GameConfig['leaderboard']['entries'][number]

export interface PlayerLeaderboardResult {
  gameId: string
  difficulty: string
  score: number
  completedAt: string | number | Date
}

export interface PlayerLeaderboardBest {
  gameId: string
  difficulty: string
  score: number
  period?: GameLeaderboardPeriod
}

export interface GameLeaderboardRow {
  id: string
  name: string
  specialty?: string
  country?: string
  score: number
  rank: number
  isPlayer: boolean
}

export interface SelectGameLeaderboardOptions {
  entries: readonly ConfiguredGameLeaderboardEntry[]
  playerHistory: readonly PlayerLeaderboardResult[]
  playerBests?: readonly PlayerLeaderboardBest[]
  gameId: string
  difficulty: string
  period: GameLeaderboardPeriod
  visibleWindow: number
  playerId?: string
  playerName?: string | null
  now?: Date
}

export interface GameLeaderboardView {
  rows: GameLeaderboardRow[]
  pinnedPlayer: GameLeaderboardRow | null
  playerRank: number | null
  totalRows: number
}

interface UnrankedRow {
  id: string
  name: string
  specialty?: string
  country?: string
  score: number
  isPlayer: boolean
}

function startOfToday(now: Date): Date {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start
}

function startOfWeek(now: Date): Date {
  const start = startOfToday(now)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  return start
}

function belongsToPeriod(
  completedAt: string | number | Date,
  period: GameLeaderboardPeriod,
  now: Date,
): boolean {
  if (period === 'all_time') return true

  const completed = new Date(completedAt)
  if (!Number.isFinite(completed.getTime()) || completed.getTime() > now.getTime()) return false

  const start = period === 'today' ? startOfToday(now) : startOfWeek(now)
  return completed.getTime() >= start.getTime()
}

function playerScore(options: SelectGameLeaderboardOptions): number | null {
  const historyScores = options.playerHistory
    .filter(
      (result) =>
        result.gameId === options.gameId &&
        result.difficulty === options.difficulty &&
        belongsToPeriod(result.completedAt, options.period, options.now ?? new Date()),
    )
    .map(({ score }) => score)
    .filter((score) => Number.isFinite(score) && score >= 0)

  const bestScores = (options.playerBests ?? [])
    .filter(
      (best) =>
        best.gameId === options.gameId &&
        best.difficulty === options.difficulty &&
        (best.period === options.period ||
          (options.period === 'all_time' &&
            (best.period === undefined || best.period === 'all_time'))),
    )
    .map(({ score }) => score)
    .filter((score) => Number.isFinite(score) && score >= 0)

  const scores = [...historyScores, ...bestScores]
  return scores.length ? Math.max(...scores) : null
}

export function rankLeaderboard(rows: readonly UnrankedRow[]): GameLeaderboardRow[] {
  return rows
    .map((row, order) => ({ row, order }))
    .sort((left, right) => right.row.score - left.row.score || left.order - right.order)
    .map(({ row }, index) => ({ ...row, rank: index + 1 }))
}

export function selectLeaderboard(options: SelectGameLeaderboardOptions): GameLeaderboardView {
  const playerId = options.playerId ?? 'player'
  const configuredRows: UnrankedRow[] = options.entries
    .filter(
      (entry) =>
        entry.gameId === options.gameId &&
        entry.difficulty === options.difficulty &&
        entry.period === options.period &&
        entry.id !== playerId,
    )
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      ...(entry.specialty === undefined ? {} : { specialty: entry.specialty }),
      ...(entry.country === undefined ? {} : { country: entry.country }),
      score: entry.score,
      isPlayer: false,
    }))

  const score = playerScore(options)
  const rankedRows = rankLeaderboard(
    score === null
      ? configuredRows
      : [
          ...configuredRows,
          {
            id: playerId,
            name: options.playerName?.trim() || 'You',
            score,
            isPlayer: true,
          },
        ],
  )
  const windowSize = Math.max(0, Math.floor(options.visibleWindow))
  const rows = rankedRows.slice(0, windowSize)
  const player = rankedRows.find(({ isPlayer }) => isPlayer) ?? null
  const playerVisible = player !== null && rows.some(({ isPlayer }) => isPlayer)

  return {
    rows,
    pinnedPlayer: playerVisible ? null : player,
    playerRank: player?.rank ?? null,
    totalRows: rankedRows.length,
  }
}
