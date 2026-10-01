import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { MatchPairsPrimitive } from '@/content/schema/primitives'
import { parseCompleteAssignments } from '@/primitives/definitions/structuredEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

export const matchPairsDefinition = definePrimitive<MatchPairsPrimitive>({
  type: 'match_pairs',
  family: 'assessment',
  label: 'Match pairs',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('match_pairs'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const matches = parseCompleteAssignments(
      response,
      primitive.content.left.map((item) => item.id),
      new Set(primitive.content.right.map((item) => item.id)),
      true,
    )
    const expected = new Map(
      primitive.content.pairs.map((pair) => [pair.leftId, pair.rightId] as const),
    )
    const correctCount = matches
      ? primitive.content.left.filter((item) => matches[item.id] === expected.get(item.id)).length
      : 0
    const exact = correctCount === primitive.content.left.length
    const score =
      primitive.content.scoringMode === 'partial'
        ? correctCount / primitive.content.left.length
        : Number(exact)

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: Object.fromEntries(
        primitive.content.left.map((item) => [
          item.id,
          matches
            ? matches[item.id] === expected.get(item.id)
              ? 'correct'
              : 'incorrect'
            : 'missed',
        ]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
