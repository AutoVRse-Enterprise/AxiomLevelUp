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
import {
  ACTIVITY_SESSION_VERSION,
  migrateActivitySessionState,
} from '@/engines/learning/sessionStore'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import { evaluatePrimitive } from '@/primitives/definitions'
import { makeValidContentBundle, playerFixtures } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const playerConfig = registry.appConfig.product.player

function event(draft: LearnerEventDraft, occurredAt = '2026-10-01T12:00:00.000Z') {
  return { ...draft, id: 'event-id', occurredAt } as LearnerEvent
}

describe('activity planning and sessions', () => {
  it('plays supported DICOM steps in production and preserves unknown fallbacks', () => {
    const future = parsePrimitive({
      id: 'future-step',
      type: 'future_lab_simulation',
      content: {},
      completion: { mode: 'viewed' },
    }).primitive!
    const dicom = registry.lessonById
      .get('thoracic-ct')!
      .primitives.find(({ type }) => type === 'dicom_explore')!
    const activity = {
      ...playerFixtures.mixedUnsupported,
      primitives: [...playerFixtures.mixedUnsupported.primitives, future, dicom],
    }
    const development = buildActivityPlan(activity, {
      environment: 'development',
      player: playerConfig,
    })
    const production = buildActivityPlan(activity, {
      environment: 'production',
      player: playerConfig,
    })

    expect(development.steps.map(({ primitive }) => primitive.id)).toEqual([
      'fixture-text',
      'fixture-unsupported',
      'fixture-question',
      'future-step',
      'showcase-dicom',
    ])
    expect(development.steps[0]).toMatchObject({
      supported: true,
      scored: false,
      layout: 'stacked',
      prompt: 'Observe',
      explorableKeys: [],
    })
    expect(development.steps[2]).toMatchObject({
      supported: true,
      scored: true,
      layout: 'stacked',
      prompt: 'Which option is supported?',
      explorableKeys: [],
    })
    expect(production.steps.map(({ primitive }) => primitive.id)).toEqual([
      'fixture-text',
      'fixture-unsupported',
      'fixture-question',
      'future-step',
      'showcase-dicom',
    ])
    expect(production.steps.filter(({ supported }) => !supported)).toHaveLength(2)
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
      score: 0,
      completed: false,
    })
    session = sessionReducer(session, { type: 'retry' })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'fixture-question',
      response: 'supported',
      score: 1,
      completed: true,
    })

    expect(selectActivitySummary(session, plan)).toMatchObject({
      score: 0,
      accuracy: 0,
      correctCount: 0,
      scoredCount: 1,
    })
    expect(sessionMatchesPlan(session, plan)).toBe(true)
    expect(session.progress['fixture-question']).toMatchObject({
      firstScore: 0,
      lastScore: 1,
    })
  })

  it('evaluates completion contracts and multiple choice responses', () => {
    const plan = buildActivityPlan(playerFixtures.allTyped, {
      environment: 'development',
      player: playerConfig,
    })
    const question = plan.steps[1]!.primitive
    expect(evaluatePrimitive(question, 'supported').correct).toBe(true)
    expect(
      isPrimitiveComplete(question, {
        attempts: 1,
        correct: false,
        interactionKeys: [],
        explorableKeys: [],
        mediaProgress: 0,
        mediaCompletionThreshold: playerConfig.mediaCompletionThreshold,
        reportedComplete: false,
        retry: true,
        maxAttempts: 2,
      }),
    ).toBe(false)
    expect(
      isPrimitiveComplete(question, {
        attempts: 2,
        correct: false,
        interactionKeys: [],
        explorableKeys: [],
        mediaProgress: 0,
        mediaCompletionThreshold: playerConfig.mediaCompletionThreshold,
        reportedComplete: false,
        retry: true,
        maxAttempts: 2,
      }),
    ).toBe(true)
  })

  it('weights fractional first-attempt scores and keeps retries non-authoritative', () => {
    const baseQuestion = playerFixtures.allTyped.primitives[1]!
    const activity = {
      ...playerFixtures.allTyped,
      primitives: [
        {
          ...structuredClone(baseQuestion),
          id: 'partial-question',
          scoring: { ...baseQuestion.scoring, weight: 1 },
        },
        {
          ...structuredClone(baseQuestion),
          id: 'full-question',
          scoring: { ...baseQuestion.scoring, weight: 3 },
        },
      ],
    }
    const plan = buildActivityPlan(activity, {
      environment: 'development',
      player: playerConfig,
    })
    let session = createActivitySession(plan)
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'partial-question',
      response: ['partial'],
      score: 0.5,
      completed: false,
    })
    session = sessionReducer(session, { type: 'retry' })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'partial-question',
      response: ['complete'],
      score: 1,
      completed: true,
    })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'full-question',
      response: 'supported',
      score: 1,
      completed: true,
    })

    expect(selectActivitySummary(session, plan)).toMatchObject({
      score: 88,
      accuracy: 50,
      correctCount: 1,
      scoredCount: 2,
    })
    expect(session.progress['partial-question']).toMatchObject({
      firstScore: 0.5,
      lastScore: 1,
    })
  })

  it('tracks drafts, distinct interaction keys and monotonic media progress', () => {
    const plan = buildActivityPlan(playerFixtures.allTyped, {
      environment: 'development',
      player: playerConfig,
    })
    let session = createActivitySession(plan)
    session = sessionReducer(session, {
      type: 'draft',
      primitiveId: 'fixture-question',
      draft: { selected: 'supported' },
    })
    session = sessionReducer(session, {
      type: 'interact',
      primitiveId: 'fixture-question',
      key: 'region:a',
      mediaProgress: 0.75,
    })
    session = sessionReducer(session, {
      type: 'interact',
      primitiveId: 'fixture-question',
      key: 'region:a',
      mediaProgress: 0.5,
    })

    expect(session.progress['fixture-question']).toMatchObject({
      draft: { selected: 'supported' },
      interactionKeys: ['region:a'],
      mediaProgress: 0.75,
      interactions: 2,
    })
  })

  it('uses distinct keys for interaction and exploration completion', () => {
    const minimum = registry.lessonById
      .get('thoracic-ct')!
      .primitives.find(({ type }) => type === 'dicom_explore')!
    const explored = parsePrimitive({
      id: 'explored',
      type: 'image_hotspot',
      content: {
        mode: 'explore',
        assetId: 'hotspot-image',
        alt: 'Hotspot image',
        regions: [
          {
            id: 'region-a',
            label: 'Region A',
            shape: 'circle',
            x: 0.25,
            y: 0.25,
            radius: 0.1,
          },
          {
            id: 'region-b',
            label: 'Region B',
            shape: 'rect',
            x: 0.5,
            y: 0.5,
            width: 0.2,
            height: 0.2,
          },
        ],
      },
      completion: { mode: 'explored' },
    }).primitive!
    const context = {
      attempts: 0,
      correct: null,
      interactionKeys: ['region-a', 'region-a'],
      explorableKeys: ['region-a', 'region-b'],
      mediaProgress: 0,
      mediaCompletionThreshold: playerConfig.mediaCompletionThreshold,
      reportedComplete: false,
      retry: true,
      maxAttempts: 2,
    }

    expect(isPrimitiveComplete(minimum, context)).toBe(false)
    expect(isPrimitiveComplete(explored, context)).toBe(false)
    expect(
      isPrimitiveComplete(explored, {
        ...context,
        interactionKeys: ['region-a', 'region-b', 'unrelated'],
      }),
    ).toBe(true)
  })

  it('supports configured media progress and correct-order answer semantics', () => {
    const media = parsePrimitive({
      id: 'media',
      type: 'video',
      content: {
        assetId: 'video-file',
        captionsAssetId: 'captions-file',
        title: 'Media',
      },
      completion: { mode: 'media_progress' },
    }).primitive!
    const ordering = parsePrimitive({
      id: 'ordering',
      type: 'ordering',
      content: {
        prompt: 'Put these in order',
        items: [
          { id: 'first', label: 'First' },
          { id: 'second', label: 'Second' },
        ],
        explanation: 'First, then second.',
      },
      completion: { mode: 'correct_order' },
    }).primitive!
    const context = {
      attempts: 0,
      correct: null,
      interactionKeys: [],
      explorableKeys: [],
      mediaProgress: 0.89,
      mediaCompletionThreshold: 0.9,
      reportedComplete: false,
      retry: true,
      maxAttempts: 2,
    }

    expect(isPrimitiveComplete(media, context)).toBe(false)
    expect(isPrimitiveComplete(media, { ...context, mediaProgress: 0.9 })).toBe(true)
    expect(isPrimitiveComplete(ordering, { ...context, attempts: 2, correct: false })).toBe(true)
  })

  it('restarts v1 sessions and migrates v2 sessions into session v3', () => {
    expect(ACTIVITY_SESSION_VERSION).toBe(3)
    expect(migrateActivitySessionState({ session: { activityId: 'legacy' } }, 1)).toEqual({
      session: null,
    })
    const plan = buildActivityPlan(playerFixtures.allTyped, {
      environment: 'development',
      player: playerConfig,
    })
    const versionTwo = createActivitySession(plan)
    const migrated = migrateActivitySessionState({ session: versionTwo }, 2).session
    expect(migrated).toMatchObject({
      activityId: versionTwo.activityId,
      progress: {
        'fixture-question': { firstTimedOut: false },
      },
    })
    expect(migrated?.caseProgress).toBeUndefined()
  })

  it('validates known and forward-compatible completion modes', () => {
    expect(
      parsePrimitive({
        ...registry.lessonById
          .get('thoracic-ct')!
          .primitives.find(({ type }) => type === 'dicom_explore')!,
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
        score: 1,
        correct: true,
        attempt: 2,
        difficulty: 'intermediate',
      }),
      registry,
    )

    expect(attempts).toBeGreaterThan(0)
    expect(result.state.lessonProgress['thoracic-ct']!.lastPrimitiveIndex).toBe(1)
    expect(result.state.stats.questionsAnswered).toBe(questions)

    const partial = applyLearningEvent(
      result.state,
      event({
        event: 'question_answered',
        activityKind: 'lesson',
        activityId: 'thoracic-ct',
        questionId: 'partial-question',
        primitiveType: 'multiple_select',
        conceptIds: ['image-windowing'],
        score: 0.5,
        correct: false,
        attempt: 1,
        difficulty: 'intermediate',
      }),
      registry,
    ).state
    expect(partial.stats.questionsAnswered).toBe(questions + 1)
    expect(partial.stats.correctAnswers).toBe(result.state.stats.correctAnswers)
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
