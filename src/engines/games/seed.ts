import { seededShuffle } from '@/primitives/shared/seededShuffle'

const UINT32_RANGE = 0x1_0000_0000
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function stringHash(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createRunSeed(random: () => number = Math.random): number {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(
      'Run seed random source must return a number from 0 (inclusive) to 1 (exclusive).',
    )
  }
  return Math.floor(value * UINT32_RANGE) >>> 0
}

export function dailySeed(gameId: string, localDate: string): number {
  if (!LOCAL_DATE_PATTERN.test(localDate)) {
    throw new Error(`Daily seed date must use local YYYY-MM-DD format; received "${localDate}".`)
  }

  const [year, month, day] = localDate.split('-').map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day!))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Daily seed date is not a valid calendar date: "${localDate}".`)
  }

  return stringHash(`${gameId}:${localDate}`)
}

export function pickFromPool<T>(
  pool: readonly T[],
  count: number,
  seed: number,
  salt: string,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Pool pick count must be a non-negative integer; received ${count}.`)
  }
  if (count > pool.length) {
    throw new RangeError(`Cannot pick ${count} items from a pool of ${pool.length}.`)
  }

  return seededShuffle(pool, `${seed >>> 0}:${salt}`).slice(0, count)
}
