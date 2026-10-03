export interface OcclusionBlobSample {
  radiusScale: number
  angle: number
  spreadScale: number
  rotation: readonly [number, number, number]
}

function seededRandom(id: string) {
  let state = 2166136261
  for (const character of id) {
    state ^= character.charCodeAt(0)
    state = Math.imul(state, 16777619)
  }
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state)
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state)
    return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function deterministicOcclusionBlobs(
  findingId: string,
  count: number,
): OcclusionBlobSample[] {
  const random = seededRandom(findingId)
  return Array.from({ length: count }, () => ({
    radiusScale: 0.62 + random() * 0.56,
    angle: random() * Math.PI * 2,
    spreadScale: random(),
    rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI] as const,
  }))
}
