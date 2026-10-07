import { describe, expect, it } from 'vitest'

import type { GameMessageRule } from '@/content/schema/game'

import {
  revealViewModel,
  roundStrip,
  selectResultMessage,
  summarizeRun,
  type GameRoundResult,
} from './results'

const rounds: GameRoundResult[] = [
  {
    slotId: 'slot-1',
    roundId: 'round-1',
    mechanic: 'spatial_look',
    correct: true,
    points: 900,
    elapsedMs: 20_400,
  },
  {
    slotId: 'slot-2',
    roundId: 'round-2',
    mechanic: 'clinical_call',
    correct: false,
    points: 900,
    elapsedMs: 31_100,
  },
  {
    slotId: 'slot-3',
    roundId: 'round-3',
    mechanic: 'spot_finding',
    correct: true,
    points: 650,
    elapsedMs: 10_000,
  },
]

describe('game results', () => {
  it('summarizes a run and keeps the earliest best round when points tie', () => {
    expect(summarizeRun(rounds, 'challenge')).toEqual({
      total: 2450,
      correctCount: 2,
      roundCount: 3,
      totalSeconds: 62,
      bestRound: {
        index: 0,
        slotId: 'slot-1',
        roundId: 'round-1',
        points: 900,
      },
      difficulty: 'challenge',
    })
  })

  it('summarizes an empty run without inventing a best round', () => {
    expect(summarizeRun([], 'warmup')).toEqual({
      total: 0,
      correctCount: 0,
      roundCount: 0,
      totalSeconds: 0,
      bestRound: null,
      difficulty: 'warmup',
    })
  })

  it('uses the first matching ratio, last-round and difficulty rule', () => {
    const rules: GameMessageRule[] = [
      {
        when: { minCorrectRatio: 0.5, difficulty: 'expert' },
        text: 'Expert finish.',
      },
      {
        when: { minCorrectRatio: 0.5, lastRoundCorrect: true },
        text: 'Strong recovery.',
      },
      {
        when: { minCorrectRatio: 0.5 },
        text: 'Solid run.',
      },
      { when: {}, text: 'Try again.' },
    ]

    expect(
      selectResultMessage(rules, { correctCount: 2, roundCount: 4, difficulty: 'challenge' }, true),
    ).toBe('Strong recovery.')
    expect(
      selectResultMessage(rules, { correctCount: 2, roundCount: 4, difficulty: 'expert' }, true),
    ).toBe('Expert finish.')
    expect(
      selectResultMessage(
        rules,
        { correctCount: 1, roundCount: 4, difficulty: 'challenge' },
        false,
      ),
    ).toBe('Try again.')
  })

  it('builds compact round and reveal view models', () => {
    expect(roundStrip(rounds)).toEqual([
      {
        index: 0,
        slotId: 'slot-1',
        roundId: 'round-1',
        mechanic: 'spatial_look',
        outcome: 'correct',
        points: 900,
      },
      {
        index: 1,
        slotId: 'slot-2',
        roundId: 'round-2',
        mechanic: 'clinical_call',
        outcome: 'incorrect',
        points: 900,
      },
      {
        index: 2,
        slotId: 'slot-3',
        roundId: 'round-3',
        mechanic: 'spot_finding',
        outcome: 'correct',
        points: 650,
      },
    ])

    expect(
      revealViewModel(
        rounds[1]!,
        {
          correct: 'The pattern fits.',
          incorrect: 'Use the branching pattern.',
          answerTemplate: 'Correct answer: {answer}.',
        },
        'Right lower lobe',
      ),
    ).toEqual({
      outcome: 'incorrect',
      answerLine: 'Correct answer: Right lower lobe.',
      feedbackSentence: 'Use the branching pattern.',
      points: 900,
      breakdown: { basePoints: 900, speedBonus: 0, clueCost: 0 },
    })
  })
})
