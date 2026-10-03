import { describe, expect, it } from 'vitest'

import type { CaseAttemptRecord } from '@/content/schema'
import {
  selectCaseCompare,
  selectCaseLabCards,
  selectCaseResults,
  selectFeaturedCase,
} from '@/state/selectors'
import { fixtureCase, makeCaseRegistry } from '@/test/caseFixtures'
import { makeValidContentBundle } from '@/test/contentFixtures'
import { validateContentBundle } from '@/content/loader'

const attempt = (attemptId: string, total: number): CaseAttemptRecord => ({
  resultVersion: 7,
  attemptId,
  tier: 'foundation',
  total,
  anatomy: 0.8,
  diagnosis: 0.9,
  speed: 0,
  perStepSpeed: 0,
  caseSpeed: 0,
  speedModel: 'time_eligible',
  speedEligibility: { minStepScore: 0.5, eligibleSteps: 2, totalScoredSteps: 2 },
  clueCostPoints: 2,
  speedScored: false,
  timingMode: 'none',
  weights: { anatomy: 0.5, diagnosis: 0.5, speed: 0 },
  actualAwardedXp: 30,
  actualAwardedXpSource: 'gamification_activity_result',
  durationSeconds: 180,
  openedClueIds: ['clue-context'],
  reviewedClueIds: [],
  evidence: { pinned: [] },
  differential: {},
  timeoutCreditApplied: false,
  stepResults: [],
  completedAt: '2026-10-01T10:00:00.000Z',
})

describe('Case Lab selectors', () => {
  it('builds ordered, unlocked cards from configuration and learner progress', () => {
    const registry = makeCaseRegistry()
    const cards = selectCaseLabCards(
      {
        caseProgress: {
          [fixtureCase.id]: { completions: 2, bestTotal: 91, lastCompletedAt: null },
        },
        caseAttempts: { [fixtureCase.id]: [attempt('attempt-1', 84), attempt('attempt-2', 91)] },
      },
      registry,
    )

    expect(cards).toEqual([
      expect.objectContaining({
        caseId: fixtureCase.id,
        tierLabel: 'Basic',
        timing: 'none',
        organSystemLabel: 'Generic',
        bestScore: 91,
        attempts: 2,
        daily: true,
      }),
    ])
    expect(selectFeaturedCase({ caseProgress: {}, caseAttempts: {} }, registry)?.caseId).toBe(
      fixtureCase.id,
    )
  })

  it('appends the configured daily quick case without changing featured ordering', () => {
    const registry = makeCaseRegistry()
    const quickCase = { ...fixtureCase, id: 'quick-case', title: 'Quick case' }
    const registryWithQuickCase = {
      ...registry,
      appConfig: {
        ...registry.appConfig,
        caseLab: {
          ...registry.appConfig.caseLab!,
          dailyQuickCaseId: quickCase.id,
        },
      },
      cases: [...registry.cases, quickCase],
      caseById: new Map([...registry.caseById, [quickCase.id, quickCase] as const]),
    }

    const cards = selectCaseLabCards({ caseProgress: {}, caseAttempts: {} }, registryWithQuickCase)

    expect(cards.map(({ caseId }) => caseId)).toEqual([fixtureCase.id, quickCase.id])
    expect(cards.map(({ daily }) => daily)).toEqual([false, true])
  })

  it('returns empty views when Case Lab content is not configured', () => {
    const registry = validateContentBundle(makeValidContentBundle())
    expect(selectCaseLabCards({ caseProgress: {}, caseAttempts: {} }, registry)).toEqual([])
    expect(selectFeaturedCase({ caseProgress: {}, caseAttempts: {} }, registry)).toBeNull()
  })

  it('selects a saved result and comparison history without mutating attempts', () => {
    const first = attempt('attempt-1', 84)
    const second = attempt('attempt-2', 92)
    const state = { caseAttempts: { [fixtureCase.id]: [first, second] } }

    expect(selectCaseResults(state, 'attempt-2')).toEqual({
      caseId: fixtureCase.id,
      attempt: second,
    })
    expect(selectCaseCompare(state, fixtureCase.id, 'attempt-2')).toEqual({
      caseId: fixtureCase.id,
      attempt: second,
      history: [first],
      bestScore: 92,
    })
    expect(selectCaseCompare(state, fixtureCase.id, 'missing')).toBeNull()
    expect(state.caseAttempts[fixtureCase.id]).toEqual([first, second])
  })
})
