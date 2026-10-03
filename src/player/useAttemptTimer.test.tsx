import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAttemptTimer } from '@/player/useAttemptTimer'

describe('useAttemptTimer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('freezes a paused countdown and resumes the same attempt', async () => {
    vi.useFakeTimers()
    const onExpire = vi.fn()
    const { result, rerender } = renderHook(
      ({ paused }) =>
        useAttemptTimer({
          active: true,
          paused,
          attemptKey: 'attempt-1',
          durationSeconds: 3,
          mode: 'countdown',
          onExpire,
        }),
      { initialProps: { paused: false } },
    )

    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(result.current?.seconds).toBe(2)

    rerender({ paused: true })
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(result.current?.seconds).toBe(2)
    expect(onExpire).not.toHaveBeenCalled()

    rerender({ paused: false })
    await act(() => vi.advanceTimersByTimeAsync(2_000))
    expect(result.current?.seconds).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
