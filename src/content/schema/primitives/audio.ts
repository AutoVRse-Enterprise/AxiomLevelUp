import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const audioPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('audio'),
    content: z
      .strictObject({
        assetId: idSchema,
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        transcript: z.string().min(1).optional(),
        transcriptAssetId: idSchema.optional(),
      })
      .refine((content) => content.transcript || content.transcriptAssetId, {
        path: ['transcript'],
        message: 'Audio requires inline transcript text or a transcript asset.',
      }),
  })
  .superRefine((primitive, context) => {
    if (primitive.completion.mode !== 'media_progress') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'Audio must use media_progress completion.',
      })
    }
  })

export type AudioPrimitive = z.infer<typeof audioPrimitiveSchema>

export const audioContentSchema = {
  schema: audioPrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'audio',
      path: 'content.assetId',
    },
    ...(primitive.content.transcriptAssetId
      ? [
          {
            assetId: primitive.content.transcriptAssetId,
            type: 'text' as const,
            path: 'content.transcriptAssetId',
          },
        ]
      : []),
  ],
} satisfies PrimitiveContentSchema<AudioPrimitive>
