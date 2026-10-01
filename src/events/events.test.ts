import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearEventSubscribersForTests, emitEvent, subscribeToEvents } from '@/events/bus'
import {
  EVENT_LOG_LIMIT,
  initializeEventLogging,
  stopEventLoggingForTests,
  useEventLogStore,
} from '@/events/eventLogStore'

describe('learner event bus', () => {
  beforeEach(() => {
    stopEventLoggingForTests()
    clearEventSubscribersForTests()
    useEventLogStore.getState().clear()
  })

  it('emits a typed event to subscribers and supports unsubscribe', () => {
    const subscriber = vi.fn()
    const unsubscribe = subscribeToEvents(subscriber)

    const emitted = emitEvent({
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'lesson-1',
      questionId: 'question-1',
      primitiveType: 'multiple_choice',
      conceptIds: ['dose-response'],
      score: 1,
      correct: true,
      attempt: 1,
      difficulty: 'intermediate',
    })

    expect(subscriber).toHaveBeenCalledWith(emitted)
    expect(emitted.id).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(emitted.occurredAt))).toBe(false)

    unsubscribe()
    emitEvent({ event: 'xp_awarded', amount: 10, reason: 'demo', sourceId: 'test' })
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('preserves enriched primitive, scenario and media payloads', () => {
    const subscriber = vi.fn()
    subscribeToEvents(subscriber)

    emitEvent({
      event: 'artifact_interacted',
      activityKind: 'lesson',
      activityId: 'lesson-1',
      primitiveId: 'scenario-1',
      primitiveType: 'scenario',
      interaction: {
        name: 'scenario_decision',
        nodeId: 'decision-1',
        choiceId: 'choice-a',
        decisionIndex: 0,
      },
    })
    emitEvent({
      event: 'scenario_decision_made',
      activityKind: 'lesson',
      activityId: 'lesson-1',
      primitiveId: 'scenario-1',
      primitiveType: 'scenario',
      nodeId: 'decision-1',
      choiceId: 'choice-a',
      decisionIndex: 0,
    })
    emitEvent({
      event: 'media_progressed',
      activityKind: 'lesson',
      activityId: 'lesson-1',
      primitiveId: 'video-1',
      primitiveType: 'video',
      milestone: 50,
    })

    expect(subscriber).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        event: 'artifact_interacted',
        activityKind: 'lesson',
        primitiveType: 'scenario',
        interaction: expect.objectContaining({ choiceId: 'choice-a' }),
      }),
    )
    expect(subscriber).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: 'scenario_decision_made',
        decisionIndex: 0,
      }),
    )
    expect(subscriber).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ event: 'media_progressed', milestone: 50 }),
    )
  })

  it('persists only the latest 500 events', () => {
    initializeEventLogging()

    for (let index = 0; index < EVENT_LOG_LIMIT + 5; index += 1) {
      emitEvent({ event: 'xp_awarded', amount: index, reason: 'demo', sourceId: `event-${index}` })
    }

    const events = useEventLogStore.getState().events
    expect(events).toHaveLength(EVENT_LOG_LIMIT)
    expect(events[0]).toEqual(expect.objectContaining({ amount: 5, sourceId: 'event-5' }))
    expect(events.at(-1)).toEqual(expect.objectContaining({ amount: 504, sourceId: 'event-504' }))
  })
})
