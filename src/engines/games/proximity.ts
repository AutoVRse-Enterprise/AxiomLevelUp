import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { GameScoringConfig } from '@/content/schema/game'

export type AnatomyAnswerPath = Readonly<Record<string, string>>
export type AnatomyAnswerReference = string | AnatomyAnswerPath

function structurePath(map: AnatomyMap, structureId: string): Record<string, string> {
  const structures = new Map(map.structures.map((structure) => [structure.id, structure]))
  const path: Record<string, string> = {}
  const visited = new Set<string>()
  let current = structures.get(structureId)

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path[current.levelId] = current.id
    current = current.parentId ? structures.get(current.parentId) : undefined
  }

  return path
}

function isAnswerPath(value: unknown): value is AnatomyAnswerPath {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((answerId) => typeof answerId === 'string')
  )
}

function enrichPath(map: AnatomyMap, path: AnatomyAnswerPath): AnatomyAnswerPath | null {
  const levelIds = new Set(map.levels.map(({ id }) => id))
  const explicit = Object.fromEntries(
    Object.entries(path).filter(
      ([levelId, answerId]) => levelIds.has(levelId) && answerId.length > 0,
    ),
  )
  if (Object.keys(explicit).length === 0) return null

  const inferred: Record<string, string> = {}
  for (const answerId of Object.values(explicit)) {
    Object.assign(inferred, structurePath(map, answerId))
  }

  return { ...inferred, ...explicit }
}

/**
 * Resolves either a structure, a waypoint, or a submitted level-to-answer map
 * into the anatomy map's ordered level hierarchy.
 */
export function resolveAnswerPath(map: AnatomyMap, reference: unknown): AnatomyAnswerPath | null {
  if (typeof reference === 'string') {
    const waypoint = map.waypoints.find(({ id }) => id === reference)
    if (waypoint) return waypoint.answerIds ? enrichPath(map, waypoint.answerIds) : null

    const path = structurePath(map, reference)
    return Object.keys(path).length > 0 ? path : null
  }

  return isAnswerPath(reference) ? enrichPath(map, reference) : null
}

function boundedAccuracy(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

/**
 * Compares coherent anatomy paths from the root toward the deepest configured
 * level. Once paths diverge, a repeated label at a lower level is not treated
 * as a common anatomical ancestor.
 */
export function resolveProximityAccuracy(
  map: AnatomyMap,
  expected: AnatomyAnswerPath | null,
  actual: AnatomyAnswerPath | null,
  config: GameScoringConfig['proximity'],
  levelIds?: readonly string[],
): number {
  if (!expected || !actual) return boundedAccuracy(config.none)

  const levelScope = levelIds ? new Set(levelIds) : null
  const expectedLevels = map.levels.filter(
    ({ id }) => expected[id] !== undefined && (!levelScope || levelScope.has(id)),
  )
  if (expectedLevels.length === 0) return boundedAccuracy(config.none)

  if (expectedLevels.every(({ id }) => actual[id] === expected[id])) {
    return boundedAccuracy(config.exact)
  }

  let deepestCommonLevel: string | null = null
  for (const { id } of expectedLevels) {
    if (actual[id] !== expected[id]) break
    deepestCommonLevel = id
  }

  return boundedAccuracy(
    deepestCommonLevel === null
      ? config.none
      : (config.byCommonLevel[deepestCommonLevel] ?? config.none),
  )
}
