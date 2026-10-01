import { Clock3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface TimerBadgeProps {
  seconds: number
  mode: 'countdown' | 'elapsed'
  announcementThresholds: number[]
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function TimerBadge({ seconds, mode, announcementThresholds }: TimerBadgeProps) {
  const [announcement, setAnnouncement] = useState('')
  const announced = useRef(new Set<number>())

  useEffect(() => {
    if (!announcementThresholds.includes(seconds) || announced.current.has(seconds)) return
    announced.current.add(seconds)
    setAnnouncement(
      mode === 'countdown' ? `${seconds} seconds remaining` : `${seconds} seconds elapsed`,
    )
  }, [announcementThresholds, mode, seconds])

  const label = mode === 'countdown' ? 'Time remaining' : 'Time elapsed'

  return (
    <>
      <div
        role="timer"
        aria-label={`${label}: ${formatTime(seconds)}`}
        aria-live="off"
        className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 font-mono text-small font-bold text-neutral-900 tabular-nums"
      >
        <Clock3 aria-hidden="true" className="size-4" />
        <span aria-hidden="true">{formatTime(seconds)}</span>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  )
}
