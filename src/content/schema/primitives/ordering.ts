import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const orderingItemSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
})

export const orderingPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('ordering'),
  content: z
    .strictObject({
      prompt: z.string().min(1),
      items: z.array(orderingItemSchema).min(2),
      scoringMode: z.enum(['exact', 'partial']).default('exact'),
      explanation: z.string().min(1),
    })
    .superRefine((value, context) => {
      const itemIds = value.items.map((item) => item.id)
      if (new Set(itemIds).size !== itemIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'item IDs must be unique',
          path: ['items'],
        })
      }
    }),
})

export type OrderingPrimitive = z.infer<typeof orderingPrimitiveSchema>

export const orderingContentSchema = {
  schema: orderingPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<OrderingPrimitive>
