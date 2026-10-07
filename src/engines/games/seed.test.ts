import { describe, expect, it } from 'vitest'

import { createRunSeed, dailySeed, pickFromPool, stringHash } from './seed'

describe('game seeds', () => {
  it('creates unsigned 32-bit run seeds from an injected random source', () => {
    expect(createRunSeed(() => 0)).toBe(0)
    expect(createRunSeed(() => 0.5)).toBe(2_147_483_648)
    expect(createRunSeed(() => 0.999_999_999_999)).toBeLessThanOrEqual(0xffff_ffff)
  })

  it('hashes strings and local game dates deterministically', () => {
    expect(stringHash('respiratory-challenge')).toBe(stringHash('respiratory-challenge'))
    expect(dailySeed('respiratory-challenge', '2026-10-07')).toBe(
      dailySeed('respiratory-challenge', '2026-10-07'),
    )
    expect(dailySeed('respiratory-challenge', '2026-10-07')).not.toBe(
      dailySeed('respiratory-challenge', '2026-10-08'),
    )
    expect(dailySeed('respiratory-challenge', '2026-10-07')).not.toBe(
      dailySeed('another-game', '2026-10-07'),
    )
  })

  it('uses a salted seeded shuffle without mutating the pool', () => {
    const pool = ['a', 'b', 'c', 'd']
    const first = pickFromPool(pool, 2, 42, 'first-slot')

    expect(first).toEqual(pickFromPool(pool, 2, 42, 'first-slot'))
    expect(first).not.toEqual(pickFromPool(pool, 2, 42, 'second-slot'))
    expect(pool).toEqual(['a', 'b', 'c', 'd'])
  })

  it('rejects invalid random values and local dates', () => {
    expect(() => createRunSeed(() => 1)).toThrow(/random source/)
    expect(() => dailySeed('game', '2026-02-30')).toThrow(/valid calendar date/)
    expect(() => dailySeed('game', '07-10-2026')).toThrow(/YYYY-MM-DD/)
  })
})
