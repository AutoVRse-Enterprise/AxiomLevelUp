export function lumenWallIndices(tubularSegments: number, radialSegments: number) {
  const indices: number[] = []

  for (let segment = 0; segment < tubularSegments; segment += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const row = radialSegments + 1
      const a = segment * row + side
      const b = (segment + 1) * row + side
      indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }

  return indices
}
