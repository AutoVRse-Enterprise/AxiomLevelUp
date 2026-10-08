import { describe, expect, it } from 'vitest'

import { lumenWallIndices } from '@/anatomy3d/three/lumenGeometry'

type Vector = readonly [number, number, number]

function subtract(left: Vector, right: Vector): Vector {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]]
}

function cross(left: Vector, right: Vector): Vector {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function dot(left: Vector, right: Vector) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

describe('lumenWallIndices', () => {
  it('winds wall triangles outward for an interior-facing material', () => {
    const radialSegments = 8
    const indices = lumenWallIndices(2, radialSegments)
    const vertex = (index: number): Vector => {
      const row = radialSegments + 1
      const segment = Math.floor(index / row)
      const angle = ((index % row) / radialSegments) * Math.PI * 2
      return [Math.cos(angle), Math.sin(angle), segment]
    }
    const vertices = indices.slice(0, 3).map(vertex)
    const normal = cross(subtract(vertices[1]!, vertices[0]!), subtract(vertices[2]!, vertices[0]!))
    const radialOut: Vector = [
      vertices.reduce((sum, current) => sum + current[0], 0) / vertices.length,
      vertices.reduce((sum, current) => sum + current[1], 0) / vertices.length,
      0,
    ]

    expect(dot(normal, radialOut)).toBeGreaterThan(0)
  })
})
