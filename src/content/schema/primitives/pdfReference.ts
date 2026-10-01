import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const pdfReferencePrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('pdf_reference'),
    content: z.strictObject({
      assetId: idSchema,
      citation: z.string().min(1),
      summary: z.string().min(1),
      page: z.number().int().positive().optional(),
      coverAssetId: idSchema.optional(),
      linkLabel: z.string().min(1).default('Open reference'),
    }),
  })
  .superRefine((primitive, context) => {
    if (primitive.completion.mode !== 'viewed') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'PDF references must use viewed completion.',
      })
    }
  })

export type PdfReferencePrimitive = z.infer<typeof pdfReferencePrimitiveSchema>

export const pdfReferenceContentSchema = {
  schema: pdfReferencePrimitiveSchema,
  assetRefs: (primitive) => [
    {
      assetId: primitive.content.assetId,
      type: 'document',
      path: 'content.assetId',
    },
    ...(primitive.content.coverAssetId
      ? [
          {
            assetId: primitive.content.coverAssetId,
            type: 'image' as const,
            path: 'content.coverAssetId',
          },
        ]
      : []),
  ],
} satisfies PrimitiveContentSchema<PdfReferencePrimitive>
