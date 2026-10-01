import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const richTextPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('rich_text'),
  content: z
    .strictObject({
      heading: z.string().min(1).optional(),
      body: z.string().min(1),
      emphasis: z.array(z.string().min(1)).optional(),
      terms: z
        .array(
          z.strictObject({
            term: z.string().min(1),
            definition: z.string().min(1),
          }),
        )
        .optional(),
      bullets: z.array(z.string().min(1)).optional(),
      imageAssetId: idSchema.optional(),
      keyTakeaway: z.string().min(1).optional(),
    })
    .superRefine((content, context) => {
      for (const [path, values] of [
        ['emphasis', content.emphasis],
        ['terms', content.terms?.map(({ term }) => term)],
      ] as const) {
        const normalized = values?.map((value) => value.toLocaleLowerCase()) ?? []
        if (new Set(normalized).size !== normalized.length) {
          context.addIssue({
            code: 'custom',
            path: [path],
            message: `${path === 'terms' ? 'Terms' : 'Emphasis phrases'} must be unique.`,
          })
        }
      }
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
