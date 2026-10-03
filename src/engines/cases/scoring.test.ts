import { describe, expect, it } from 'vitest'

import {
  calculateCaseScore,
  type CaseScoreInput,
  type CaseScoringConfig,
  type CaseScoringStepInput,
} from '@/engines/cases/scoring'

const defaultConfig: CaseScoringConfig = {
  weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
  speedBlend: { perStep: 0.5, perCase: 0.5 },
  defaultStepTargetSeconds: 20,
  defaultStepMaxSeconds: 90,
  cluePenalty: { perOptionalClue: 2, cap: 10 },
}

const baseInput: CaseScoreInput = {
  timingMode: 'stopwatch',
  steps: [],
  clues: [],
  openedClueIds: [],
  clueOpenContexts: {},
  durationMs: 300_000,
  caseTargetSeconds: 300,
  caseMaxSeconds: 600,
  config: defaultConfig,
}

const step = (
  component: CaseScoringStepInput['component'],
  firstAttemptScore: number,
  elapsedMs = 20_000,
  overrides: Partial<CaseScoringStepInput> = {},
): CaseScoringStepInput => ({
  component,
  scored: true,
  firstAttemptScore,
  elapsedMs,
  ...overrides,
})

describe('calculateCaseScore', () => {
  it('applies the exact default component, speed, and total formula', () => {
    const result = calculateCaseScore({
      ...baseInput,
      steps: [step('anatomy', 1), step('diagnosis', 0.5, 55_000)],
    })

    expect(result).toEqual({
      anatomy: 1,
      diagnosis: 0.5,
      perStepSpeed: 0.625,
      caseSpeed: 0.75,
      speed: 0.6875,
      speedScored: true,
      timingMode: 'stopwatch',
      penalty: 0,
      total: 74,
      weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
      durationSeconds: 300,
      openedClueIds: [],
    })
  })

  it.each([
    {
      name: 'default equal component weights',
      weights: defaultConfig.weights,
      expectedWeights: { anatomy: 0.5, diagnosis: 0.5, speed: 0 },
      expectedTotal: 75,
    },
    {
      name: 'custom unequal component weights',
      weights: { anatomy: 0.2, diagnosis: 0.6, speed: 0.2 },
      expectedWeights: { anatomy: 0.25, diagnosis: 0.75, speed: 0 },
      expectedTotal: 63,
    },
  ])(
    'redistributes speed proportionally for $name when timing is disabled',
    ({ weights, expectedWeights, expectedTotal }) => {
      const result = calculateCaseScore({
        ...baseInput,
        timingMode: 'none',
        config: { ...defaultConfig, weights },
        steps: [step('anatomy', 1), step('diagnosis', 0.5)],
      })

      expect(result.weights.anatomy).toBeCloseTo(expectedWeights.anatomy)
      expect(result.weights.diagnosis).toBeCloseTo(expectedWeights.diagnosis)
      expect(result.weights.speed).toBe(0)
      expect(result).toMatchObject({
        anatomy: 1,
        diagnosis: 0.5,
        perStepSpeed: 0,
        caseSpeed: 0,
        speed: 0,
        total: expectedTotal,
      })
    },
  )

  it('counts each opened optional clue once and caps the penalty', () => {
    const clues = Array.from({ length: 7 }, (_, index) => ({
      id: `optional-${index}`,
      essential: false,
    }))
    const result = calculateCaseScore({
      ...baseInput,
      steps: [step('anatomy', 1), step('diagnosis', 1)],
      clues: [...clues, { id: 'essential', essential: true }],
      openedClueIds: [
        'optional-0',
        'optional-1',
        'optional-2',
        'optional-3',
        'optional-4',
        'optional-5',
        'optional-5',
        'essential',
        'unknown',
      ],
      clueOpenContexts: Object.fromEntries(
        clues.map(({ id }) => [id, { context: 'browse' as const, beforeResponse: true }]),
      ),
    })

    expect(result.openedClueIds).toEqual([
      'optional-0',
      'optional-1',
      'optional-2',
      'optional-3',
      'optional-4',
      'optional-5',
      'essential',
      'unknown',
    ])
    expect(result.penalty).toBe(10)
    expect(result.total).toBe(90)
  })

  it('penalizes only optional clues first opened for entry or browsing before a response', () => {
    const result = calculateCaseScore({
      ...baseInput,
      timingMode: 'none',
      steps: [step('anatomy', 1), step('diagnosis', 1)],
      clues: [
        { id: 'entry', essential: false },
        { id: 'browse', essential: false },
        { id: 'after-response', essential: false },
        { id: 'remediation', essential: false },
        { id: 'essential', essential: true },
        { id: 'legacy', essential: false },
      ],
      openedClueIds: ['entry', 'browse', 'after-response', 'remediation', 'essential', 'legacy'],
      clueOpenContexts: {
        entry: { context: 'entry', beforeResponse: true },
        browse: { context: 'browse', beforeResponse: true },
        'after-response': { context: 'browse', beforeResponse: false },
        remediation: { context: 'remediation', beforeResponse: false },
        essential: { context: 'browse', beforeResponse: true },
      },
    })

    expect(result.penalty).toBe(4)
    expect(result.total).toBe(96)
    expect(result.openedClueIds).toHaveLength(6)
  })

  it.each([
    {
      name: 'a timed-out step',
      input: {
        steps: [step('anatomy', 1, 1_000, { timedOut: true }), step('diagnosis', 1)],
        durationMs: 300_000,
      },
      expected: { perStepSpeed: 0.5, caseSpeed: 1, speed: 0.75, total: 95 },
    },
    {
      name: 'an expired case clock',
      input: {
        steps: [step('anatomy', 1), step('diagnosis', 1)],
        durationMs: 300_000,
        caseClockExpired: true,
      },
      expected: { perStepSpeed: 1, caseSpeed: 0, speed: 0.5, total: 90 },
    },
    {
      name: 'both timeout conditions together',
      input: {
        steps: [step('anatomy', 1, 1_000, { timedOut: true }), step('diagnosis', 1)],
        durationMs: 600_000,
        caseClockExpired: true,
      },
      expected: { perStepSpeed: 0.5, caseSpeed: 0, speed: 0.25, total: 85 },
    },
  ])('sets the relevant speed contribution to zero for $name', ({ input, expected }) => {
    expect(calculateCaseScore({ ...baseInput, ...input })).toMatchObject(expected)
  })

  it('awards no speed for a fast wrong answer', () => {
    const result = calculateCaseScore({
      ...baseInput,
      durationMs: 0,
      steps: [step('anatomy', 0, 0)],
    })

    expect(result).toMatchObject({
      anatomy: 0,
      diagnosis: 0,
      perStepSpeed: 0,
      caseSpeed: 0,
      speed: 0,
      total: 0,
    })
  })

  it.each([
    { name: 'before target', elapsedMs: 0, expected: 1 },
    { name: 'at target', elapsedMs: 20_000, expected: 1 },
    { name: 'between target and maximum', elapsedMs: 55_000, expected: 0.5 },
    { name: 'at maximum', elapsedMs: 90_000, expected: 0 },
    { name: 'after maximum', elapsedMs: 120_000, expected: 0 },
  ])('clamps per-step speed $name', ({ elapsedMs, expected }) => {
    const result = calculateCaseScore({
      ...baseInput,
      steps: [step('anatomy', 1, elapsedMs)],
    })

    expect(result.perStepSpeed).toBe(expected)
  })

  it.each([
    { name: 'before target', durationMs: 0, expected: 1 },
    { name: 'at target', durationMs: 300_000, expected: 1 },
    { name: 'between target and maximum', durationMs: 450_000, expected: 0.5 },
    { name: 'at maximum', durationMs: 600_000, expected: 0 },
    { name: 'after maximum', durationMs: 700_000, expected: 0 },
  ])('clamps case speed $name', ({ durationMs, expected }) => {
    const result = calculateCaseScore({
      ...baseInput,
      durationMs,
      steps: [step('anatomy', 1), step('diagnosis', 1)],
    })

    expect(result.caseSpeed).toBe(expected)
  })

  it('uses custom component weights, step weights, targets, and speed blend', () => {
    const result = calculateCaseScore({
      ...baseInput,
      durationMs: 450_000,
      config: {
        ...defaultConfig,
        weights: { anatomy: 0.2, diagnosis: 0.3, speed: 0.5 },
        speedBlend: { perStep: 0.25, perCase: 0.75 },
      },
      steps: [
        step('anatomy', 1, 10_000, {
          weight: 1,
          targetSeconds: 10,
          maxSeconds: 30,
        }),
        step('anatomy', 0, 0, { weight: 3 }),
        step('diagnosis', 1),
      ],
    })

    expect(result.anatomy).toBe(0.25)
    expect(result.diagnosis).toBe(1)
    expect(result.perStepSpeed).toBeCloseTo(2 / 3)
    expect(result.caseSpeed).toBe(0.3125)
    expect(result.speed).toBeCloseTo(0.4010416667)
    expect(result.total).toBe(55)
  })

  it('excludes unscored exploration from component and per-step speed means', () => {
    const result = calculateCaseScore({
      ...baseInput,
      steps: [
        step('anatomy', 0, 90_000, {
          scored: false,
          weight: 100,
          timedOut: true,
        }),
        step('anatomy', 1),
        step('diagnosis', 1),
      ],
    })

    expect(result).toMatchObject({
      anatomy: 1,
      diagnosis: 1,
      perStepSpeed: 1,
      caseSpeed: 1,
      speed: 1,
      total: 100,
    })
  })

  it.each([
    {
      name: 'an absent anatomy component',
      steps: [step('diagnosis', 1)],
      expected: { anatomy: 0, diagnosis: 1, total: 50 },
    },
    {
      name: 'an absent diagnosis component',
      steps: [step('anatomy', 1)],
      expected: { anatomy: 1, diagnosis: 0, total: 50 },
    },
    {
      name: 'no scored components',
      steps: [step('none', 1)],
      expected: { anatomy: 0, diagnosis: 0, total: 0 },
    },
  ])('handles $name deterministically', ({ steps, expected }) => {
    const result = calculateCaseScore({
      ...baseInput,
      timingMode: 'none',
      steps,
    })

    expect(result).toMatchObject(expected)
  })

  it('returns a finite conservative result for invalid runtime values', () => {
    const result = calculateCaseScore({
      ...baseInput,
      durationMs: Number.NaN,
      caseTargetSeconds: 100,
      caseMaxSeconds: 100,
      steps: [
        step('anatomy', Number.POSITIVE_INFINITY, Number.NaN, {
          weight: Number.NaN,
          targetSeconds: 50,
          maxSeconds: 40,
        }),
        step('diagnosis', -1, -1),
      ],
      config: {
        ...defaultConfig,
        weights: { anatomy: Number.NaN, diagnosis: -1, speed: Number.POSITIVE_INFINITY },
        speedBlend: { perStep: Number.NaN, perCase: -1 },
        defaultStepTargetSeconds: Number.NaN,
        defaultStepMaxSeconds: Number.NaN,
        cluePenalty: { perOptionalClue: Number.NaN, cap: Number.POSITIVE_INFINITY },
      },
    })

    expect(result).toEqual({
      anatomy: 0,
      diagnosis: 0,
      speed: 0,
      perStepSpeed: 0,
      caseSpeed: 0,
      speedScored: true,
      timingMode: 'stopwatch',
      penalty: 0,
      total: 0,
      weights: { anatomy: 0, diagnosis: 0, speed: 0 },
      durationSeconds: 0,
      openedClueIds: [],
    })
  })
})
