import type { Primitive } from '@/content/schema'

export interface CompletionContext {
  attempts: number
  correct: boolean | null
  interactions: number
  reportedComplete: boolean
  retry: boolean
  maxAttempts: number
}

export function isPrimitiveComplete(
  primitive: Primitive,
  context: CompletionContext,
): boolean {
  switch (primitive.completion.mode) {
    case 'viewed':
      return true
    case 'answer':
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
      return context.interactions >= count
    }
    case 'measurement':
    case 'outcome':
    case 'interacted':
    case 'correct_order':
      return context.reportedComplete
    default:
      return context.reportedComplete
  }
}
