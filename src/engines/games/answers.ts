import type { PlannedRound } from '@/engines/games/plan'
import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type {
  AnatomyLocatePrimitive,
  ImageHotspotPrimitive,
  MultipleChoicePrimitive,
} from '@/content/schema/primitives'

export interface AnswerDimensionLabel {
  levelId: string
  levelLabel: string
  label: string
}

export function correctAnswerDimensions(
  round: PlannedRound,
  anatomyMap?: AnatomyMap,
): AnswerDimensionLabel[] {
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
          : (anatomyMap?.structures.find(({ id }) => id === targetId)?.label ?? targetId)
    const levelLabel =
      anatomyMap?.levels.find(({ id }) => id === level.levelId)?.label ??
      level.levelId.replaceAll('-', ' ')
    return { levelId: level.levelId, levelLabel, label }
  })
}

export function correctAnswerLabel(round: PlannedRound, anatomyMap?: AnatomyMap): string {
  if (round.primitive.type === 'multiple_choice') {
    const { correctOptionId, options } = (round.primitive as MultipleChoicePrimitive).content
    return options.find(({ id }) => id === correctOptionId)?.label ?? correctOptionId
  }
  if (round.primitive.type === 'anatomy_locate') {
    return correctAnswerDimensions(round, anatomyMap)
      .map(({ label }) => label)
      .join(' · ')
  }
  if (round.primitive.type === 'image_hotspot') {
    const content = (round.primitive as ImageHotspotPrimitive).content
    return content.mode === 'assess' ? (content.answerLabel ?? '') : ''
  }
  return ''
}
