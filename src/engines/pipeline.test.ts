import freshSeedData from '../../public/content/seeds/fresh.json'
import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import { learnerSeedSchema } from '@/content/schema'
import { reduceLearnerEvent } from '@/engines/pipeline'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import { migrateLearnerState, type LearnerData } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

function freshState(): LearnerData {
  const state = structuredClone(learnerSeedSchema.parse(freshSeedData))
  const { schemaVersion, ...data } = state
  void schemaVersion
  return data
}

function event(draft: LearnerEventDraft, occurredAt = '2026-10-02T09:00:00+05:30'): LearnerEvent {
  return { ...draft, id: crypto.randomUUID(), occurredAt } as LearnerEvent
}

function reduce(state: LearnerData, draft: LearnerEventDraft, occurredAt?: string) {
  return reduceLearnerEvent(state, event(draft, occurredAt), registry)
}

describe('learner event pipeline', () => {
  it('awards first-attempt, completion, perfect and badge XP once', () => {
    let state = freshState()
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      attempt: 1,
      resumed: false,
    }).state
    const answer = reduce(state, {
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'thoracic-ct',
      questionId: 'showcase-question',
      primitiveType: 'multiple_choice',
      conceptIds: ['image-windowing'],
      score: 1,
      correct: true,
      attempt: 1,
      difficulty: 'intermediate',
    })
    state = answer.state
    expect(state.xp.total).toBe(10)
    expect(state.mastery['image-windowing']?.score).toBe(54)
    expect(answer.followUps).toContainEqual(
      expect.objectContaining({ event: 'xp_awarded', reason: 'question', amount: 10 }),
    )

    const completion = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      score: 100,
      accuracy: 100,
      correctCount: 1,
      scoredCount: 1,
      durationSeconds: 60,
    })
    state = completion.state
    expect(state.xp.total).toBe(170)
    expect(state.lessonProgress['thoracic-ct']?.stars).toBe(3)
    expect(state.badges['perfect-lesson']?.unlockedAt).not.toBeNull()
    expect(state.gamification.lastActivityResult).toEqual(
      expect.objectContaining({
        activityId: 'thoracic-ct',
        xpEarned: 170,
        stars: 3,
        masteryDelta: { 'image-windowing': 4 },
      }),
    )
  })

  it('treats completed lesson replay as revision without repaying completion', () => {
    let state = freshState()
    state.lessonProgress['imaging-orientation'] = {
      status: 'completed',
      stars: 3,
      bestScore: 100,
      attempts: 1,
      lastPrimitiveIndex: 0,
      completedAt: '2026-10-01T09:00:00+05:30',
    }
    state.gamification.lessonRewards['imaging-orientation'] = {
      completionAwarded: true,
      perfectAwarded: true,
    }
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'imaging-orientation',
      attempt: 2,
      resumed: false,
    }).state
    state = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'imaging-orientation',
      score: 80,
      accuracy: 80,
      correctCount: 0,
      scoredCount: 0,
      durationSeconds: 30,
    }).state
    expect(state.xp.total).toBe(registry.appConfig.gamification.xp.revisionComplete)
    expect(state.gamification.lastActivityResult?.revision).toBe(true)
  })

  it('pays a daily challenge reward once per local day', () => {
    let state = freshState()
    const start: LearnerEventDraft = {
      event: 'challenge_started',
      challengeId: 'daily-imaging-interpretation',
      attempt: 1,
      resumed: false,
    }
    const complete: LearnerEventDraft = {
      event: 'challenge_completed',
      challengeId: 'daily-imaging-interpretation',
      score: 100,
      accuracy: 100,
      correctCount: 5,
      scoredCount: 5,
      durationSeconds: 90,
    }
    state = reduce(state, start).state
    state = reduce(state, complete).state
    expect(state.xp.total).toBe(75)
    expect(state.streak.currentDays).toBe(1)

    state = reduce(state, start).state
    state = reduce(state, complete).state
    expect(state.xp.total).toBe(75)
    expect(state.gamification.counters.challengeCompletions['daily-imaging-interpretation']).toBe(1)
  })

  it('rounds fractional question XP and emits one level-up crossing', () => {
    const state = freshState()
    state.xp = { total: 245, weekly: 245 }
    const partial = reduce(state, {
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'thoracic-ct',
      questionId: 'showcase-question',
      primitiveType: 'multiple_choice',
      conceptIds: ['image-windowing'],
      score: 0.5,
      correct: false,
      attempt: 1,
      difficulty: 'intermediate',
    })
    expect(partial.state.xp.total).toBe(250)
    expect(partial.followUps).toContainEqual({
      event: 'level_up',
      from: 1,
      to: 2,
    })
    expect(
      partial.state.gamification.celebrations.filter(({ type }) => type === 'level'),
    ).toHaveLength(1)
  })

  it('resets weekly XP at a configured week boundary', () => {
    const state = freshState()
    state.xp.weekly = 100
    state.gamification.xpWeekStart = '2026-09-28'
    const result = reduce(
      state,
      { event: 'app_opened', source: 'client' },
      '2026-10-05T09:00:00+05:30',
    )
    expect(result.state.xp.weekly).toBe(0)
    expect(result.state.gamification.xpWeekStart).toBe('2026-10-05')
  })

  it('awards the configured weekly target once', () => {
    let state = freshState()
    state.weeklyGoal.completedDays = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      attempt: 1,
      resumed: false,
    }).state
    const result = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      score: 80,
      accuracy: 80,
      correctCount: 0,
      scoredCount: 0,
      durationSeconds: 30,
    })
    expect(result.state.gamification.counters.weeklyGoalsMet).toBe(1)
    expect(result.followUps).toContainEqual(
      expect.objectContaining({
        event: 'xp_awarded',
        reason: 'weekly_target',
        amount: 100,
      }),
    )
  })

  it('unlocks primitive rewards idempotently and applies badge XP', () => {
    const state = freshState()
    const first = reduce(state, {
      event: 'primitive_completed',
      activityKind: 'lesson',
      activityId: 'dicom-lab',
      primitiveId: 'lab-measure',
      primitiveType: 'dicom_measure',
      stepIndex: 2,
    })
    expect(first.state.badges['first-dicom']?.unlockedAt).not.toBeNull()
    expect(first.state.xp.total).toBe(40)
    expect(first.state.gamification.digitalRewards).toContainEqual(
      expect.objectContaining({ type: 'badge', id: 'first-dicom' }),
    )

    const second = reduce(first.state, {
      event: 'primitive_completed',
      activityKind: 'lesson',
      activityId: 'dicom-lab',
      primitiveId: 'lab-measure',
      primitiveType: 'dicom_measure',
      stepIndex: 2,
    })
    expect(second.state.xp.total).toBe(40)
    expect(second.state.gamification.digitalRewards).toHaveLength(1)
  })

  it('allows badge XP to trigger a single level-up cascade', () => {
    const state = freshState()
    state.xp = { total: 220, weekly: 220 }
    const result = reduce(state, {
      event: 'demo_command',
      command: 'simulate_badge',
      badgeId: 'perfect-lesson',
    })
    expect(result.state.xp.total).toBe(250)
    expect(result.followUps.filter(({ event }) => event === 'level_up')).toEqual([
      { event: 'level_up', from: 1, to: 2 },
    ])
    expect(result.state.gamification.celebrations.map(({ type }) => type)).toEqual([
      'badge',
      'level',
    ])
  })

  it('migrates v2 completed lessons into an idempotent reward ledger', () => {
    const legacy = freshState()
    delete (legacy as Partial<LearnerData>).gamification
    legacy.lessonProgress['imaging-orientation'] = {
      status: 'completed',
      stars: 3,
      bestScore: 100,
      attempts: 1,
      lastPrimitiveIndex: 0,
      completedAt: '2026-10-01T09:00:00+05:30',
    }

    const migrated = migrateLearnerState(legacy)
    expect(migrated.stateVersion).toBe(4)
    expect(migrated.gamification.lessonRewards['imaging-orientation']).toEqual({
      completionAwarded: true,
      perfectAwarded: true,
    })
    expect(migrated.gamification.counters.perfectLessons).toBe(1)
  })
})
