import { z } from 'zod'

export const assignmentResponseSchema = z.record(z.string(), z.string())
export const orderingResponseSchema = z.array(z.string())

export function parseCompleteAssignments(
  response: unknown,
  sourceIds: readonly string[],
  targetIds: ReadonlySet<string>,
  requireUniqueTargets = false,
): Record<string, string> | null {
  const parsed = assignmentResponseSchema.safeParse(response)
  if (!parsed.success) return null

  const entries = Object.entries(parsed.data)
  const sourceIdSet = new Set(sourceIds)
  if (
    entries.length !== sourceIds.length ||
    entries.some(
      ([sourceId, targetId]) => !sourceIdSet.has(sourceId) || !targetIds.has(targetId),
    ) ||
    (requireUniqueTargets && new Set(Object.values(parsed.data)).size !== entries.length)
  ) {
    return null
  }

  return parsed.data
}

export function parseCompleteOrder(
  response: unknown,
  correctIds: readonly string[],
): string[] | null {
  const parsed = orderingResponseSchema.safeParse(response)
  if (!parsed.success) return null

  const expectedIds = new Set(correctIds)
  if (
    parsed.data.length !== correctIds.length ||
    new Set(parsed.data).size !== parsed.data.length ||
    parsed.data.some((id) => !expectedIds.has(id))
  ) {
    return null
  }

  return parsed.data
}
