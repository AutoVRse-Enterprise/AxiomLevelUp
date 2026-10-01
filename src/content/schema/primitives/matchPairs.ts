import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const matchItemSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
})

export const matchPairSchema = z.strictObject({
  leftId: idSchema,
  rightId: idSchema,
})

export const matchPairsPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('match_pairs'),
  content: z
    .strictObject({
      prompt: z.string().min(1),
      left: z.array(matchItemSchema).min(2),
      right: z.array(matchItemSchema).min(2),
      pairs: z.array(matchPairSchema).min(2),
      scoringMode: z.enum(['all_or_nothing', 'partial']).default('all_or_nothing'),
      explanation: z.string().min(1),
    })
    .superRefine((value, context) => {
      const leftIds = value.left.map((item) => item.id)
      const rightIds = value.right.map((item) => item.id)
      const leftIdSet = new Set(leftIds)
      const rightIdSet = new Set(rightIds)
      const pairedLeftIds = value.pairs.map((pair) => pair.leftId)
      const pairedRightIds = value.pairs.map((pair) => pair.rightId)

      if (leftIdSet.size !== leftIds.length) {
        context.addIssue({ code: 'custom', message: 'left IDs must be unique', path: ['left'] })
      }
      if (rightIdSet.size !== rightIds.length) {
        context.addIssue({ code: 'custom', message: 'right IDs must be unique', path: ['right'] })
      }
      if (
        pairedLeftIds.length !== leftIds.length ||
        new Set(pairedLeftIds).size !== pairedLeftIds.length ||
        pairedLeftIds.some((id) => !leftIdSet.has(id))
      ) {
        context.addIssue({
          code: 'custom',
          message: 'pairs must reference every left item exactly once',
          path: ['pairs'],
        })
      }
      if (
        new Set(pairedRightIds).size !== pairedRightIds.length ||
        pairedRightIds.some((id) => !rightIdSet.has(id))
      ) {
        context.addIssue({
          code: 'custom',
          message: 'pair rightId values must be unique right-item references',
          path: ['pairs'],
        })
      }
    }),
})

export type MatchPairsPrimitive = z.infer<typeof matchPairsPrimitiveSchema>

export const matchPairsContentSchema = {
  schema: matchPairsPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<MatchPairsPrimitive>
