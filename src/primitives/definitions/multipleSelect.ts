import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { MultipleSelectPrimitive } from '@/content/schema/primitives'
import {
  buildChoiceItems,
  multipleSelectResponseSchema,
} from '@/primitives/definitions/choiceEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

export const multipleSelectDefinition = definePrimitive<MultipleSelectPrimitive>({
  type: 'multiple_select',
  family: 'assessment',
  label: 'Select all that apply',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('multiple_select'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = multipleSelectResponseSchema.safeParse(response)
    const optionIds = primitive.content.options.map((option) => option.id)
    const optionIdSet = new Set(optionIds)
    const selectedIds =
      parsedResponse.success &&
      parsedResponse.data.length >= primitive.content.minSelections &&
      parsedResponse.data.every((id) => optionIdSet.has(id))
        ? new Set(parsedResponse.data)
        : new Set<string>()
    const correctIds = new Set(primitive.content.correctOptionIds)
    const correctlySelected = [...selectedIds].filter((id) => correctIds.has(id)).length
    const incorrectlySelected = [...selectedIds].filter((id) => !correctIds.has(id)).length
    const exact =
      selectedIds.size === correctIds.size && [...selectedIds].every((id) => correctIds.has(id))
    const score =
      primitive.content.scoringMode === 'partial'
        ? Math.max(0, (correctlySelected - incorrectlySelected) / correctIds.size)
        : Number(exact)

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: buildChoiceItems(optionIds, selectedIds, correctIds),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
