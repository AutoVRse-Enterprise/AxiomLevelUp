import { subscribeToEvents } from '@/events/bus'
import { useLearnerStore } from '@/state/learnerStore'

let unsubscribe: (() => unknown) | null = null

export function initializeLearningEventHandlers() {
  if (unsubscribe) return unsubscribe
  unsubscribe = subscribeToEvents((event) => {
    if (event.event === 'xp_awarded') {
      useLearnerStore.getState().addXp(event.amount)
    }
  })
  return unsubscribe
}

export function stopLearningEventHandlersForTests() {
  unsubscribe?.()
  unsubscribe = null
}
