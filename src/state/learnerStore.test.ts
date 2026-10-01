import advancedSeedData from '../../public/content/seeds/advanced.json'
import freshSeedData from '../../public/content/seeds/fresh.json'
import { beforeEach, describe, expect, it } from 'vitest'

import { learnerSeedSchema } from '@/content/schema'
import { useLearnerStore } from '@/state/learnerStore'
import { idbStorage } from '@/state/persistence/idbStorage'

const advancedSeed = learnerSeedSchema.parse(advancedSeedData)
const freshSeed = learnerSeedSchema.parse(freshSeedData)

describe('learner store persistence', () => {
  beforeEach(async () => {
    await useLearnerStore.persist.clearStorage()
    useLearnerStore.getState().replaceWithSeed(freshSeed)
  })

  it('round-trips learner state through IndexedDB', async () => {
    useLearnerStore.getState().replaceWithSeed(advancedSeed)
    useLearnerStore.getState().addXp(25)

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
    useLearnerStore.getState().addXp(500)

    useLearnerStore.getState().replaceWithSeed(advancedSeed)

    expect(useLearnerStore.getState().xp).toEqual(advancedSeed.xp)
    expect(useLearnerStore.getState().learner).toEqual(advancedSeed.learner)
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
})
