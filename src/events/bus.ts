import type { LearnerEvent, LearnerEventDraft } from '@/events/types'

export type EventSubscriber = (event: LearnerEvent) => void

const subscribers = new Set<EventSubscriber>()

export function emitEvent(draft: LearnerEventDraft): LearnerEvent {
  const event = {
    ...draft,
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
  } as LearnerEvent

  subscribers.forEach((subscriber) => {
    try {
      subscriber(event)
    } catch (error) {
      console.error('Learner event subscriber failed', error)
    }
  })
  return event
}

export function subscribeToEvents(subscriber: EventSubscriber) {
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}

export function clearEventSubscribersForTests() {
  subscribers.clear()
}
