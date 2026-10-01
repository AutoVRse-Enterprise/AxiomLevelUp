import type { ContentRegistry } from '@/content/loader'
import { applyLearningEvent } from '@/engines/learning/progress'
import { emitEvent, subscribeToEvents } from '@/events/bus'
import { useLearnerStore } from '@/state/learnerStore'

let unsubscribe: (() => unknown) | null = null
let progressUnsubscribe: (() => unknown) | null = null

export function initializeLearningEventHandlers() {
  if (unsubscribe) return unsubscribe
  unsubscribe = subscribeToEvents((event) => {
    if (event.event === 'xp_awarded') {
      useLearnerStore.getState().addXp(event.amount)
    }
  })
  return unsubscribe
}

export function initializeLearningProgressHandlers(registry: ContentRegistry) {
  if (progressUnsubscribe) return progressUnsubscribe
  progressUnsubscribe = subscribeToEvents((event) => {
    const store = useLearnerStore.getState()
    const result = applyLearningEvent(
      {
        lessonProgress: store.lessonProgress,
        challenges: store.challenges,
        stats: store.stats,
      },
      event,
      registry,
    )
    store.applyLearningProgress(result.state)
    result.followUps.forEach(emitEvent)
  })
  return progressUnsubscribe
}

export function stopLearningEventHandlersForTests() {
  unsubscribe?.()
  unsubscribe = null
  progressUnsubscribe?.()
  progressUnsubscribe = null
}
