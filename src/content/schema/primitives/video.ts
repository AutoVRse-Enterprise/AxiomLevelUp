import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const videoMarkerSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  timeSeconds: z.number().nonnegative(),
})

const checkpointOptionSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
})

const videoCheckpointSchema = z
  .strictObject({
    id: idSchema,
    timeSeconds: z.number().positive(),
    prompt: z.string().min(1),
    options: z.array(checkpointOptionSchema).min(2).max(6),
    correctOptionId: idSchema,
    explanation: z.string().min(1).optional(),
  })
  .superRefine((checkpoint, context) => {
    const optionIds = checkpoint.options.map(({ id }) => id)
    if (new Set(optionIds).size !== optionIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Checkpoint option IDs must be unique.',
      })
    }
    if (!optionIds.includes(checkpoint.correctOptionId)) {
      context.addIssue({
        code: 'custom',
        path: ['correctOptionId'],
        message: 'Checkpoint answer must reference an option.',
      })
    }
  })

export const videoPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('video'),
    content: z
      .strictObject({
        assetId: idSchema,
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        posterAssetId: idSchema.optional(),
        captionsAssetId: idSchema,
        captionsLabel: z.string().min(1).default('English'),
        markers: z.array(videoMarkerSchema).optional(),
        checkpoints: z.array(videoCheckpointSchema).optional(),
      })
      .superRefine((content, context) => {
        for (const [path, values] of [
          ['markers', content.markers],
          ['checkpoints', content.checkpoints],
        ] as const) {
          const ids = values?.map(({ id }) => id) ?? []
          if (new Set(ids).size !== ids.length) {
            context.addIssue({
              code: 'custom',
              path: [path],
              message: `${path === 'markers' ? 'Marker' : 'Checkpoint'} IDs must be unique.`,
            })
          }
        }
      }),
  })
  .superRefine((primitive, context) => {
    if (primitive.completion.mode !== 'media_progress') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'Video must use media_progress completion.',
      })
    }
  })

export type VideoPrimitive = z.infer<typeof videoPrimitiveSchema>

export const videoContentSchema = {
  schema: videoPrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'video',
      path: 'content.assetId',
    },
    ...(primitive.content.posterAssetId
      ? [
          {
            assetId: primitive.content.posterAssetId,
            type: 'image' as const,
            path: 'content.posterAssetId',
          },
        ]
      : []),
    {
      assetId: primitive.content.captionsAssetId,
      type: 'text',
      path: 'content.captionsAssetId',
    },
  ],
} satisfies PrimitiveContentSchema<VideoPrimitive>
