import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const multipleChoicePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('multiple_choice'),
  content: z
    .object({
      prompt: z.string().min(1),
      options: z.array(z.object({ id: idSchema, label: z.string().min(1) })).min(2),
      correctOptionId: idSchema,
      explanation: z.string().min(1),
    })
    .refine(
      (value) => value.options.some((option) => option.id === value.correctOptionId),
      'correctOptionId must reference one of the options',
    ),
})

export type MultipleChoicePrimitive = z.infer<typeof multipleChoicePrimitiveSchema>

export const multipleChoiceContentSchema = {
  schema: multipleChoicePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<MultipleChoicePrimitive>
