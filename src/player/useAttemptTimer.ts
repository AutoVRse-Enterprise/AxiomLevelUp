import { useEffect, useRef, useState } from 'react'

interface AttemptTimerOptions {
  active: boolean
  attemptKey: string
  durationSeconds: number | null
  mode: 'countdown' | 'elapsed'
  onExpire: () => void
}

interface AttemptTimerValue {
  seconds: number
  mode: 'countdown' | 'elapsed'
}

export function useAttemptTimer({
  active,
  attemptKey,
  durationSeconds,
  mode,
  onExpire,
}: AttemptTimerOptions): AttemptTimerValue | null {
  const durationMs = (durationSeconds ?? 0) * 1000
  const onExpireRef = useRef(onExpire)
  const [clock, setClock] = useState({ attemptKey, remainingMs: durationMs })

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!active || durationSeconds === null) return

    let remainingMs = durationSeconds * 1000
    let deadline = Date.now() + remainingMs
    let interval: ReturnType<typeof setInterval> | null = null
    let expired = false

    const stop = () => {
      if (interval) clearInterval(interval)
      interval = null
    }

    const update = () => {
      remainingMs = Math.max(0, deadline - Date.now())
      setClock({ attemptKey, remainingMs })
      if (remainingMs === 0 && !expired) {
        expired = true
        stop()
        onExpireRef.current()
      }
    }

    const start = () => {
      if (expired || interval || document.hidden) return
      deadline = Date.now() + remainingMs
      interval = setInterval(update, 250)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        remainingMs = Math.max(0, deadline - Date.now())
        setClock({ attemptKey, remainingMs })
        stop()
      } else {
        start()
      }
    }

    setClock({ attemptKey, remainingMs })
    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [active, attemptKey, durationSeconds])

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
