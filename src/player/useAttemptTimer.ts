import { useEffect, useRef, useState } from 'react'

interface AttemptTimerOptions {
  active: boolean
  paused?: boolean
  attemptKey: string
  durationSeconds: number | null
  mode: 'countdown' | 'elapsed'
  onExpire: () => void
}

interface AttemptTimerValue {
  seconds: number
  mode: 'countdown' | 'elapsed'
}

interface AttemptTimerTracker {
  attemptKey: string
  durationMs: number
  remainingMs: number
  activeSinceMs: number | null
  expired: boolean
}

function remainingAt(tracker: AttemptTimerTracker, nowMs: number) {
  if (tracker.activeSinceMs === null) return tracker.remainingMs
  return Math.max(0, tracker.remainingMs - Math.max(0, nowMs - tracker.activeSinceMs))
}

function pauseTracker(tracker: AttemptTimerTracker, nowMs: number) {
  tracker.remainingMs = remainingAt(tracker, nowMs)
  tracker.activeSinceMs = null
}

export function useAttemptTimer({
  active,
  paused = false,
  attemptKey,
  durationSeconds,
  mode,
  onExpire,
}: AttemptTimerOptions): AttemptTimerValue | null {
  const durationMs = (durationSeconds ?? 0) * 1000
  const onExpireRef = useRef(onExpire)
  const trackerRef = useRef<AttemptTimerTracker>({
    attemptKey,
    durationMs,
    remainingMs: durationMs,
    activeSinceMs: null,
    expired: false,
  })
  const [clock, setClock] = useState({ attemptKey, remainingMs: durationMs })

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    trackerRef.current = {
      attemptKey,
      durationMs,
      remainingMs: durationMs,
      activeSinceMs: null,
      expired: false,
    }
  }, [attemptKey, durationMs])

  useEffect(() => {
    if (!active || durationSeconds === null) return

    const tracker = trackerRef.current
    let interval: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (interval) clearInterval(interval)
      interval = null
    }

    const update = () => {
      tracker.remainingMs = remainingAt(tracker, Date.now())
      tracker.activeSinceMs = tracker.remainingMs > 0 ? Date.now() : null
      setClock({ attemptKey, remainingMs: tracker.remainingMs })
      if (tracker.remainingMs === 0 && !tracker.expired) {
        tracker.expired = true
        stop()
        onExpireRef.current()
      }
    }

    const start = () => {
      if (paused || tracker.expired || interval || document.hidden) return
      tracker.activeSinceMs = Date.now()
      interval = setInterval(update, 250)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseTracker(tracker, Date.now())
        setClock({ attemptKey, remainingMs: tracker.remainingMs })
        stop()
      } else {
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      pauseTracker(tracker, Date.now())
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [active, attemptKey, durationSeconds, paused])

  if (durationSeconds === null) return null

  const remainingMs = clock.attemptKey === attemptKey ? clock.remainingMs : durationMs
  return {
    mode,
    seconds:
      mode === 'countdown'
        ? Math.ceil(remainingMs / 1000)
        : Math.min(durationSeconds, Math.floor((durationMs - remainingMs) / 1000)),
  }
}
