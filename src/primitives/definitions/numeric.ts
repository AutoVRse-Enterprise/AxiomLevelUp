import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { NumericPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'
import { parseNumericResponse } from '@/primitives/definitions/typedResponseEvaluation'

function isCorrectResponse(primitive: NumericPrimitive, response: number): boolean {
  if ('range' in primitive.content) {
    return response >= primitive.content.range.min && response <= primitive.content.range.max
  }

  const tolerance =
    primitive.content.tolerance.type === 'absolute'
      ? primitive.content.tolerance.value
      : (Math.abs(primitive.content.answer) * primitive.content.tolerance.value) / 100
  return Math.abs(response - primitive.content.answer) <= tolerance
}

export const numericDefinition = definePrimitive<NumericPrimitive>({
  type: 'numeric',
  family: 'assessment',
  label: 'Numeric answer',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('numeric'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = parseNumericResponse(response)
    const correct = parsedResponse !== null && isCorrectResponse(primitive, parsedResponse)
    return {
      score: Number(correct),
      correct,
      explanation: primitive.content.explanation,
      items: { answer: correct ? 'correct' : 'incorrect' },
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
