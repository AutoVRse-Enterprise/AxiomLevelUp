import type { Primitive } from '@/content/schema'
import type { EvaluationResult } from '@/primitives/types'
import type { PrimitiveEvaluator } from '@/primitives/types'

export function evaluateMultipleChoice(
  primitive: Primitive,
  response: unknown,
): EvaluationResult {
  const correctOptionId = primitive.content.correctOptionId
  const explanation = primitive.content.explanation
  return {
    correct: typeof correctOptionId === 'string' && response === correctOptionId,
    explanation: typeof explanation === 'string' ? explanation : null,
  }
}

const evaluators: Record<string, PrimitiveEvaluator> = {
  multiple_choice: evaluateMultipleChoice,
}

export function evaluatePrimitive(
  primitive: Primitive,
  response: unknown,
): EvaluationResult {
  const evaluator = evaluators[primitive.type]
  return evaluator
    ? evaluator(primitive, response)
    : { correct: false, explanation: null }
}
