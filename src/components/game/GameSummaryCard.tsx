import { Card } from '@/components/ui'
import type { GameConfig } from '@/content/schema/game'
import type { GameRunSummary } from '@/engines/games/results'

type GameCopy = NonNullable<GameConfig['copy']>

export function GameSummaryCard({
  summary,
  message,
  bestRoundTitle,
  difficultyLabel,
  copy,
}: {
  summary: GameRunSummary
  message: string | null
  bestRoundTitle: string
  difficultyLabel: string
  copy: GameCopy
}) {
  return (
    <Card className="mx-auto max-w-2xl p-7 text-center sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        {copy.totalScore}
      </p>
      <p className="mt-2 text-6xl font-black tabular-nums">{summary.total}</p>
      {message ? <p className="mt-4 text-xl font-semibold">{message}</p> : null}
      <dl className="mt-8 grid grid-cols-2 gap-4 text-left">
        <div>
          <dt className="text-sm text-neutral-600">{copy.correctCount}</dt>
          <dd className="font-bold">
            {summary.correctCount} of {summary.roundCount}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-600">{copy.totalTime}</dt>
          <dd className="font-bold">{summary.totalSeconds}s</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-600">{copy.bestRound}</dt>
          <dd className="font-bold">{bestRoundTitle}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-600">{copy.difficulty}</dt>
          <dd className="font-bold">{difficultyLabel}</dd>
        </div>
      </dl>
    </Card>
  )
}
