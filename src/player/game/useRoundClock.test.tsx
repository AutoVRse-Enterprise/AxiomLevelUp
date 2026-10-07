import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useRoundClock } from '@/player/game/useRoundClock'

afterEach(() => vi.useRealTimers())

describe('useRoundClock', () => {
  it('expires exactly once at the configured limit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const onExpire = vi.fn()
    const { result } = renderHook(() =>
      useRoundClock({
        active: true,
        resetKey: 'round-1',
        initialElapsedMs: 0,
        limitSeconds: 2,
        announcementThresholds: [1],
        secondsRemainingLabel: '{seconds} seconds remaining',
        timeUpLabel: 'Time is up',
        onCheckpoint: vi.fn(),
        onExpire,
      }),
    )
    act(() => {
      vi.advanceTimersByTime(2_500)
    })
    expect(result.current.remainingSeconds).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
