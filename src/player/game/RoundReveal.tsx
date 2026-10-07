import { useEffect, useRef } from 'react'

import { announcePresentation } from '@/components/feedback/PresentationAnnouncer'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button, Card } from '@/components/ui'
import type { GameConfig } from '@/content/schema/game'
import type { RoundRevealViewModel } from '@/engines/games/results'
import { StepActionSlot } from '@/player/StepActionSlot'

type GameCopy = NonNullable<GameConfig['copy']>

export function RoundReveal({
  view,
  total,
  speedBonusLabel,
  copy,
  lastRound,
  onNext,
}: {
  view: RoundRevealViewModel
  total: number
  speedBonusLabel: string | null
  copy: GameCopy
  lastRound: boolean
  onNext: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const outcome = view.outcome === 'correct' ? copy.correct : copy.incorrect
  useEffect(() => {
    heading.current?.focus()
    announcePresentation(outcome)
  }, [outcome])
  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="border-white/10 bg-white p-6 text-neutral-950 sm:p-8">
        <h1 className="text-heading font-bold" ref={heading} tabIndex={-1}>
          {outcome}
        </h1>
        {view.outcome === 'incorrect' ? (
          <p className="mt-3 font-semibold">{view.answerLine}</p>
        ) : null}
        <p className="mt-2 text-neutral-700">{view.feedbackSentence}</p>
        <dl className="mt-6 grid gap-2 border-t pt-5">
          <div className="flex justify-between">
            <dt>{copy.basePoints}</dt>
            <dd>+{view.breakdown.basePoints}</dd>
          </div>
          {view.breakdown.speedBonus > 0 ? (
            <div className="flex justify-between">
              <dt>{speedBonusLabel}</dt>
              <dd>+{view.breakdown.speedBonus}</dd>
            </div>
          ) : null}
          {view.breakdown.clueCost > 0 ? (
            <div className="flex justify-between">
              <dt>{copy.clueCost}</dt>
              <dd>−{view.breakdown.clueCost}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-6 text-right text-2xl font-bold">
          {copy.totalScore}: <AnimatedNumber value={total} />
        </p>
      </Card>
      <StepActionSlot>
        <Button className="w-full sm:w-auto" onClick={onNext}>
          {lastRound ? copy.seeResult : copy.nextRound}
        </Button>
      </StepActionSlot>
    </div>
  )
}
