import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import { choiceOptionSchema } from './multipleChoice'
import type { PrimitiveContentSchema } from './types'

export const multipleSelectPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('multiple_select'),
  content: z
    .strictObject({
      prompt: z.string().min(1),
      options: z.array(choiceOptionSchema).min(2),
      correctOptionIds: z.array(idSchema).min(1),
      scoringMode: z.enum(['all_or_nothing', 'partial']).default('all_or_nothing'),
      minSelections: z.number().int().positive().default(1),
      shuffle: z.boolean().default(false),
      explanation: z.string().min(1),
    })
    .superRefine((value, context) => {
      const optionIds = value.options.map((option) => option.id)
      const optionIdSet = new Set(optionIds)

      if (optionIdSet.size !== optionIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'option IDs must be unique',
          path: ['options'],
        })
      }
      if (new Set(value.correctOptionIds).size !== value.correctOptionIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'correctOptionIds must be unique',
          path: ['correctOptionIds'],
        })
      }
      if (value.correctOptionIds.some((id) => !optionIdSet.has(id))) {
        context.addIssue({
          code: 'custom',
          message: 'correctOptionIds must reference options',
          path: ['correctOptionIds'],
        })
      }
      if (value.minSelections > value.correctOptionIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'minSelections cannot exceed the number of correct options',
          path: ['minSelections'],
        })
      }
    }),
})

export type MultipleSelectPrimitive = z.infer<typeof multipleSelectPrimitiveSchema>

export const multipleSelectContentSchema = {
  schema: multipleSelectPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<MultipleSelectPrimitive>
