import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import { hasUniqueRegionIds, imageRegionSchema } from './imageRegions'
import type { PrimitiveContentSchema } from './types'

export const zoomableImagePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('zoomable_image'),
  content: z
    .strictObject({
      assetId: idSchema,
      alt: z.string().min(1),
      caption: z.string().optional(),
      maxZoom: z.number().min(1).max(8).default(4),
      regions: z.array(imageRegionSchema).default([]),
    })
    .superRefine((content, context) => {
      if (!hasUniqueRegionIds(content.regions)) {
        context.addIssue({
          code: 'custom',
          path: ['regions'],
          message: 'Region IDs must be unique.',
        })
      }
    }),
})

export type ZoomableImagePrimitive = z.infer<typeof zoomableImagePrimitiveSchema>

export const zoomableImageContentSchema = {
  schema: zoomableImagePrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'image',
      path: 'content.assetId',
    },
  ],
} satisfies PrimitiveContentSchema<ZoomableImagePrimitive>
