import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { OrderingPrimitive } from '@/content/schema/primitives'
import { parseCompleteOrder } from '@/primitives/definitions/structuredEvaluation'
import { definePrimitive } from '@/primitives/definitions/types'

export const orderingDefinition = definePrimitive<OrderingPrimitive>({
  type: 'ordering',
  family: 'assessment',
  label: 'Ordering',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('ordering'),
  scored: () => true,
  evaluate: (primitive, response) => {
    const correctIds = primitive.content.items.map((item) => item.id)
    const order = parseCompleteOrder(response, correctIds)
    const correctCount = order ? order.filter((id, index) => id === correctIds[index]).length : 0
    const exact = correctCount === correctIds.length
    const score =
      primitive.content.scoringMode === 'partial' ? correctCount / correctIds.length : Number(exact)

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: Object.fromEntries(
        correctIds.map((id, index) => [
          id,
          order ? (order[index] === id ? 'correct' : 'incorrect') : 'missed',
        ]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
