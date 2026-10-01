import { z } from 'zod'

import { primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const trueFalsePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('true_false'),
  content: z.strictObject({
    statement: z.string().min(1),
    answer: z.boolean(),
    explanation: z.string().min(1),
  }),
})

export type TrueFalsePrimitive = z.infer<typeof trueFalsePrimitiveSchema>

export const trueFalseContentSchema = {
  schema: trueFalsePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<TrueFalsePrimitive>
