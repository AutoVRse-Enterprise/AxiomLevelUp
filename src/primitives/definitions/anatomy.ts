import type { AnatomyExplorePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export interface AnatomyExploreObservation {
  loaded: boolean
  interactionCount: number
  selectedStructureIds: readonly string[]
  reachedWaypointIds: readonly string[]
}

export function anatomyExploreRequirementKeys(primitive: AnatomyExplorePrimitive): string[] {
  return [
    ...(primitive.content.requiredStructureIds ?? []).map((id) => `structure:${id}`),
    ...(primitive.content.requiredWaypointIds ?? []).map((id) => `waypoint:${id}`),
  ]
}

export function isAnatomyExploreComplete(
  primitive: AnatomyExplorePrimitive,
  observation: AnatomyExploreObservation,
): boolean {
  if (primitive.completion.mode === 'viewed') return observation.loaded
  if (primitive.completion.mode === 'minimum_interactions') {
    const count =
      'count' in primitive.completion && typeof primitive.completion.count === 'number'
        ? primitive.completion.count
        : 1
    return observation.interactionCount >= count
  }
  if (primitive.completion.mode !== 'explored') return false

  const observed = new Set([
    ...observation.selectedStructureIds.map((id) => `structure:${id}`),
    ...observation.reachedWaypointIds.map((id) => `waypoint:${id}`),
  ])
  const required = anatomyExploreRequirementKeys(primitive)
  const completed = required.filter((key) => observed.has(key)).length
  const count =
    'count' in primitive.completion && typeof primitive.completion.count === 'number'
      ? primitive.completion.count
      : required.length
  return completed >= count
}

export const anatomyExploreDefinition = definePrimitive<AnatomyExplorePrimitive>({
  type: 'anatomy_explore',
  family: 'domain',
  label: 'Anatomy exploration',
  layout: 'viewer',
  timerCompatible: false,
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.prompt,
  explorableKeys: anatomyExploreRequirementKeys,
})
