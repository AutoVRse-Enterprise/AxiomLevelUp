import freshSeedData from '../../public/content/seeds/fresh.json'
import { beforeEach, describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import { learnerSeedSchema } from '@/content/schema'
import { clearEventSubscribersForTests, emitEvent, subscribeToEvents } from '@/events/bus'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import type { LearnerEvent } from '@/events/types'
import { useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

describe('learner event handlers', () => {
  beforeEach(() => {
    stopLearningEventHandlersForTests()
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(learnerSeedSchema.parse(freshSeedData))
  })

  it('commits once and does not reduce informational output events', () => {
    const events: LearnerEvent[] = []
    initializeLearningProgressHandlers(registry)
    subscribeToEvents((event) => events.push(event))

    emitEvent({ event: 'demo_command', command: 'grant_xp', amount: 25 })

    expect(useLearnerStore.getState().xp.total).toBe(25)
    expect(events.filter(({ event }) => event === 'xp_awarded')).toHaveLength(1)
  })

  it('queues re-entrant course completion follow-ups', () => {
    const seed = learnerSeedSchema.parse(freshSeedData)
    const course = registry.courseById.get('data-interpretation')!
    for (const lesson of course.lessons) {
      seed.lessonProgress[lesson.id] = {
        status: lesson.id === 'dose-response-curves' ? 'current' : 'completed',
        stars: 1,
        bestScore: 70,
        attempts: 1,
        lastPrimitiveIndex: 0,
        completedAt: lesson.id === 'dose-response-curves' ? null : '2026-10-01T09:00:00+05:30',
      }
    }
    useLearnerStore.getState().replaceWithSeed(seed)
    initializeLearningProgressHandlers(registry)

    emitEvent({
      event: 'lesson_completed',
      courseId: course.id,
      lessonId: 'dose-response-curves',
      score: 80,
      accuracy: 80,
      correctCount: 1,
      scoredCount: 1,
      durationSeconds: 60,
    })

    expect(useLearnerStore.getState().stats.coursesCompleted).toBe(1)
  })
})
