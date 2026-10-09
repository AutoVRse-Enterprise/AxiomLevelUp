import type { DicomExplorePrimitive, DicomGuidedPrimitive } from '@/content/schema/primitives'
import { isSliceInRange } from '@/imaging/geometry'

export interface DicomObservation {
  slice: number
  presetId: string | null
  activeTool: string
  interactionCount: number
  acknowledgedStepIds: ReadonlySet<string>
  visitedPresetIds?: ReadonlySet<string>
}

export function parseExploreObservation(value: unknown): DicomObservation | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<DicomObservation> & { visitedPresetIds?: unknown }
  const slice = candidate.slice
  const interactionCount = candidate.interactionCount
  if (typeof slice !== 'number' || !Number.isInteger(slice) || typeof interactionCount !== 'number') {
    return null
  }
  const visited = Array.isArray(candidate.visitedPresetIds)
    ? candidate.visitedPresetIds.filter((id): id is string => typeof id === 'string')
    : candidate.visitedPresetIds instanceof Set
      ? [...candidate.visitedPresetIds].filter((id): id is string => typeof id === 'string')
      : undefined
  return {
    slice,
    presetId: typeof candidate.presetId === 'string' || candidate.presetId === null
      ? candidate.presetId
      : null,
    activeTool: typeof candidate.activeTool === 'string' ? candidate.activeTool : 'scroll',
    interactionCount,
    acknowledgedStepIds: new Set(),
    ...(visited ? { visitedPresetIds: new Set(visited) } : {}),
  }
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

function visitedPresetIds(observation: DicomObservation): ReadonlySet<string> {
  if (observation.visitedPresetIds) return observation.visitedPresetIds
  return observation.presetId ? new Set([observation.presetId]) : new Set()
}

export function satisfiedExploreRequirements(
  primitive: DicomExplorePrimitive,
  observation: DicomObservation,
): string[] {
  const requirements = primitive.content.requirements
  if (!requirements) return []
  const visited = visitedPresetIds(observation)
  return [
    ...(requirements.minimumInteractions &&
    observation.interactionCount >= requirements.minimumInteractions
      ? ['interactions']
      : []),
    ...(requirements.visitSliceRange &&
    isSliceInRange(observation.slice, requirements.visitSliceRange)
      ? ['slice_range']
      : []),
    ...(requirements.presetIds ?? []).filter((id) => visited.has(id)).map((id) => `preset:${id}`),
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
