import { describe, expect, it } from 'vitest'

import { gameDocumentSchema, roundDocumentSchema } from './game'

const primitive = {
  id: 'answer',
  type: 'multiple_choice',
  content: {
    prompt: 'Choose the best interpretation.',
    options: [
      { id: 'a', label: 'Airflow obstruction' },
      { id: 'b', label: 'Normal study' },
    ],
    correctOptionId: 'a',
  },
  completion: { mode: 'answer' },
}

const round = {
  schemaVersion: '0.1',
  roundVersion: '1',
  id: 'fixture-call',
  title: 'Make the call',
  mechanic: 'clinical_call',
  intro: 'Review the evidence.',
  timeLimitSeconds: 45,
  primitive,
  feedback: {
    correct: 'The findings fit.',
    incorrect: 'Review the airflow pattern.',
    answerTemplate: 'Correct answer: {answer}.',
  },
}

describe('game content schemas', () => {
  it('applies round defaults', () => {
    expect(roundDocumentSchema.parse(round)).toMatchObject({
      clues: [],
      difficulty: {},
      primitiveByOptionSet: {},
    })
  })

  it('rejects unknown round keys with a precise path', () => {
    const result = roundDocumentSchema.safeParse({ ...round, hardCodedPoints: 1000 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([])
  })

  it('requires a default difficulty listed by the game', () => {
    const result = gameDocumentSchema.safeParse({
      schemaVersion: '0.1',
      gameVersion: '1',
      id: 'fixture-game',
      title: 'Fixture game',
      tagline: 'Two quick decisions.',
      organSystem: 'respiratory',
      estimatedSeconds: 90,
      slots: [{ id: 'first', pool: ['fixture-call'] }],
      difficulties: ['challenge'],
      defaultDifficulty: 'expert',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['defaultDifficulty'])
  })
})
