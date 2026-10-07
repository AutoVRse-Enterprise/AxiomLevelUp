import { describe, expect, it } from 'vitest'

import { gameScoringSchema, roundDocumentSchema, type GameDifficulty } from '@/content/schema/game'
import {
  classifyRound,
  clueCost,
  resolveRoundAccuracy,
  resolveSpeedBonus,
  scoreRound,
} from '@/engines/games/scoring'

const scoring = gameScoringSchema.parse({
  roundMaxPoints: 1_000,
  speedBonuses: [
    { maxFractionOfLimit: 0.25, points: 150, label: 'Lightning bonus' },
    { maxFractionOfLimit: 0.5, points: 100, label: 'Fast answer bonus' },
  ],
  minAccuracyForSpeedBonus: 0.5,
  correctThreshold: 0.8,
  proximity: {
    exact: 1,
    byCommonLevel: { segment: 0.85, lobe: 0.6 },
    none: 0,
  },
})

const difficulty: GameDifficulty = {
  id: 'challenge',
  label: 'Challenge',
  timeMultiplier: 1,
  maxMoves: 3,
  freeClues: 2,
  clueCostPoints: 100,
  speedBonus: true,
  optionSet: 'standard',
}

const clinicalRound = roundDocumentSchema.parse({
  schemaVersion: '0.1',
  roundVersion: '1',
  id: 'clinical-call',
  title: 'Clinical call',
  mechanic: 'clinical_call',
  intro: 'Choose the best answer.',
  timeLimitSeconds: 30,
  primitive: {
    id: 'call',
    type: 'multiple_choice',
    content: {
      prompt: 'What is the best answer?',
      options: [
        { id: 'alpha', label: 'Alpha' },
        { id: 'beta', label: 'Beta' },
      ],
      correctOptionId: 'alpha',
      explanation: 'Alpha is correct.',
    },
  },
  clues: [
    {
      id: 'history',
      title: 'History',
      primitive: { id: 'history-text', type: 'rich_text', content: {} },
    },
  ],
  feedback: {
    correct: 'Correct.',
    incorrect: 'Not quite.',
    answerTemplate: 'Correct answer: {answer}.',
  },
})

describe('game scoring', () => {
  it('scores the worked 0.85 accuracy example at 40% of the time limit', () => {
    expect(
      scoreRound(
        {
          accuracy: 0.85,
          elapsedMs: 16_000,
          timeLimitSeconds: 40,
          timedOut: false,
          paidClueCount: 0,
          difficulty,
        },
        scoring,
      ),
    ).toEqual({
      accuracy: 0.85,
      basePoints: 850,
      speedBonus: 100,
      clueCost: 0,
      points: 950,
      correct: true,
    })
  })

  it('disables the speed bonus on timeout while retaining earned accuracy points', () => {
    const result = scoreRound(
      {
        accuracy: 0.85,
        elapsedMs: 5_000,
        timeLimitSeconds: 40,
        timedOut: true,
        paidClueCount: 0,
        difficulty,
      },
      scoring,
    )

    expect(result).toMatchObject({ basePoints: 850, speedBonus: 0, points: 850 })
  })

  it('subtracts paid clue costs and floors the score at zero', () => {
    expect(clueCost(3, difficulty.clueCostPoints)).toBe(300)
    expect(
      scoreRound(
        {
          accuracy: 0.1,
          elapsedMs: 30_000,
          timeLimitSeconds: 30,
          timedOut: false,
          paidClueCount: 2,
          difficulty,
        },
        scoring,
      ).points,
    ).toBe(0)
  })

  it.each([
    ['first tier boundary', 0.5, 10_000, true, false, 150],
    ['second tier boundary', 0.5, 20_000, true, false, 100],
    ['after the final tier', 0.5, 20_001, true, false, 0],
    ['below accuracy threshold', 0.499, 5_000, true, false, 0],
    ['disabled by difficulty', 1, 5_000, false, false, 0],
    ['disabled by timeout', 1, 5_000, true, true, 0],
  ] as const)('handles the %s', (_label, accuracy, elapsedMs, enabled, timedOut, expected) => {
    expect(
      resolveSpeedBonus(
        {
          accuracy,
          elapsedMs,
          timeLimitSeconds: 40,
          timedOut,
          enabled,
        },
        scoring,
      ),
    ).toBe(expected)
  })

  it('classifies accuracy at the configured threshold', () => {
    expect(classifyRound(0.8, scoring)).toBe(true)
    expect(classifyRound(0.799, scoring)).toBe(false)
  })

  it('uses primitive evaluation and timeout evaluation for evaluator mechanics', () => {
    expect(
      resolveRoundAccuracy({
        round: clinicalRound,
        response: 'alpha',
        timedOut: false,
      }),
    ).toBe(1)
    expect(
      resolveRoundAccuracy({
        round: clinicalRound,
        response: 'alpha',
        timedOut: true,
      }),
    ).toBe(0)
  })
})
