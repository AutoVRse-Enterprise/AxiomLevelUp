import type { ContentRegistry } from '@/content/loader'
import { reduceLearnerEvent } from '@/engines/pipeline'
import { emitEvent, subscribeToEvents } from '@/events/bus'
import { isLearnerOutputEvent, type LearnerEvent } from '@/events/types'
import { learnerDataSnapshot, useLearnerStore } from '@/state/learnerStore'

let pipelineUnsubscribe: (() => unknown) | null = null

export function initializeLearningEventHandlers() {
  return () => undefined
}

export function initializeLearningProgressHandlers(registry: ContentRegistry) {
  if (pipelineUnsubscribe) return pipelineUnsubscribe
  const queue: LearnerEvent[] = []
  let processing = false
  pipelineUnsubscribe = subscribeToEvents((event) => {
    queue.push(event)
    if (processing) return
    processing = true
    while (queue.length) {
      const next = queue.shift()
      if (!next || isLearnerOutputEvent(next)) continue
      const store = useLearnerStore.getState()
      const result = reduceLearnerEvent(learnerDataSnapshot(store), next, registry)
      store.applyEventState(result.state)
      result.followUps.forEach(emitEvent)
    }
    processing = false
  })
  return pipelineUnsubscribe
}

export function stopLearningEventHandlersForTests() {
  pipelineUnsubscribe?.()
  pipelineUnsubscribe = null
}
