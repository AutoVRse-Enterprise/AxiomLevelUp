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
    return {
      correct: parsedResponse.success && parsedResponse.data === primitive.content.correctOptionId,
      explanation: primitive.content.explanation,
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
