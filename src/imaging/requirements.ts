import type { DicomExplorePrimitive, DicomGuidedPrimitive } from '@/content/schema/primitives'
import { isSliceInRange } from '@/imaging/geometry'

export interface DicomObservation {
  slice: number
  presetId: string | null
  activeTool: string
  interactionCount: number
  acknowledgedStepIds: ReadonlySet<string>
}

export function exploreRequirementKeys(primitive: DicomExplorePrimitive): string[] {
  const requirements = primitive.content.requirements
  if (!requirements) return []
  return [
    ...(requirements.minimumInteractions ? ['interactions'] : []),
    ...(requirements.visitSliceRange ? ['slice_range'] : []),
    ...(requirements.presetIds ?? []).map((id) => `preset:${id}`),
  ]
}

export function satisfiedExploreRequirements(
  primitive: DicomExplorePrimitive,
  observation: DicomObservation,
): string[] {
  const requirements = primitive.content.requirements
  if (!requirements) return []
  return [
    ...(requirements.minimumInteractions &&
    observation.interactionCount >= requirements.minimumInteractions
      ? ['interactions']
      : []),
    ...(requirements.visitSliceRange &&
    isSliceInRange(observation.slice, requirements.visitSliceRange)
      ? ['slice_range']
      : []),
    ...(requirements.presetIds ?? [])
      .filter((id) => observation.presetId === id)
      .map((id) => `preset:${id}`),
  ]
}

export function guidedStepSatisfied(
  step: DicomGuidedPrimitive['content']['steps'][number],
  observation: DicomObservation,
): boolean {
  switch (step.condition.type) {
    case 'slice_range':
      return isSliceInRange(observation.slice, step.condition.range)
    case 'preset':
      return observation.presetId === step.condition.presetId
    case 'tool':
      return observation.activeTool === step.condition.tool
    case 'interaction':
      return observation.interactionCount >= step.condition.count
    case 'acknowledge':
      return observation.acknowledgedStepIds.has(step.id)
  }
}

export function firstIncompleteGuidedStep(
  primitive: DicomGuidedPrimitive,
  observation: DicomObservation,
): number {
  return primitive.content.steps.findIndex((step) => !guidedStepSatisfied(step, observation))
}
