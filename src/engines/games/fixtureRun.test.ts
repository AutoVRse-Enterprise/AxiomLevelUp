import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import { planRun } from '@/engines/games/plan'
import { summarizeRun, type GameRoundResult } from '@/engines/games/results'
import { resolveRoundAccuracy, scoreRound } from '@/engines/games/scoring'
import { makeGameContentBundle } from '@/test/gameFixtures'

describe('fixture game integration', () => {
  it('plans, scores and summarizes deterministically from one seed', () => {
    const registry = validateContentBundle(makeGameContentBundle())
    const game = registry.gameById.get('fixture-two-round')!
    const firstPlan = planRun({ game, registry, difficultyId: 'challenge', seed: 20261007 })
    const secondPlan = planRun({ game, registry, difficultyId: 'challenge', seed: 20261007 })
    expect(secondPlan).toEqual(firstPlan)

    const difficulty = registry.appConfig.games!.difficulties.find(({ id }) => id === 'challenge')!
    const scoring = registry.appConfig.games!.scoring!
    const results: GameRoundResult[] = firstPlan.rounds.map((planned, index) => {
      const response = planned.primitive.content.correctOptionId
      const round = registry.roundById.get(planned.roundId)!
      const accuracy = resolveRoundAccuracy({
        round: { ...round, primitive: planned.primitive },
        response,
        timedOut: false,
      })
      const score = scoreRound(
        {
          accuracy,
          elapsedMs: 20_000,
          timeLimitSeconds: planned.timeLimitSeconds,
          timedOut: false,
          paidClueCount: 0,
          difficulty,
        },
        scoring,
      )
      return {
        slotId: planned.slotId,
        roundId: planned.roundId,
        mechanic: planned.mechanic,
        correct: score.correct,
        points: score.points,
        elapsedMs: 20_000 + index,
        basePoints: score.basePoints,
        speedBonus: score.speedBonus,
        clueCost: score.clueCost,
      }
    })

    expect(summarizeRun(results, 'challenge')).toMatchObject({
      correctCount: 2,
      roundCount: 2,
      difficulty: 'challenge',
    })
  })
})
