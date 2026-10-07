import { useEffect, useRef } from 'react'

import { announcePresentation } from '@/components/feedback/PresentationAnnouncer'
import { useActiveElapsed } from '@/player/useActiveElapsed'

export function useRoundClock({
  active,
  resetKey,
  initialElapsedMs,
  limitSeconds,
  announcementThresholds,
  secondsRemainingLabel,
  timeUpLabel,
  onCheckpoint,
  onPaused,
  onExpire,
}: {
  active: boolean
  resetKey: string
  initialElapsedMs: number
  limitSeconds: number
  announcementThresholds: number[]
  secondsRemainingLabel: string
  timeUpLabel: string
  onCheckpoint: (elapsedMs: number) => void
  onPaused?: (pausedMs: number) => void
  onExpire: (elapsedMs: number) => void
}) {
  const { elapsedMs, getElapsedMs } = useActiveElapsed({
    active,
    resetKey,
    initialElapsedMs,
  })
  const expired = useRef(false)
  const announced = useRef(new Set<number>())

  useEffect(() => {
    expired.current = false
    announced.current.clear()
  }, [resetKey])

  const remainingSeconds = Math.max(0, Math.ceil((limitSeconds * 1_000 - elapsedMs) / 1_000))

  useEffect(() => {
    if (!active || expired.current || elapsedMs < limitSeconds * 1_000) return
    expired.current = true
    announcePresentation(timeUpLabel)
    onExpire(Math.min(elapsedMs, limitSeconds * 1_000))
  }, [active, elapsedMs, limitSeconds, onExpire, timeUpLabel])

  useEffect(() => {
    if (
      !active ||
      !announcementThresholds.includes(remainingSeconds) ||
      announced.current.has(remainingSeconds)
    ) {
      return
    }
    announced.current.add(remainingSeconds)
    announcePresentation(secondsRemainingLabel.replace('{seconds}', String(remainingSeconds)))
  }, [active, announcementThresholds, remainingSeconds, secondsRemainingLabel])

  useEffect(() => {
    let hiddenAt: number | null = null
    const checkpoint = () => onCheckpoint(getElapsedMs())
    const visibility = () => {
      if (document.hidden) {
        checkpoint()
        hiddenAt = Date.now()
      } else if (hiddenAt !== null) {
        onPaused?.(Math.max(0, Date.now() - hiddenAt))
        hiddenAt = null
      }
    }
    window.addEventListener('pagehide', checkpoint)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('pagehide', checkpoint)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [getElapsedMs, onCheckpoint, onPaused])

  return { elapsedMs, remainingSeconds, getElapsedMs }
}
