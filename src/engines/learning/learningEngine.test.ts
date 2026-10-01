import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import { parsePrimitive } from '@/content/schema'
import { isPrimitiveComplete } from '@/engines/learning/completionRules'
import { buildActivityPlan } from '@/engines/learning/plan'
import { applyLearningEvent, type LearningProgressState } from '@/engines/learning/progress'
import {
  createActivitySession,
  selectActivitySummary,
  sessionMatchesPlan,
  sessionReducer,
} from '@/engines/learning/session'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import { evaluateMultipleChoice } from '@/primitives/evaluators'
import { makeValidContentBundle, playerFixtures } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const playerConfig = registry.appConfig.product.player

function event(draft: LearnerEventDraft, occurredAt = '2026-10-01T12:00:00.000Z') {
  return { ...draft, id: 'event-id', occurredAt } as LearnerEvent
}

describe('activity planning and sessions', () => {
  it('filters unsupported steps in production and exposes them in development', () => {
    const development = buildActivityPlan(playerFixtures.mixedUnsupported, {
      environment: 'development',
      player: playerConfig,
    })
    const production = buildActivityPlan(playerFixtures.mixedUnsupported, {
      environment: 'production',
      player: playerConfig,
    })

    expect(development.steps.map((step) => step.kind)).toEqual([
      'content',
      'unsupported',
      'assessment',
    ])
    expect(production.steps.map((step) => step.kind)).toEqual(['content', 'assessment'])
  })

  it('marks empty and unsupported-only activities unavailable', () => {
    expect(
      buildActivityPlan(playerFixtures.allUnsupported, {
        environment: 'development',
        player: playerConfig,
      }).playable,
    ).toBe(false)
    expect(
      buildActivityPlan(playerFixtures.emptyChallenge, {
        environment: 'production',
        player: playerConfig,
      }).unavailableReason,
    ).toMatch(/configured items/)
  })

  it('runs session transitions and scores only first attempts', () => {
    const plan = buildActivityPlan(playerFixtures.allTyped, {
      environment: 'development',
      player: playerConfig,
    })
    let session = createActivitySession(plan)
    session = sessionReducer(session, { type: 'start', at: '2026-10-01T12:00:00.000Z' })
    session = sessionReducer(session, {
      type: 'complete_current',
      primitiveId: 'fixture-text',
    })
    session = sessionReducer(session, { type: 'continue', stepCount: 2 })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'fixture-question',
      response: 'unsupported',
      correct: false,
      completed: false,
    })
    session = sessionReducer(session, { type: 'retry' })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'fixture-question',
      response: 'supported',
      correct: true,
      completed: true,
    })

    expect(selectActivitySummary(session, plan)).toMatchObject({
      score: 0,
      accuracy: 0,
      correctCount: 0,
      scoredCount: 1,
    })
    expect(sessionMatchesPlan(session, plan)).toBe(true)
  })

  it('evaluates completion contracts and multiple choice responses', () => {
    const plan = buildActivityPlan(playerFixtures.allTyped, {
      environment: 'development',
      player: playerConfig,
    })
    const question = plan.steps[1]!.primitive
    expect(evaluateMultipleChoice(question, 'supported').correct).toBe(true)
    expect(
      isPrimitiveComplete(question, {
        attempts: 1,
        correct: false,
        interactions: 0,
        reportedComplete: false,
        retry: true,
        maxAttempts: 2,
      }),
    ).toBe(false)
    expect(
      isPrimitiveComplete(question, {
        attempts: 2,
        correct: false,
        interactions: 0,
        reportedComplete: false,
        retry: true,
        maxAttempts: 2,
      }),
    ).toBe(true)
  })

  it('validates known and forward-compatible completion modes', () => {
    expect(
      parsePrimitive({
        id: 'minimum',
        type: 'dicom_explore',
        content: {},
        completion: { mode: 'minimum_interactions', count: 2 },
      }).issues,
    ).toHaveLength(0)
    expect(
      parsePrimitive({
        id: 'future',
        type: 'future_type',
        content: {},
        completion: { mode: 'future_rule', threshold: 4 },
      }).primitive,
    ).toBeDefined()
  })
})

describe('learning progress reducer', () => {
  const initial = (): LearningProgressState => ({
    lessonProgress: structuredClone(registry.seed.lessonProgress),
    challenges: structuredClone(registry.seed.challenges),
    stats: structuredClone(registry.seed.stats),
  })

  it('records attempts, resume points and first-attempt question stats', () => {
    let result = applyLearningEvent(
      initial(),
      event({
        event: 'lesson_started',
        courseId: 'scientific-imaging',
        lessonId: 'thoracic-ct',
        attempt: 2,
        resumed: false,
      }),
      registry,
    )
    const attempts = result.state.lessonProgress['thoracic-ct']!.attempts
    result = applyLearningEvent(
      result.state,
      event({
        event: 'primitive_completed',
        activityKind: 'lesson',
        activityId: 'thoracic-ct',
        primitiveId: 'showcase-context',
        primitiveType: 'rich_text',
        stepIndex: 0,
      }),
      registry,
    )
    const questions = result.state.stats.questionsAnswered
    result = applyLearningEvent(
      result.state,
      event({
        event: 'question_answered',
        activityKind: 'lesson',
        activityId: 'thoracic-ct',
        questionId: 'showcase-question',
        primitiveType: 'multiple_choice',
        conceptIds: ['image-windowing'],
        correct: true,
        attempt: 2,
        xp: 10,
      }),
      registry,
    )

    expect(attempts).toBeGreaterThan(0)
    expect(result.state.lessonProgress['thoracic-ct']!.lastPrimitiveIndex).toBe(1)
    expect(result.state.stats.questionsAnswered).toBe(questions)
  })

  it('records best scores once and challenge completion idempotently', () => {
    const first = applyLearningEvent(
      initial(),
      event({
        event: 'challenge_completed',
        challengeId: 'daily-imaging-interpretation',
        score: 80,
        accuracy: 80,
        correctCount: 4,
        scoredCount: 5,
        durationSeconds: 45,
      }),
      registry,
    ).state
    const second = applyLearningEvent(
      first,
      event({
        event: 'challenge_completed',
        challengeId: 'daily-imaging-interpretation',
        score: 60,
        accuracy: 60,
        correctCount: 3,
        scoredCount: 5,
        durationSeconds: 40,
      }),
      registry,
    ).state

    expect(second.challenges['daily-imaging-interpretation']?.bestScore).toBe(80)
    expect(second.stats.challengesCompleted).toBe(first.stats.challengesCompleted)
  })
})
