import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const imagePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('image'),
  content: z
    .strictObject({
      assetId: idSchema,
      alt: z.string().min(1),
      caption: z.string().optional(),
      annotations: z
        .array(
          z.strictObject({
            id: idSchema,
            label: z.string().min(1),
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
          }),
        )
        .optional(),
    })
    .superRefine((content, context) => {
      const annotationIds = content.annotations?.map(({ id }) => id) ?? []
      if (new Set(annotationIds).size !== annotationIds.length) {
        context.addIssue({
          code: 'custom',
          path: ['annotations'],
          message: 'Annotation IDs must be unique.',
        })
      }
    }),
})

export type ImagePrimitive = z.infer<typeof imagePrimitiveSchema>

export const imageContentSchema = {
  schema: imagePrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'image',
      path: 'content.assetId',
    },
  ],
} satisfies PrimitiveContentSchema<ImagePrimitive>
