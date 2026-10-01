import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { MultipleChoicePrimitive } from '@/content/schema/primitives'
import {
  buildChoiceItems,
  multipleChoiceResponseSchema,
} from '@/primitives/definitions/choiceEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

export const multipleChoiceDefinition = definePrimitive<MultipleChoicePrimitive>({
  type: 'multiple_choice',
  family: 'assessment',
  label: 'Question',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('multiple_choice'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = multipleChoiceResponseSchema.safeParse(response)
    const optionIds = primitive.content.options.map((option) => option.id)
    const validResponse =
      parsedResponse.success && optionIds.includes(parsedResponse.data) ? parsedResponse.data : null
    const score = validResponse === primitive.content.correctOptionId ? 1 : 0
    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: buildChoiceItems(
        optionIds,
        new Set(validResponse === null ? [] : [validResponse]),
        new Set([primitive.content.correctOptionId]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
