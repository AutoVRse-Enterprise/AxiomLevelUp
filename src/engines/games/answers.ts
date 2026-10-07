import type { PlannedRound } from '@/engines/games/plan'
import type { MultipleChoicePrimitive } from '@/content/schema/primitives'

export function correctAnswerLabel(round: PlannedRound): string {
  if (round.primitive.type === 'multiple_choice') {
    const { correctOptionId, options } = (round.primitive as MultipleChoicePrimitive).content
    return options.find(({ id }) => id === correctOptionId)?.label ?? correctOptionId
  }
  return ''
}
