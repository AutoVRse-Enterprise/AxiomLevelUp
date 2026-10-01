import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { FillBlankPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'
import { normalizeTextResponse } from '@/primitives/definitions/typedResponseEvaluation'

function readCompleteResponse(
  primitive: FillBlankPrimitive,
  response: unknown,
): Record<string, string> | null {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return null

  const entries = Object.entries(response)
  const blankIds = primitive.content.blanks.map((blank) => blank.id)
  if (
    entries.length !== blankIds.length ||
    entries.some(
      ([id, value]) =>
        !blankIds.includes(id) ||
        typeof value !== 'string' ||
        normalizeTextResponse(value, true).length === 0,
    )
  ) {
    return null
  }

  return Object.fromEntries(entries) as Record<string, string>
}

export const fillBlankDefinition = definePrimitive<FillBlankPrimitive>({
  type: 'fill_blank',
  family: 'assessment',
  label: 'Fill in the blank',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('fill_blank'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsedResponse = readCompleteResponse(primitive, response)
    const items = Object.fromEntries(
      primitive.content.blanks.map((blank) => {
        if (!parsedResponse) return [blank.id, 'missed'] as const

        const responseValue = normalizeTextResponse(parsedResponse[blank.id]!, blank.caseSensitive)
        const accepted = blank.accepted.some(
          (answer) => normalizeTextResponse(answer, blank.caseSensitive) === responseValue,
        )
        return [blank.id, accepted ? 'correct' : 'incorrect'] as const
      }),
    )
    const correctCount = Object.values(items).filter((status) => status === 'correct').length
    const score = parsedResponse ? correctCount / primitive.content.blanks.length : 0

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items,
    }
  },
  reviewPrompt: (primitive) => primitive.content.text,
})
