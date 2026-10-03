import advancedSeedData from '../../public/content/seeds/advanced.json'
import freshSeedData from '../../public/content/seeds/fresh.json'
import { beforeEach, describe, expect, it } from 'vitest'

import { learnerSeedSchema } from '@/content/schema'
import { learnerDataSnapshot, migrateLearnerState, useLearnerStore } from '@/state/learnerStore'
import { idbStorage } from '@/state/persistence/idbStorage'

const advancedSeed = learnerSeedSchema.parse(advancedSeedData)
const freshSeed = learnerSeedSchema.parse(freshSeedData)

function addTestXp(amount: number) {
  const state = learnerDataSnapshot(useLearnerStore.getState())
  state.xp = {
    total: state.xp.total + amount,
    weekly: state.xp.weekly + amount,
  }
  useLearnerStore.getState().applyEventState(state)
}

describe('learner store persistence', () => {
  beforeEach(async () => {
    await useLearnerStore.persist.clearStorage()
    useLearnerStore.getState().replaceWithSeed(freshSeed)
  })

  it('round-trips learner state through IndexedDB', async () => {
    useLearnerStore.getState().replaceWithSeed(advancedSeed)
    addTestXp(25)

    await expect
      .poll(() => idbStorage.getItem('learner'))
      .toSatisfy((value) => value?.includes('"total":4845') ?? false)
    const persisted = await idbStorage.getItem('learner')

    useLearnerStore.getState().replaceWithSeed(freshSeed)
    await idbStorage.setItem('learner', persisted ?? '')
    await useLearnerStore.persist.rehydrate()

    expect(useLearnerStore.getState().seedProfile).toBe('advanced')
    expect(useLearnerStore.getState().xp).toEqual({ total: 4845, weekly: 965 })
  })

  it('resetting to the advanced seed discards mutations', () => {
    useLearnerStore.getState().replaceWithSeed(advancedSeed)
    addTestXp(500)
    useLearnerStore.setState((state) => ({
      gamification: {
        ...state.gamification,
        celebrations: [
          {
            id: 'test-level',
            type: 'level',
            from: 7,
            to: 8,
          },
        ],
      },
    }))

    useLearnerStore.getState().replaceWithSeed(advancedSeed)

    expect(useLearnerStore.getState().xp).toEqual(advancedSeed.xp)
    expect(useLearnerStore.getState().learner).toEqual(advancedSeed.learner)
    expect(useLearnerStore.getState().gamification.celebrations).toEqual([])
    expect(useLearnerStore.getState().gamification.counters).toEqual(
      advancedSeed.gamification.counters,
    )
    expect(useLearnerStore.getState().initialized).toBe(true)
  })

  it('stores internal lesson progress and removes it on demo reset', () => {
    useLearnerStore.setState((state) => ({
      lessonProgress: {
        ...state.lessonProgress,
        'primitive-showcase': {
          status: 'current',
          stars: 0,
          bestScore: null,
          attempts: 1,
          lastPrimitiveIndex: 4,
          completedAt: null,
        },
      },
    }))

    expect(useLearnerStore.getState().lessonProgress['primitive-showcase']).toMatchObject({
      status: 'current',
      lastPrimitiveIndex: 4,
    })

    useLearnerStore.getState().replaceWithSeed(advancedSeed)
    expect(useLearnerStore.getState().lessonProgress['primitive-showcase']).toBeUndefined()
  })

  it.each([3, 4])('migrates learner state v%i to empty v7 case state', (stateVersion) => {
    const legacy = structuredClone(freshSeed) as unknown as Record<string, unknown>
    legacy.stateVersion = stateVersion
    delete legacy.caseProgress
    delete legacy.caseAttempts
    const gamification = legacy.gamification as Record<string, unknown>
    delete gamification.caseRewards
    const counters = gamification.counters as Record<string, unknown>
    delete counters.caseCompletions
    delete counters.caseCompletionsByTier
    const stats = legacy.stats as Record<string, unknown>
    delete stats.casesCompleted

    const migrated = migrateLearnerState(legacy)

    expect(migrated.stateVersion).toBe(7)
    expect(migrated.caseProgress).toEqual({})
    expect(migrated.caseAttempts).toEqual({})
    expect(migrated.gamification.caseRewards).toEqual({})
    expect(migrated.gamification.counters.caseCompletions).toEqual({})
    expect(migrated.gamification.counters.caseCompletionsByTier).toEqual({
      foundation: 0,
      intermediate: 0,
      advanced: 0,
    })
    expect(migrated.stats.casesCompleted).toBe(0)
  })

  it('marks v5 attempts as legacy without inventing unavailable result details', () => {
    const legacy = structuredClone(advancedSeed) as unknown as Record<string, unknown>
    legacy.stateVersion = 5
    const attempts = (legacy.caseAttempts as Record<string, Array<Record<string, unknown>>>)[
      'asthma-foundation'
    ]!
    const source = attempts[0]!
    delete source.resultVersion
    delete source.perStepSpeed
    delete source.caseSpeed
    delete source.clueCostPoints
    delete source.speedScored
    delete source.timingMode
    delete source.weights
    delete source.actualAwardedXp
    delete source.actualAwardedXpSource
    delete source.speedModel
    delete source.speedEligibility
    delete source.reviewedClueIds
    delete source.evidence
    delete source.differential
    delete source.timeoutCreditApplied

    const migrated = migrateLearnerState(legacy)
    const attempt = migrated.caseAttempts['asthma-foundation']![0]!

    expect(migrated.stateVersion).toBe(7)
    expect(attempt.resultVersion).toBe(5)
    expect(attempt).not.toHaveProperty('perStepSpeed')
    expect(attempt).not.toHaveProperty('caseSpeed')
    expect(attempt).not.toHaveProperty('clueCostPoints')
    expect(attempt).not.toHaveProperty('actualAwardedXp')
  })

  it('preserves result-v6 attempts as legacy records without v7 placeholders', () => {
    const legacy = structuredClone(advancedSeed) as unknown as Record<string, unknown>
    const attempts = (legacy.caseAttempts as Record<string, Array<Record<string, unknown>>>)[
      'exacerbation-advanced'
    ]!
    const source = attempts[0]!
    source.resultVersion = 6
    delete source.speedModel
    delete source.speedEligibility
    delete source.reviewedClueIds
    delete source.evidence
    delete source.differential
    delete source.timeoutCreditApplied

    const migrated = migrateLearnerState(legacy)
    const attempt = migrated.caseAttempts['exacerbation-advanced']![0]!

    expect(migrated.stateVersion).toBe(7)
    expect(attempt.resultVersion).toBe(6)
    expect(attempt).not.toHaveProperty('speedModel')
    expect(attempt).not.toHaveProperty('reviewedClueIds')
    expect(attempt).not.toHaveProperty('timeoutCreditApplied')
  })
})
