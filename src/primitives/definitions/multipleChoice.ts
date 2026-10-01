import { z } from 'zod'

import type { MultipleChoicePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

const responseSchema = z.string()

export const multipleChoiceDefinition = definePrimitive<MultipleChoicePrimitive>({
  type: 'multiple_choice',
  family: 'assessment',
  label: 'Question',
  layout: 'stacked',
  timerCompatible: true,
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = responseSchema.safeParse(response)
    const score =
      parsedResponse.success && parsedResponse.data === primitive.content.correctOptionId ? 1 : 0
    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
