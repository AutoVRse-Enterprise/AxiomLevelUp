import { useEffect } from 'react'

import { Chip } from '@/components/ui'
import type { PlannedRound } from '@/engines/games/plan'

export function RoundIntro({
  round,
  title,
  autoAdvanceMs,
  roundLabel,
  onContinue,
}: {
  round: PlannedRound
  title: string
  autoAdvanceMs: number
  roundLabel: string
  onContinue: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onContinue, autoAdvanceMs)
    return () => window.clearTimeout(timer)
  }, [autoAdvanceMs, onContinue])

  return (
    <button
      className="grid min-h-[60svh] w-full place-items-center text-left"
      onClick={onContinue}
      type="button"
    >
      <span className="max-w-2xl text-center">
        <Chip>{roundLabel}</Chip>
        <h1 className="mt-5 text-display font-bold text-white">{title}</h1>
        <span className="mt-4 block text-xl text-neutral-200">
          {round.timeLimitSeconds} seconds
        </span>
      </span>
    </button>
  )
}
