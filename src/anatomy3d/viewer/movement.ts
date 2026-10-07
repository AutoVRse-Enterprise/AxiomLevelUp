import type { AnatomyMap } from '@/content/schema/anatomyMap'

export interface AnatomyMovementRule {
  maxMoves: number
  maxHopsFromEntry: number
  freeBacktrack: boolean
}

export interface AnatomyMovementState {
  entryWaypointId: string
  currentWaypointId: string
  visitedWaypointIds: readonly string[]
  movesUsed: number
}

export function waypointAdjacency(map: AnatomyMap): ReadonlyMap<string, ReadonlySet<string>> {
  const adjacency = new Map<string, Set<string>>()
  const ensure = (id: string) => {
    const current = adjacency.get(id)
    if (current) return current
    const created = new Set<string>()
    adjacency.set(id, created)
    return created
  }
  for (const waypoint of map.waypoints) {
    const neighbors = ensure(waypoint.id)
    for (const nextId of waypoint.next) {
      neighbors.add(nextId)
      ensure(nextId).add(waypoint.id)
    }
  }
  return adjacency
}

export function waypointHopDistances(
  map: AnatomyMap,
  entryWaypointId: string,
): ReadonlyMap<string, number> {
  const adjacency = waypointAdjacency(map)
  const distances = new Map<string, number>()
  if (!adjacency.has(entryWaypointId)) return distances
  const queue = [entryWaypointId]
  distances.set(entryWaypointId, 0)
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!
    const distance = distances.get(current)!
    for (const neighbor of adjacency.get(current) ?? []) {
      if (distances.has(neighbor)) continue
      distances.set(neighbor, distance + 1)
      queue.push(neighbor)
    }
  }
  return distances
}

export function reachableWithin(
  map: AnatomyMap,
  entryWaypointId: string,
  maxHopsFromEntry: number,
): ReadonlySet<string> {
  return new Set(
    [...waypointHopDistances(map, entryWaypointId)]
      .filter(([, hops]) => hops <= maxHopsFromEntry)
      .map(([id]) => id),
  )
}

export function movementCost(
  visitedWaypointIds: readonly string[],
  destinationWaypointId: string,
  freeBacktrack: boolean,
) {
  return freeBacktrack && visitedWaypointIds.includes(destinationWaypointId) ? 0 : 1
}

export function canTravelTo(
  destinationWaypointId: string,
  reachableWaypointIds: ReadonlySet<string>,
  state: AnatomyMovementState,
  rule: AnatomyMovementRule,
) {
  if (!reachableWaypointIds.has(destinationWaypointId)) return false
  return (
    state.movesUsed +
      movementCost(state.visitedWaypointIds, destinationWaypointId, rule.freeBacktrack) <=
    rule.maxMoves
  )
}
