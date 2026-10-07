import { LogOut } from 'lucide-react'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui'
import { CountdownRing } from '@/player/game/CountdownRing'

export function GameTopBar({
  roundIndex,
  roundCount,
  score,
  seconds,
  totalSeconds,
  exitLabel,
  roundProgressLabel,
  pointsLabel,
  timerLabel,
  onExit,
}: {
  roundIndex: number
  roundCount: number
  score: number
  seconds: number
  totalSeconds: number
  exitLabel: string
  roundProgressLabel: string
  pointsLabel: string
  timerLabel: string
  onExit: () => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/90 px-3 pt-[env(safe-area-inset-top)] text-white backdrop-blur sm:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3">
        <Button aria-label={exitLabel} onClick={onExit} size="sm" variant="ghost">
          <LogOut aria-hidden="true" className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-300">
            {roundProgressLabel
              .replace('{current}', String(Math.min(roundIndex + 1, roundCount)))
              .replace('{total}', String(roundCount))}
          </p>
          <div aria-hidden="true" className="mt-1 flex gap-1">
            {Array.from({ length: roundCount }, (_, index) => (
              <span
                className={`h-1.5 flex-1 rounded-full ${index <= roundIndex ? 'bg-brand-400' : 'bg-white/20'}`}
                key={index}
              />
            ))}
          </div>
        </div>
        <div aria-label={`${score} points`} className="min-w-20 text-right font-bold tabular-nums">
          <AnimatedNumber value={score} /> {pointsLabel}
        </div>
        <CountdownRing label={timerLabel} seconds={seconds} totalSeconds={totalSeconds} />
      </div>
    </header>
  )
}
