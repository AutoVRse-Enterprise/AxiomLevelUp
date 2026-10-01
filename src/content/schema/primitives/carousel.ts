import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const carouselSlideSchema = z
  .strictObject({
    id: idSchema,
    title: z.string().min(1),
    body: z.string().min(1),
    imageAssetId: idSchema.optional(),
    imageAlt: z.string().min(1).optional(),
    caption: z.string().min(1).optional(),
  })
  .superRefine((slide, context) => {
    if (Boolean(slide.imageAssetId) !== Boolean(slide.imageAlt)) {
      context.addIssue({
        code: 'custom',
        path: [slide.imageAssetId ? 'imageAlt' : 'imageAssetId'],
        message: 'Carousel image asset and alt text must be provided together.',
      })
    }
  })

export const carouselPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('carousel'),
    content: z
      .strictObject({
        title: z.string().min(1),
        slides: z.array(carouselSlideSchema).min(2).max(8),
      })
      .superRefine((content, context) => {
        const ids = content.slides.map(({ id }) => id)
        if (new Set(ids).size !== ids.length) {
          context.addIssue({
            code: 'custom',
            path: ['slides'],
            message: 'Carousel slide IDs must be unique.',
          })
        }
      }),
  })
  .superRefine((primitive, context) => {
    if (primitive.completion.mode !== 'explored' || 'count' in primitive.completion) {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'Carousel must require all slides with completion mode explored.',
      })
    }
  })

export type CarouselPrimitive = z.infer<typeof carouselPrimitiveSchema>

export const carouselContentSchema = {
  schema: carouselPrimitiveSchema,
  assetRefs: (primitive) =>
    primitive.content.slides.flatMap((slide, index) =>
      slide.imageAssetId
        ? [
            {
              assetId: slide.imageAssetId,
              type: 'image' as const,
              path: `content.slides.${index}.imageAssetId`,
            },
          ]
        : [],
    ),
} satisfies PrimitiveContentSchema<CarouselPrimitive>
