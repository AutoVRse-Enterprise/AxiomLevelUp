import type { Primitive } from '@/content/schema'

export interface CompletionContext {
  attempts: number
  correct: boolean | null
  interactionKeys: readonly string[]
  explorableKeys: readonly string[]
  mediaProgress: number
  mediaCompletionThreshold: number
  reportedComplete: boolean
  retry: boolean
  maxAttempts: number
}

export function isPrimitiveComplete(primitive: Primitive, context: CompletionContext): boolean {
  switch (primitive.completion.mode) {
    case 'viewed':
      return true
    case 'answer':
    case 'correct_order':
      return (
        context.correct === true ||
        context.attempts >= context.maxAttempts ||
        (!context.retry && context.attempts > 0)
      )
    case 'minimum_interactions': {
      const count =
        'count' in primitive.completion && typeof primitive.completion.count === 'number'
          ? primitive.completion.count
          : 1
      return new Set(context.interactionKeys).size >= count
    }
    case 'explored': {
      const expected = new Set(context.explorableKeys)
      const exploredCount = new Set(context.interactionKeys.filter((key) => expected.has(key))).size
      const count =
        'count' in primitive.completion && typeof primitive.completion.count === 'number'
          ? primitive.completion.count
          : expected.size
      return count > 0 && exploredCount >= count
    }
    case 'media_progress': {
      const threshold =
        'threshold' in primitive.completion && typeof primitive.completion.threshold === 'number'
          ? primitive.completion.threshold
          : context.mediaCompletionThreshold
      return context.mediaProgress >= threshold
    }
    case 'measurement':
    case 'outcome':
    case 'interacted':
      return context.reportedComplete
    default:
      return context.reportedComplete
  }
}
