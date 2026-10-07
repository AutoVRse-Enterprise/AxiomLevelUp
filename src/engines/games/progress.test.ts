import seedData from '../../../public/experiences/sanofi/content/seeds/fresh.json'
import appConfigData from '../../../public/experiences/sanofi/content/app-config.json'
import { describe, expect, it } from 'vitest'

import { appConfigSchema, learnerSeedSchema } from '@/content/schema'
import { applyGameProgressEvent } from '@/engines/games/progress'
import type { LearnerEvent } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

const gamesConfig = appConfigSchema.parse(appConfigData).games!

function state(): LearnerData {
  const { schemaVersion: _schemaVersion, ...data } = learnerSeedSchema.parse(seedData)
  return structuredClone(data)
}

function completion(
  overrides: Partial<Extract<LearnerEvent, { event: 'game_completed' }>> = {},
): LearnerEvent {
  return {
    event: 'game_completed',
    id: 'event-1',
    occurredAt: '2026-10-07T12:00:00.000Z',
    runId: 'run-1',
    gameId: 'fixture-game',
    difficulty: 'challenge',
    seed: 42,
    mode: 'standard',
    total: 1800,
    correctCount: 2,
    durationSeconds: 75,
    roundResults: [],
    ...overrides,
  } as LearnerEvent
}

describe('game progress', () => {
  it('records a completion once and bounds history', () => {
    const learner = state()
    const config = { ...gamesConfig, historyLimit: 2 }
    expect(applyGameProgressEvent(learner, completion(), config)).toBe(true)
    expect(applyGameProgressEvent(learner, completion(), config)).toBe(false)
    applyGameProgressEvent(
      learner,
      completion({ id: 'event-2', runId: 'run-2', total: 900 }),
      config,
    )
    applyGameProgressEvent(
      learner,
      completion({ id: 'event-3', runId: 'run-3', total: 2200 }),
      config,
    )

    expect(learner.games['fixture-game']).toMatchObject({
      plays: 3,
      bestTotal: 2200,
      bestByDifficulty: { challenge: 2200 },
    })
    expect(learner.games['fixture-game']?.history.map(({ runId }) => runId)).toEqual([
      'run-2',
      'run-3',
    ])
    expect(learner.xp).toEqual({ total: 0, weekly: 0 })
  })

  it('updates only consecutive daily streaks', () => {
    const learner = state()
    applyGameProgressEvent(
      learner,
      completion({ mode: 'daily', occurredAt: '2026-10-05T12:00:00.000Z' }),
      gamesConfig,
    )
    applyGameProgressEvent(
      learner,
      completion({
        id: 'event-2',
        runId: 'run-2',
        mode: 'daily',
        occurredAt: '2026-10-06T12:00:00.000Z',
      }),
      gamesConfig,
    )
    expect(learner.gameDaily).toEqual({ lastPlayedDate: '2026-10-06', streakDays: 2 })

    applyGameProgressEvent(
      learner,
      completion({
        id: 'event-3',
        runId: 'run-3',
        mode: 'daily',
        occurredAt: '2026-10-09T12:00:00.000Z',
      }),
      gamesConfig,
    )
    expect(learner.gameDaily).toEqual({ lastPlayedDate: '2026-10-09', streakDays: 1 })
  })
})
