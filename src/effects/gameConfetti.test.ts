import { afterEach, describe, expect, it, vi } from 'vitest'

import { appConfigSchema } from '@/content/schema'
import { initializeGameConfettiEffects } from '@/effects/gameConfetti'
import { clearEventSubscribersForTests, emitEvent } from '@/events/bus'
import { makeGameContentBundle } from '@/test/gameFixtures'

const { playConfetti } = vi.hoisted(() => ({ playConfetti: vi.fn() }))
vi.mock('@/effects/confetti', () => ({ playConfetti }))

afterEach(() => {
  clearEventSubscribersForTests()
  playConfetti.mockClear()
})

describe('game confetti', () => {
  it('plays once a completion reaches the configured ratio', () => {
    const config = appConfigSchema.parse(makeGameContentBundle().appConfig)
    initializeGameConfettiEffects(config.product.presentation.confetti, config.games)
    emitEvent({
      event: 'game_completed',
      runId: 'run-1',
      gameId: 'fixture-two-round',
      difficulty: 'challenge',
      seed: 1,
      mode: 'standard',
      total: 1_600,
      correctCount: 2,
      durationSeconds: 30,
      roundResults: [
        {
          slotId: 'one',
          roundId: 'one',
          mechanic: 'clinical_call',
          accuracy: 1,
          correct: true,
          points: 800,
          basePoints: 800,
          speedBonus: 0,
          clueCost: 0,
          elapsedMs: 15_000,
          timedOut: false,
        },
        {
          slotId: 'two',
          roundId: 'two',
          mechanic: 'clinical_call',
          accuracy: 1,
          correct: true,
          points: 800,
          basePoints: 800,
          speedBonus: 0,
          clueCost: 0,
          elapsedMs: 15_000,
          timedOut: false,
        },
      ],
    })
    expect(playConfetti).toHaveBeenCalledWith(
      'game_complete',
      'run-1',
      config.product.presentation.confetti,
      expect.any(Boolean),
    )
  })
})
