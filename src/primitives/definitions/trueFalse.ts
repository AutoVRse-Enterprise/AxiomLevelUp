import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { TrueFalsePrimitive } from '@/content/schema/primitives'
import {
  buildChoiceItems,
  trueFalseResponseSchema,
} from '@/primitives/definitions/choiceEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

const optionIds = ['true', 'false'] as const

export const trueFalseDefinition = definePrimitive<TrueFalsePrimitive>({
  type: 'true_false',
  family: 'assessment',
  label: 'True or false',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('true_false'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = trueFalseResponseSchema.safeParse(response)
    const selectedId = parsedResponse.success ? String(parsedResponse.data) : null
    const correctId = String(primitive.content.answer)
    const score = selectedId === correctId ? 1 : 0

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: buildChoiceItems(
        optionIds,
        new Set(selectedId === null ? [] : [selectedId]),
        new Set([correctId]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.statement,
})
