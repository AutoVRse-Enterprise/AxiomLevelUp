import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearEventSubscribersForTests,
  emitEvent,
  subscribeToEvents,
} from '@/events/bus'
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
      questionId: 'question-1',
      conceptIds: ['dose-response'],
      correct: true,
      attempt: 1,
      xp: 10,
    })

    expect(subscriber).toHaveBeenCalledWith(emitted)
    expect(emitted.id).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(emitted.occurredAt))).toBe(false)

    unsubscribe()
    emitEvent({ event: 'xp_awarded', amount: 10, reason: 'test' })
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('persists only the latest 500 events', () => {
    initializeEventLogging()

    for (let index = 0; index < EVENT_LOG_LIMIT + 5; index += 1) {
      emitEvent({ event: 'xp_awarded', amount: index, reason: `event-${index}` })
    }

    const events = useEventLogStore.getState().events
    expect(events).toHaveLength(EVENT_LOG_LIMIT)
    expect(events[0]).toEqual(expect.objectContaining({ amount: 5, reason: 'event-5' }))
    expect(events.at(-1)).toEqual(expect.objectContaining({ amount: 504, reason: 'event-504' }))
  })
})
