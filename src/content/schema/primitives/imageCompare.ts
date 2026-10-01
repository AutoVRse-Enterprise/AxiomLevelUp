import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const comparisonImageSchema = z.strictObject({
  assetId: idSchema,
  alt: z.string().min(1),
  label: z.string().min(1),
})

export const imageComparePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('image_compare'),
  content: z.strictObject({
    mode: z.enum(['slider', 'side_by_side']),
    before: comparisonImageSchema,
    after: comparisonImageSchema,
    initialPosition: z.number().min(0).max(1).default(0.5),
    caption: z.string().optional(),
  }),
})

export type ImageComparePrimitive = z.infer<typeof imageComparePrimitiveSchema>

export const imageCompareContentSchema = {
  schema: imageComparePrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.before.assetId,
      type: 'image',
      path: 'content.before.assetId',
    },
    {
      assetId: primitive.content.after.assetId,
      type: 'image',
      path: 'content.after.assetId',
    },
  ],
} satisfies PrimitiveContentSchema<ImageComparePrimitive>
