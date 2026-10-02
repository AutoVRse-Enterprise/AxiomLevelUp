import { useCallback, useEffect, useRef, useState } from 'react'

interface ActiveElapsedOptions {
  active: boolean
  resetKey: string
  initialElapsedMs?: number
  updateIntervalMs?: number
}

export interface ActiveElapsedValue {
  elapsedMs: number
  getElapsedMs: () => number
}

interface ElapsedTracker {
  resetKey: string
  accumulatedMs: number
  activeSinceMs: number | null
}

function normalizedMilliseconds(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function readElapsed(tracker: ElapsedTracker, nowMs: number) {
  const activeMs = tracker.activeSinceMs === null ? 0 : Math.max(0, nowMs - tracker.activeSinceMs)
  return normalizedMilliseconds(tracker.accumulatedMs + activeMs)
}

function pauseTracker(tracker: ElapsedTracker, nowMs: number) {
  if (tracker.activeSinceMs === null) return
  tracker.accumulatedMs = readElapsed(tracker, nowMs)
  tracker.activeSinceMs = null
}

export function useActiveElapsed({
  active,
  resetKey,
  initialElapsedMs = 0,
  updateIntervalMs = 250,
}: ActiveElapsedOptions): ActiveElapsedValue {
  const initialMs = normalizedMilliseconds(initialElapsedMs)
  const trackerRef = useRef<ElapsedTracker>({
    resetKey,
    accumulatedMs: initialMs,
    activeSinceMs: null,
  })
  const [display, setDisplay] = useState({ resetKey, elapsedMs: initialMs })

  const getElapsedMs = useCallback(() => readElapsed(trackerRef.current, Date.now()), [])

  useEffect(() => {
    trackerRef.current = {
      resetKey,
      accumulatedMs: initialMs,
      activeSinceMs: null,
    }
  }, [initialMs, resetKey])

  useEffect(() => {
    const tracker = trackerRef.current
    let interval: ReturnType<typeof setInterval> | null = null

    const updateDisplay = () => {
      setDisplay({ resetKey, elapsedMs: readElapsed(tracker, Date.now()) })
    }
    const stopInterval = () => {
      if (interval !== null) clearInterval(interval)
      interval = null
    }
    const pause = () => {
      pauseTracker(tracker, Date.now())
      stopInterval()
      updateDisplay()
    }
    const start = () => {
      if (!active || document.hidden || tracker.activeSinceMs !== null) return
      tracker.activeSinceMs = Date.now()
      interval = setInterval(updateDisplay, Math.max(1, updateIntervalMs))
    }
    const handleVisibilityChange = () => {
      if (document.hidden) pause()
      else start()
    }

    updateDisplay()
    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      pauseTracker(tracker, Date.now())
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [active, initialMs, resetKey, updateIntervalMs])

  return {
    elapsedMs: display.resetKey === resetKey ? display.elapsedMs : initialMs,
    getElapsedMs,
  }
}
