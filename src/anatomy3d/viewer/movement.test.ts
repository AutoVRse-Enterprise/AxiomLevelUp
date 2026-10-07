import anatomyMapDocument from '../../../public/content/fixtures/anatomy-map.json'
import { describe, expect, it } from 'vitest'

import {
  canTravelTo,
  movementCost,
  reachableWithin,
  waypointAdjacency,
} from '@/anatomy3d/viewer/movement'
import { anatomyMapSchema } from '@/content/schema'

const map = anatomyMapSchema.parse(anatomyMapDocument)

describe('anatomy movement', () => {
  it('treats waypoint edges as reversible and bounds the entry subgraph', () => {
    const adjacency = waypointAdjacency(map)
    expect(adjacency.get('entry-waypoint')).toContain('terminal-waypoint')
    expect(adjacency.get('terminal-waypoint')).toContain('entry-waypoint')
    expect(reachableWithin(map, 'entry-waypoint', 0)).toEqual(new Set(['entry-waypoint']))
    expect(reachableWithin(map, 'entry-waypoint', 1)).toEqual(
      new Set(['entry-waypoint', 'terminal-waypoint']),
    )
  })

  it('makes revisiting free only when configured', () => {
    expect(movementCost(['entry-waypoint'], 'entry-waypoint', true)).toBe(0)
    expect(movementCost(['entry-waypoint'], 'entry-waypoint', false)).toBe(1)
    expect(movementCost(['entry-waypoint'], 'terminal-waypoint', true)).toBe(1)
  })

  it('rejects destinations outside the hop or move budget', () => {
    const state = {
      entryWaypointId: 'entry-waypoint',
      currentWaypointId: 'entry-waypoint',
      visitedWaypointIds: ['entry-waypoint'],
      movesUsed: 1,
    }
    expect(
      canTravelTo('terminal-waypoint', reachableWithin(map, 'entry-waypoint', 1), state, {
        maxMoves: 1,
        maxHopsFromEntry: 1,
        freeBacktrack: true,
      }),
    ).toBe(false)
  })
})
