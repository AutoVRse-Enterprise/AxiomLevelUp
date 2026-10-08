import { m } from 'motion/react'
import { useEffect } from 'react'

import { Button, Chip } from '@/components/ui'
import { roundTransitionVariants } from '@/design/motion'
import type { PlannedRound } from '@/engines/games/plan'

export function RoundIntro({
  round,
  title,
  autoAdvanceMs,
  roundLabel,
  continueLabel,
  onContinue,
}: {
  round: PlannedRound
  title: string
  autoAdvanceMs: number
  roundLabel: string
  continueLabel: string
  onContinue: () => void
}) {
  useEffect(() => {
    if (autoAdvanceMs <= 0) return
    const timer = window.setTimeout(onContinue, autoAdvanceMs)
    return () => window.clearTimeout(timer)
  }, [autoAdvanceMs, onContinue])

  const content = (
    <m.span
      animate="visible"
      className="block max-w-2xl text-center"
      initial="hidden"
      variants={roundTransitionVariants}
    >
      <Chip>{roundLabel}</Chip>
      <h1 className="mt-5 text-display font-bold text-white">{title}</h1>
      <span className="mt-4 block text-xl text-neutral-200">{round.timeLimitSeconds} seconds</span>
    </m.span>
  )

  if (autoAdvanceMs <= 0) {
    return (
      <section className="grid min-h-[60svh] w-full place-items-center py-8">
        <div className="flex max-w-2xl flex-col items-center">
          {content}
          <p className="mt-5 text-center text-small text-neutral-300">
            Take your time here. The timer starts when you begin.
          </p>
          <Button className="mt-7 min-w-40" onClick={onContinue}>
            {continueLabel}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <button
      className="grid min-h-[60svh] w-full place-items-center text-left"
      onClick={onContinue}
      type="button"
    >
      {content}
    </button>
  )
}
