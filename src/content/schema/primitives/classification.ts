import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const classificationCategorySchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
})

export const classificationItemSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  categoryId: idSchema,
})

export const classificationPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('classification'),
  content: z
    .strictObject({
      prompt: z.string().min(1),
      categories: z.array(classificationCategorySchema).min(2).max(5),
      items: z.array(classificationItemSchema).min(2),
      scoringMode: z.enum(['all_or_nothing', 'partial']).default('all_or_nothing'),
      explanation: z.string().min(1),
    })
    .superRefine((value, context) => {
      const categoryIds = value.categories.map((category) => category.id)
      const categoryIdSet = new Set(categoryIds)
      const itemIds = value.items.map((item) => item.id)

      if (categoryIdSet.size !== categoryIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'category IDs must be unique',
          path: ['categories'],
        })
      }
      if (new Set(itemIds).size !== itemIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'item IDs must be unique',
          path: ['items'],
        })
      }
      value.items.forEach((item, index) => {
        if (!categoryIdSet.has(item.categoryId)) {
          context.addIssue({
            code: 'custom',
            message: 'categoryId must reference a category',
            path: ['items', index, 'categoryId'],
          })
        }
      })
    }),
})

export type ClassificationPrimitive = z.infer<typeof classificationPrimitiveSchema>

export const classificationContentSchema = {
  schema: classificationPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<ClassificationPrimitive>
