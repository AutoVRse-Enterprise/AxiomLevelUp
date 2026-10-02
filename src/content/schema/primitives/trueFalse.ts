import { z } from 'zod'

import { clueIdsSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const trueFalsePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('true_false'),
  content: z.strictObject({
    statement: z.string().min(1),
    answer: z.boolean(),
    explanation: z.string().min(1),
    responseClueIds: z
      .strictObject({
        true: clueIdsSchema.optional(),
        false: clueIdsSchema.optional(),
      })
      .optional(),
  }),
})

export type TrueFalsePrimitive = z.infer<typeof trueFalsePrimitiveSchema>

export const trueFalseContentSchema = {
  schema: trueFalsePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<TrueFalsePrimitive>
