import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useActiveElapsed } from '@/player/useActiveElapsed'

describe('useActiveElapsed', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts only active time while the document is visible', async () => {
    vi.useFakeTimers()
    const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')
    let hidden = false
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })

    try {
      const { result } = renderHook(() =>
        useActiveElapsed({ active: true, resetKey: 'attempt-1', updateIntervalMs: 100 }),
      )

      await act(() => vi.advanceTimersByTimeAsync(1_000))
      expect(result.current.getElapsedMs()).toBe(1_000)

      hidden = true
      act(() => document.dispatchEvent(new Event('visibilitychange')))
      await act(() => vi.advanceTimersByTimeAsync(5_000))
      expect(result.current.getElapsedMs()).toBe(1_000)

      hidden = false
      act(() => document.dispatchEvent(new Event('visibilitychange')))
      await act(() => vi.advanceTimersByTimeAsync(500))
      expect(result.current.elapsedMs).toBe(1_500)
      expect(result.current.getElapsedMs()).toBe(1_500)
    } finally {
      if (hiddenDescriptor) {
        Object.defineProperty(document, 'hidden', hiddenDescriptor)
      } else {
        Reflect.deleteProperty(document, 'hidden')
      }
    }
  })

  it('resets for a new attempt and can resume from accumulated time', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ resetKey, initialElapsedMs }) =>
        useActiveElapsed({ active: true, resetKey, initialElapsedMs, updateIntervalMs: 100 }),
      { initialProps: { resetKey: 'attempt-1', initialElapsedMs: 750 } },
    )

    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(result.current.getElapsedMs()).toBe(1_000)

    rerender({ resetKey: 'attempt-2', initialElapsedMs: 0 })
    await act(() => vi.advanceTimersByTimeAsync(400))
    expect(result.current.getElapsedMs()).toBe(400)

    rerender({ resetKey: 'resumed-attempt', initialElapsedMs: 1_200 })
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(result.current.getElapsedMs()).toBe(1_500)
  })

  it('freezes and resumes the same elapsed attempt when active changes', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ active }) => useActiveElapsed({ active, resetKey: 'attempt-1', updateIntervalMs: 100 }),
      { initialProps: { active: true } },
    )

    await act(() => vi.advanceTimersByTimeAsync(800))
    rerender({ active: false })
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(result.current.getElapsedMs()).toBe(800)

    rerender({ active: true })
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(result.current.getElapsedMs()).toBe(1_500)
  })
})
