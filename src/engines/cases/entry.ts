import type { AnatomyMap, CaseDocument } from '@/content/schema'
import type { AnatomyLocatePrimitive } from '@/content/schema/primitives'

type CaseEntry = CaseDocument['entry']

export function selectUnknownWaypoint(entry: CaseEntry, seed: number): string | null {
  if (entry.mode !== 'unknown_waypoint') return null
  return entry.candidateWaypointIds[Math.abs(Math.trunc(seed)) % entry.candidateWaypointIds.length]!
}

export function resolveEntryLocalisation(
  primitive: AnatomyLocatePrimitive,
  map: AnatomyMap,
  waypointId: string,
): AnatomyLocatePrimitive {
  if (primitive.content.answerFrom !== 'entry') return primitive
  const answerIds = map.waypoints.find(({ id }) => id === waypointId)?.answerIds ?? {}

  return {
    ...primitive,
    content: {
      ...primitive.content,
      levels: primitive.content.levels.map((level) => {
        const answerId = answerIds[level.levelId]
        if (!answerId) return level
        if (level.input === 'model') return { ...level, targetStructureId: answerId }
        if (level.input === 'image') return { ...level, targetRegionId: answerId }
        return { ...level, correctOptionId: answerId }
      }),
    },
  }
}
