import { describe, expect, it } from 'vitest'

import {
  createCaseClock,
  pauseCaseClock,
  persistCaseClock,
  restoreCaseClock,
  resumeCaseClock,
  selectCaseClock,
  updateCaseClock,
} from '@/engines/cases/clock'

describe('case clock', () => {
  it('keeps none mode inactive and hidden', () => {
    const clock = resumeCaseClock(
      createCaseClock({ mode: 'none', accumulatedActiveMs: 2_000 }),
      10_000,
    )

    expect(selectCaseClock(clock, 20_000)).toEqual({
      mode: 'none',
      elapsedMs: 0,
      remainingMs: null,
      expired: false,
      running: false,
    })
  })

  it('runs a stopwatch across active segments only', () => {
    const started = resumeCaseClock(createCaseClock({ mode: 'stopwatch' }), 1_000)
    const paused = pauseCaseClock(started, 4_500)
    const resumed = resumeCaseClock(paused, 20_000)

    expect(selectCaseClock(paused, 19_000)).toMatchObject({
      elapsedMs: 3_500,
      remainingMs: null,
      expired: false,
      running: false,
    })
    expect(selectCaseClock(resumed, 21_250)).toMatchObject({
      elapsedMs: 4_750,
      remainingMs: null,
      expired: false,
      running: true,
    })
  })

  it('expires a countdown without ending or overrunning it', () => {
    const started = resumeCaseClock(
      createCaseClock({ mode: 'countdown', maxDurationMs: 5_000 }),
      10_000,
    )
    const expired = updateCaseClock(started, 16_000)

    expect(selectCaseClock(expired, 30_000)).toEqual({
      mode: 'countdown',
      elapsedMs: 5_000,
      remainingMs: 0,
      expired: true,
      running: false,
    })
    expect(resumeCaseClock(expired, 40_000)).toBe(expired)
  })

  it('restores accumulated active time without charging time away', () => {
    const started = resumeCaseClock(
      createCaseClock({
        mode: 'countdown',
        maxDurationMs: 10_000,
        accumulatedActiveMs: 2_000,
      }),
      1_000,
    )
    const persisted = persistCaseClock(started, 4_000)
    const restoredMuchLater = restoreCaseClock(persisted)

    expect(selectCaseClock(restoredMuchLater, 1_000_000)).toMatchObject({
      elapsedMs: 5_000,
      remainingMs: 5_000,
      expired: false,
      running: false,
    })

    const resumed = resumeCaseClock(restoredMuchLater, 1_000_000)
    expect(selectCaseClock(resumed, 1_001_500)).toMatchObject({
      elapsedMs: 6_500,
      remainingMs: 3_500,
      expired: false,
      running: true,
    })
  })
})
