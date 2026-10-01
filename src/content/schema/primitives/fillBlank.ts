import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const answerTextSchema = z.string().trim().min(1)
const blankTokenPattern = /\{\{([^{}]+)\}\}/gu

export const fillBlankDefinitionSchema = z.strictObject({
  id: idSchema,
  accepted: z.array(answerTextSchema).min(1),
  caseSensitive: z.boolean().default(false),
  choices: z.array(answerTextSchema).min(2).optional(),
})

export const fillBlankPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('fill_blank'),
  content: z
    .strictObject({
      text: z.string().min(1),
      blanks: z.array(fillBlankDefinitionSchema).min(1),
      explanation: z.string().min(1),
    })
    .superRefine((value, context) => {
      const blankIds = value.blanks.map((blank) => blank.id)
      const matches = [...value.text.matchAll(blankTokenPattern)]
      const tokenIds = matches.map((match) => match[1]!)
      const textWithoutTokens = value.text.replace(blankTokenPattern, '')

      if (new Set(blankIds).size !== blankIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'blank IDs must be unique',
          path: ['blanks'],
        })
      }
      if (textWithoutTokens.includes('{{') || textWithoutTokens.includes('}}')) {
        context.addIssue({
          code: 'custom',
          message: 'text contains an invalid blank token',
          path: ['text'],
        })
      }
      tokenIds.forEach((tokenId, index) => {
        if (!idSchema.safeParse(tokenId).success) {
          context.addIssue({
            code: 'custom',
            message: 'blank tokens must contain valid IDs',
            path: ['text', index],
          })
        }
      })
      if (
        tokenIds.length !== blankIds.length ||
        new Set(tokenIds).size !== tokenIds.length ||
        tokenIds.some((id) => !blankIds.includes(id)) ||
        blankIds.some((id) => !tokenIds.includes(id))
      ) {
        context.addIssue({
          code: 'custom',
          message: 'blank tokens must exactly match blank definitions',
          path: ['text'],
        })
      }
    }),
})

export type FillBlankPrimitive = z.infer<typeof fillBlankPrimitiveSchema>

export const fillBlankContentSchema = {
  schema: fillBlankPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<FillBlankPrimitive>
