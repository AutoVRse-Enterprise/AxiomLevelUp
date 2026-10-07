import type { PlannedRound } from '@/engines/games/plan'
import type { AnatomyLocatePrimitive, MultipleChoicePrimitive } from '@/content/schema/primitives'

export interface AnswerDimensionLabel {
  levelId: string
  label: string
}

export function correctAnswerDimensions(round: PlannedRound): AnswerDimensionLabel[] {
  if (round.primitive.type !== 'anatomy_locate') return []
  const primitive = round.primitive as AnatomyLocatePrimitive
  return primitive.content.levels.map((level) => {
    const targetId =
      level.input === 'model' || level.input === 'structure_choice'
        ? level.targetStructureId
        : level.input === 'image'
          ? level.targetRegionId
          : level.correctOptionId
    const label =
      level.input === 'choice'
        ? (level.options.find(({ id }) => id === targetId)?.label ?? targetId)
        : level.input === 'image'
          ? (level.regions.find(({ id }) => id === targetId)?.label ?? targetId)
          : targetId
    return { levelId: level.levelId, label }
  })
}

export function correctAnswerLabel(round: PlannedRound): string {
  if (round.primitive.type === 'multiple_choice') {
    const { correctOptionId, options } = (round.primitive as MultipleChoicePrimitive).content
    return options.find(({ id }) => id === correctOptionId)?.label ?? correctOptionId
  }
  if (round.primitive.type === 'anatomy_locate') {
    return correctAnswerDimensions(round)
      .map(({ label }) => label)
      .join(' · ')
  }
  return ''
}
