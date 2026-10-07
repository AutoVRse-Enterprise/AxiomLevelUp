import { describe, expect, it } from 'vitest'

import {
  selectLeaderboard,
  type ConfiguredGameLeaderboardEntry,
  type PlayerLeaderboardBest,
  type PlayerLeaderboardResult,
} from './leaderboard'

const entries: ConfiguredGameLeaderboardEntry[] = [
  {
    id: 'asha',
    name: 'Asha',
    specialty: 'Respiratory',
    country: 'India',
    gameId: 'respiratory',
    difficulty: 'challenge',
    period: 'today',
    score: 900,
  },
  {
    id: 'bo',
    name: 'Bo',
    gameId: 'respiratory',
    difficulty: 'challenge',
    period: 'today',
    score: 800,
  },
  {
    id: 'cyra',
    name: 'Cyra',
    gameId: 'respiratory',
    difficulty: 'challenge',
    period: 'today',
    score: 800,
  },
  {
    id: 'dev',
    name: 'Dev',
    gameId: 'respiratory',
    difficulty: 'challenge',
    period: 'today',
    score: 700,
  },
  {
    id: 'other-period',
    name: 'Other period',
    gameId: 'respiratory',
    difficulty: 'challenge',
    period: 'week',
    score: 5000,
  },
  {
    id: 'other-game',
    name: 'Other game',
    gameId: 'anatomy',
    difficulty: 'challenge',
    period: 'today',
    score: 5000,
  },
  {
    id: 'other-difficulty',
    name: 'Other difficulty',
    gameId: 'respiratory',
    difficulty: 'expert',
    period: 'today',
    score: 5000,
  },
]

const history: PlayerLeaderboardResult[] = [
  {
    gameId: 'respiratory',
    difficulty: 'challenge',
    score: 750,
    completedAt: '2026-10-07T08:00:00',
  },
  {
    gameId: 'respiratory',
    difficulty: 'challenge',
    score: 1200,
    completedAt: '2026-10-06T08:00:00',
  },
  {
    gameId: 'respiratory',
    difficulty: 'expert',
    score: 5000,
    completedAt: '2026-10-07T08:00:00',
  },
]

const bests: PlayerLeaderboardBest[] = [
  {
    gameId: 'respiratory',
    difficulty: 'challenge',
    score: 1500,
  },
]

describe('game leaderboard', () => {
  it('filters rankings, keeps score ties stable and pins a player outside the visible window', () => {
    const view = selectLeaderboard({
      entries,
      playerHistory: history,
      playerBests: bests,
      gameId: 'respiratory',
      difficulty: 'challenge',
      period: 'today',
      visibleWindow: 3,
      playerName: 'Dr Élodie',
      now: new Date(2026, 9, 7, 12),
    })

    expect(view.rows.map(({ id, rank }) => [id, rank])).toEqual([
      ['asha', 1],
      ['bo', 2],
      ['cyra', 3],
    ])
    expect(view.pinnedPlayer).toMatchObject({
      name: 'Dr Élodie',
      score: 750,
      rank: 4,
      isPlayer: true,
    })
    expect(view.playerRank).toBe(4)
    expect(view.totalRows).toBe(5)
  })

  it('uses history for calendar-week scores and all-time bests for all-time scores', () => {
    const weekly = selectLeaderboard({
      entries: [
        {
          id: 'weekly-peer',
          name: 'Weekly peer',
          gameId: 'respiratory',
          difficulty: 'challenge',
          period: 'week',
          score: 1100,
        },
      ],
      playerHistory: history,
      playerBests: bests,
      gameId: 'respiratory',
      difficulty: 'challenge',
      period: 'week',
      visibleWindow: 5,
      now: new Date(2026, 9, 7, 12),
    })
    expect(weekly.rows.map(({ name, score }) => [name, score])).toEqual([
      ['You', 1200],
      ['Weekly peer', 1100],
    ])
    expect(weekly.pinnedPlayer).toBeNull()

    const allTime = selectLeaderboard({
      entries: [
        {
          id: 'lifetime-peer',
          name: 'Lifetime peer',
          gameId: 'respiratory',
          difficulty: 'challenge',
          period: 'all_time',
          score: 1400,
        },
      ],
      playerHistory: history,
      playerBests: bests,
      gameId: 'respiratory',
      difficulty: 'challenge',
      period: 'all_time',
      visibleWindow: 5,
      now: new Date(2026, 9, 7, 12),
    })
    expect(allTime.rows.map(({ name, score, isPlayer }) => [name, score, isPlayer])).toEqual([
      ['You', 1500, true],
      ['Lifetime peer', 1400, false],
    ])
  })

  it('omits the player when no matching score exists', () => {
    expect(
      selectLeaderboard({
        entries,
        playerHistory: history,
        gameId: 'missing',
        difficulty: 'challenge',
        period: 'today',
        visibleWindow: 2,
        now: new Date(2026, 9, 7, 12),
      }),
    ).toMatchObject({
      rows: [],
      pinnedPlayer: null,
      playerRank: null,
      totalRows: 0,
    })
  })
})
