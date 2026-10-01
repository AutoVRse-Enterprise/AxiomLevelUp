import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const richTextPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('rich_text'),
  content: z.object({
    heading: z.string().optional(),
    body: z.string().min(1),
    emphasis: z.array(z.string()).optional(),
    bullets: z.array(z.string()).optional(),
    imageAssetId: idSchema.optional(),
    keyTakeaway: z.string().optional(),
  }),
})

export type RichTextPrimitive = z.infer<typeof richTextPrimitiveSchema>

export const richTextContentSchema = {
  schema: richTextPrimitiveSchema,
  assetRefs: (primitive) =>
    primitive.content.imageAssetId
      ? [
          {
            assetId: primitive.content.imageAssetId,
            type: 'image',
            path: 'content.imageAssetId',
          },
        ]
      : [],
} satisfies PrimitiveContentSchema<RichTextPrimitive>
