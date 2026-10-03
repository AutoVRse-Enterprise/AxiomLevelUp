import { z } from 'zod'

import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import { idSchema } from '@/content/schema'
import type {
  AnatomyExplorePrimitive,
  AnatomyLocateLevel,
  AnatomyLocatePrimitive,
} from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export interface AnatomyExploreObservation {
  loaded: boolean
  interactionCount: number
  selectedStructureIds: readonly string[]
  reachedWaypointIds: readonly string[]
  inspectedFindingIds: readonly string[]
}

export function anatomyExploreRequirementKeys(primitive: AnatomyExplorePrimitive): string[] {
  return [
    ...(primitive.content.requiredStructureIds ?? []).map((id) => `structure:${id}`),
    ...(primitive.content.requiredWaypointIds ?? []).map((id) => `waypoint:${id}`),
    ...(primitive.content.requiredFindingIds ?? []).map((id) => `finding:${id}`),
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
    ...observation.inspectedFindingIds.map((id) => `finding:${id}`),
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

export type AnatomyLocateResponse = Record<string, string>

export const anatomyLocateResponseSchema = z.record(idSchema, idSchema)

export function anatomyLocateTargetId(level: AnatomyLocateLevel): string {
  switch (level.input) {
    case 'model':
      return level.targetStructureId
    case 'image':
      return level.targetRegionId
    case 'choice':
      return level.correctOptionId
  }
}

function isKnownSelection(level: AnatomyLocateLevel, selectionId: string): boolean {
  switch (level.input) {
    case 'model':
      return true
    case 'image':
      return level.regions.some(({ id }) => id === selectionId)
    case 'choice':
      return level.options.some(({ id }) => id === selectionId)
  }
}

function parseAnatomyLocateSelections(
  primitive: AnatomyLocatePrimitive,
  response: unknown,
): AnatomyLocateResponse | null {
  const parsed = anatomyLocateResponseSchema.safeParse(response)
  if (!parsed.success) return null

  const expectedLevelIds = new Set(primitive.content.levels.map(({ levelId }) => levelId))
  const entries = Object.entries(parsed.data)
  if (
    entries.some(([levelId]) => !expectedLevelIds.has(levelId)) ||
    primitive.content.levels.some(
      (level) =>
        level.levelId in parsed.data &&
        !isKnownSelection(level, parsed.data[level.levelId] as string),
    )
  ) {
    return null
  }

  return parsed.data
}

export function parseAnatomyLocateResponse(
  primitive: AnatomyLocatePrimitive,
  response: unknown,
): AnatomyLocateResponse | null {
  const selections = parseAnatomyLocateSelections(primitive, response)
  return selections && Object.keys(selections).length === primitive.content.levels.length
    ? selections
    : null
}

export function anatomyLocateCorrectResponse(
  primitive: AnatomyLocatePrimitive,
): AnatomyLocateResponse {
  return Object.fromEntries(
    primitive.content.levels.map((level) => [level.levelId, anatomyLocateTargetId(level)]),
  )
}

export const anatomyLocateDefinition = definePrimitive<AnatomyLocatePrimitive>({
  type: 'anatomy_locate',
  family: 'assessment',
  label: 'Anatomy localisation',
  layout: 'viewer',
  timerCompatible: timerCompatibleTypeSet.has('anatomy_locate'),
  timeoutCredit: 'committed_progress',
  scored: () => true,
  evaluate: (primitive, response) => {
    const selections = parseAnatomyLocateSelections(primitive, response)
    const totalWeight = primitive.content.levels.reduce(
      (total, level) => total + (level.weight ?? 1),
      0,
    )
    const earnedWeight = selections
      ? primitive.content.levels.reduce(
          (total, level) =>
            total +
            (selections[level.levelId] === anatomyLocateTargetId(level) ? (level.weight ?? 1) : 0),
          0,
        )
      : 0
    const score = totalWeight > 0 ? earnedWeight / totalWeight : 0

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation ?? null,
      items: Object.fromEntries(
        primitive.content.levels.map((level) => [
          level.levelId,
          selections && level.levelId in selections
            ? selections[level.levelId] === anatomyLocateTargetId(level)
              ? 'correct'
              : 'incorrect'
            : 'missed',
        ]),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
