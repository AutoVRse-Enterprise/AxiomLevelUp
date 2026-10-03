import { describe, expect, it } from 'vitest'

import type { AppConfig } from '@/content/schema'
import { resolveWeeklyChallengeDestination } from '@/engines/learning/weeklyChallengeDestination'
import { learnerDataSnapshot, useLearnerStore } from '@/state/learnerStore'
import { makeCaseRegistry } from '@/test/caseFixtures'

const registry = makeCaseRegistry()

function weeklyChallenge(
  progressRule: NonNullable<AppConfig['challenges'][number]['progressRule']>,
): AppConfig['challenges'][number] {
  return {
    id: 'weekly-focus',
    type: 'weekly',
    title: 'Weekly focus',
    description: 'Complete the goal.',
    estimatedMinutes: 20,
    rewardXp: 100,
    itemCount: 1,
    target: 1,
    progressRule,
    items: [],
  }
}

function advancedState() {
  useLearnerStore.getState().replaceWithSeed(registry.seed)
  return learnerDataSnapshot(useLearnerStore.getState())
}

describe('weekly challenge destination resolver', () => {
  it('routes to the next unlocked incomplete lesson matching the criterion', () => {
    const destination = resolveWeeklyChallengeDestination(
      weeklyChallenge({
        type: 'lessons_completed',
        count: 2,
        lessonIds: ['imaging-orientation', 'endpoint-strategy'],
      }),
      advancedState(),
      registry,
    )

    expect(destination).toEqual({
      to: '/learn/courses/clinical-research/lessons/endpoint-strategy',
      context: 'Next: Endpoint Strategy',
    })
  })

  it('does not route to a matching lesson while it is locked', () => {
    const destination = resolveWeeklyChallengeDestination(
      weeklyChallenge({
        type: 'lessons_completed',
        count: 1,
        lessonIds: ['imaging-case-practice'],
      }),
      advancedState(),
      registry,
    )

    expect(destination).toEqual({
      to: '/learn',
      context: 'Choose a learning activity',
    })
  })

  it('falls back after all matching activities are completed', () => {
    const state = advancedState()
    state.lessonProgress['endpoint-strategy'] = {
      status: 'completed',
      stars: 2,
      bestScore: 80,
      attempts: 1,
      lastPrimitiveIndex: 0,
      completedAt: '2026-10-01T00:00:00.000Z',
    }

    expect(
      resolveWeeklyChallengeDestination(
        weeklyChallenge({
          type: 'lessons_completed',
          count: 2,
          lessonIds: ['imaging-orientation', 'endpoint-strategy'],
        }),
        state,
        registry,
      ),
    ).toEqual({ to: '/learn', context: 'Choose a learning activity' })
  })

  it('uses honest collection routes when a criterion has no specific activity', () => {
    expect(
      resolveWeeklyChallengeDestination(
        weeklyChallenge({ type: 'weekly_goals_met', count: 2 }),
        advancedState(),
        registry,
      ),
    ).toEqual({ to: '/learn', context: 'Choose a learning activity' })

    expect(
      resolveWeeklyChallengeDestination(
        weeklyChallenge({ type: 'challenges_completed', count: 2 }),
        advancedState(),
        registry,
      ),
    ).toEqual({
      to: '/challenge/daily-imaging-interpretation/play',
      context: 'Next: Fixture daily question',
    })
  })
})
