import { z } from 'zod'

import { clueIdsSchema, idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const choiceOptionSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  clueIds: clueIdsSchema.optional(),
})

export const multipleChoicePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('multiple_choice'),
  content: z
    .strictObject({
      prompt: z.string().min(1),
      options: z.array(choiceOptionSchema).min(2),
      correctOptionId: idSchema,
      explanation: z.string().min(1),
      shuffle: z.boolean().default(false),
    })
    .refine(
      (value) => new Set(value.options.map((option) => option.id)).size === value.options.length,
      'option IDs must be unique',
    )
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
