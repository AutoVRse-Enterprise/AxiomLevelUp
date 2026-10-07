import { describe, expect, it } from 'vitest'

import { ContentValidationError, validateContentBundle } from './loader'
import { gameConfigSchema, type GameConfig } from './schema/game'
import { makeValidContentBundle } from '@/test/contentFixtures'

const config = {
  hub: {
    title: 'Challenge',
    tagline: 'Make the call.',
    startLabel: 'Start',
    unavailableLabel: 'Coming soon',
  },
  difficulties: [
    {
      id: 'challenge',
      label: 'Challenge',
      timeMultiplier: 1,
      maxMoves: 3,
      freeClues: 2,
      clueCostPoints: 100,
      speedBonus: true,
      optionSet: 'standard',
    },
  ],
  scoring: {
    roundMaxPoints: 1000,
    speedBonuses: [
      { maxFractionOfLimit: 0.25, points: 150, label: 'Lightning bonus' },
      { maxFractionOfLimit: 0.5, points: 100, label: 'Fast answer bonus' },
    ],
    minAccuracyForSpeedBonus: 0.5,
    correctThreshold: 0.8,
    proximity: { exact: 1, byCommonLevel: { lobe: 0.6 }, none: 0 },
  },
  messages: [{ when: {}, text: 'Good run.' }],
}

describe('games configuration', () => {
  it('applies future-section defaults', () => {
    expect(gameConfigSchema.parse(config)).toMatchObject({
      formats: [],
      leaderboard: { entries: [], disclosure: 'Demo leaderboard' },
      expertRuns: [],
      historyLimit: 20,
    })
  })

  it.each([
    {
      name: 'unordered speed tiers',
      update: (games: GameConfig) => {
        games.scoring?.speedBonuses.reverse()
      },
      path: 'games.scoring.speedBonuses',
    },
    {
      name: 'a conditional final message',
      update: (games: GameConfig) => {
        games.messages = [{ when: { minCorrectRatio: 0.5 }, text: 'Good run.' }]
      },
      path: 'games.messages.0.when',
    },
  ])('rejects $name', ({ update, path }) => {
    const input = makeValidContentBundle()
    const games = gameConfigSchema.parse(config)
    update(games)
    ;(input.appConfig as Record<string, unknown>).games = games
    expect(() => validateContentBundle(input)).toThrowError(ContentValidationError)
    try {
      validateContentBundle(input)
    } catch (error) {
      expect((error as ContentValidationError).issues.some((issue) => issue.path === path)).toBe(
        true,
      )
    }
  })
})
