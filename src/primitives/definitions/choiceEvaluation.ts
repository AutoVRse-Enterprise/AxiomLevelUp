import { z } from 'zod'

import { idSchema } from '@/content/schema'
import type { EvaluationResult } from '@/primitives/types'

export const multipleChoiceResponseSchema = idSchema
export const multipleSelectResponseSchema = z
  .array(idSchema)
  .refine((ids) => new Set(ids).size === ids.length, 'selected option IDs must be unique')
export const trueFalseResponseSchema = z.boolean()

export function buildChoiceItems(
  optionIds: readonly string[],
  selectedIds: ReadonlySet<string>,
  correctIds: ReadonlySet<string>,
): NonNullable<EvaluationResult['items']> {
  const items: NonNullable<EvaluationResult['items']> = {}

  for (const id of optionIds) {
    if (selectedIds.has(id)) items[id] = correctIds.has(id) ? 'correct' : 'incorrect'
    else if (correctIds.has(id)) items[id] = 'missed'
  }

  return items
}
