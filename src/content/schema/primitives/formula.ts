import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const formulaPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('formula'),
  content: z.strictObject({
    title: z.string().trim().min(1).optional(),
    expressions: z
      .array(
        z.strictObject({
          id: idSchema,
          tex: z.string().trim().min(1),
          display: z.boolean(),
          ariaLabel: z.string().trim().min(1),
        }),
      )
      .min(1),
    variables: z
      .array(
        z.strictObject({
          symbol: z.string().trim().min(1),
          definition: z.string().trim().min(1),
          unit: z.string().trim().min(1).optional(),
        }),
      )
      .default([]),
  }),
})

export type FormulaPrimitive = z.infer<typeof formulaPrimitiveSchema>

export const formulaContentSchema = {
  schema: formulaPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<FormulaPrimitive>
