import { CreditsSheet } from '@/components/game/CreditsSheet'
import { Button } from '@/components/ui'
import { GameSummaryCard } from '@/components/game/GameSummaryCard'
import type { GameConfig } from '@/content/schema/game'
import type { CreditedAsset } from '@/engines/games/credits'
import type { GameRunSummary } from '@/engines/games/results'

export function GameFinal({
  summary,
  message,
  bestRoundTitle,
  difficultyLabel,
  copy,
  credits,
  onPlayAgain,
}: {
  summary: GameRunSummary
  message: string | null
  bestRoundTitle: string
  difficultyLabel: string
  copy: NonNullable<GameConfig['copy']>
  credits: readonly CreditedAsset[]
  onPlayAgain: () => void
}) {
  return (
    <div className="py-8">
      <GameSummaryCard
        bestRoundTitle={bestRoundTitle}
        copy={copy}
        difficultyLabel={difficultyLabel}
        message={message}
        summary={summary}
      />
      <div className="mt-6 text-center">
        <Button onClick={onPlayAgain} size="lg">
          {copy.playAgain}
        </Button>
        <div className="mt-3">
          <CreditsSheet copy={copy} credits={credits} />
        </div>
      </div>
    </div>
  )
}
