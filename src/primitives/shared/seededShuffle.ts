function hashSeed(seed: string | number): number {
  const value = String(seed)
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createRandom(seed: string | number) {
  let state = hashSeed(seed)

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: string | number): T[] {
  const shuffled = [...items]
  const random = createRandom(seed)

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!]
  }

  return shuffled
}

export function ensureUnsolvedOrder<T>(
  candidate: readonly T[],
  solved: readonly T[],
  getKey: (item: T) => string = (item) => String(item),
): T[] {
  const result = [...candidate]
  const isSolved =
    result.length === solved.length &&
    result.every((item, index) => getKey(item) === getKey(solved[index]!))

  if (isSolved && result.length > 1) {
    ;[result[0], result[1]] = [result[1]!, result[0]!]
  }

  return result
}

export function seededUnsolvedOrder<T>(
  solved: readonly T[],
  seed: string | number,
  getKey?: (item: T) => string,
): T[] {
  return ensureUnsolvedOrder(seededShuffle(solved, seed), solved, getKey)
}
