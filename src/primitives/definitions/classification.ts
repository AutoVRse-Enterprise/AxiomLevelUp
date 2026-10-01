import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ClassificationPrimitive } from '@/content/schema/primitives'
import { parseCompleteAssignments } from '@/primitives/definitions/structuredEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

export const classificationDefinition = definePrimitive<ClassificationPrimitive>({
  type: 'classification',
  family: 'assessment',
  label: 'Classification',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('classification'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const assignments = parseCompleteAssignments(
      response,
      primitive.content.items.map((item) => item.id),
      new Set(primitive.content.categories.map((category) => category.id)),
    )
    const correctCount = assignments
      ? primitive.content.items.filter((item) => assignments[item.id] === item.categoryId).length
      : 0
    const exact = correctCount === primitive.content.items.length
    const score =
      primitive.content.scoringMode === 'partial'
        ? correctCount / primitive.content.items.length
        : Number(exact)

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: Object.fromEntries(
        primitive.content.items.map((item) => [
          item.id,
          assignments
            ? assignments[item.id] === item.categoryId
              ? 'correct'
              : 'incorrect'
            : 'missed',
        ]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
