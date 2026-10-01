import { z } from 'zod'

import { primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const numericToleranceSchema = z.strictObject({
  type: z.enum(['absolute', 'percent']),
  value: z.number().nonnegative(),
})

export const numericRangeSchema = z
  .strictObject({
    min: z.number(),
    max: z.number(),
  })
  .refine((range) => range.min <= range.max, {
    message: 'range min must be less than or equal to max',
    path: ['max'],
  })

const sharedNumericContent = {
  prompt: z.string().min(1),
  unit: z.string().trim().min(1).optional(),
  explanation: z.string().min(1),
}

export const numericPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('numeric'),
  content: z.union([
    z.strictObject({
      ...sharedNumericContent,
      answer: z.number(),
      tolerance: numericToleranceSchema,
    }),
    z.strictObject({
      ...sharedNumericContent,
      range: numericRangeSchema,
    }),
  ]),
})

export type NumericPrimitive = z.infer<typeof numericPrimitiveSchema>

export const numericContentSchema = {
  schema: numericPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<NumericPrimitive>
