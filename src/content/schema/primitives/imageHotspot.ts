import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import { hasUniqueRegionIds, imageRegionSchema } from './imageRegions'
import type { PrimitiveContentSchema } from './types'

const commonContent = {
  assetId: idSchema,
  alt: z.string().min(1),
  caption: z.string().optional(),
  regions: z.array(imageRegionSchema).min(1),
}

const exploreContentSchema = z.strictObject({
  ...commonContent,
  mode: z.literal('explore'),
  prompt: z.string().min(1).optional(),
})

const assessContentSchema = z.strictObject({
  ...commonContent,
  mode: z.literal('assess'),
  prompt: z.string().min(1),
  answerLabel: z.string().min(1).optional(),
  targetRegionIds: z.array(idSchema).min(1),
  explanation: z.string().min(1),
  zoom: z
    .strictObject({
      enabled: z.boolean(),
      maxScale: z.number().min(1).max(8),
    })
    .optional(),
})

export const imageHotspotPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('image_hotspot'),
    content: z.discriminatedUnion('mode', [exploreContentSchema, assessContentSchema]),
  })
  .superRefine((primitive, context) => {
    const { content } = primitive
    if (!hasUniqueRegionIds(content.regions)) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'regions'],
        message: 'Region IDs must be unique.',
      })
    }

    if (content.mode === 'explore') {
      if (primitive.completion.mode !== 'explored' || 'count' in primitive.completion) {
        context.addIssue({
          code: 'custom',
          path: ['completion'],
          message: 'Explore hotspots must require all regions with completion mode explored.',
        })
      }
      return
    }

    const regionIds = new Set(content.regions.map(({ id }) => id))
    if (
      new Set(content.targetRegionIds).size !== content.targetRegionIds.length ||
      content.targetRegionIds.some((id) => !regionIds.has(id))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'targetRegionIds'],
        message: 'Target region IDs must be unique and reference configured regions.',
      })
    }
    if (primitive.completion.mode !== 'answer') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'Assessment hotspots must use answer completion.',
      })
    }
  })

export type ImageHotspotPrimitive = z.infer<typeof imageHotspotPrimitiveSchema>

export const imageHotspotContentSchema = {
  schema: imageHotspotPrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'image',
      path: 'content.assetId',
    },
  ],
} satisfies PrimitiveContentSchema<ImageHotspotPrimitive>
