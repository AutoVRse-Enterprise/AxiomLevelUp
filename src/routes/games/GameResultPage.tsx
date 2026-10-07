import { useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { CreditsSheet } from '@/components/game/CreditsSheet'
import { GameSummaryCard } from '@/components/game/GameSummaryCard'
import { ErrorState } from '@/components/feedback/ErrorState'
import { collectRunCredits } from '@/engines/games/credits'
import { selectResultMessage, summarizeRun } from '@/engines/games/results'
import { useLearnerStore } from '@/state/learnerStore'

export function GameResultPage() {
  const { runId = '' } = useParams()
  const registry = useContent()
  const games = useLearnerStore((state) => state.games)
  const found = Object.entries(games)
    .flatMap(([gameId, progress]) => progress.history.map((record) => ({ gameId, record })))
    .find(({ record }) => record.runId === runId)
  const config = registry.appConfig.games
  if (!found || !config?.copy) {
    return (
      <ErrorState
        message={config?.copy?.resultNotFound ?? 'Result not found'}
        title={config?.copy?.resultUnavailableTitle ?? 'Result unavailable'}
      />
    )
  }
  const summary = summarizeRun(found.record.roundResults, found.record.difficulty)
  const message = selectResultMessage(
    config.messages,
    summary,
    found.record.roundResults.at(-1)?.correct ?? null,
  )
  const difficulty = config.difficulties.find(({ id }) => id === found.record.difficulty)
  const bestRoundTitle = summary.bestRound
    ? (registry.roundById.get(summary.bestRound.roundId)?.title ?? '')
    : ''
  const credits = collectRunCredits(
    found.record.roundResults.map(({ roundId }) => roundId),
    registry,
  )
  return (
    <section className="mx-auto max-w-4xl py-10">
      <GameSummaryCard
        bestRoundTitle={bestRoundTitle}
        copy={config.copy}
        difficultyLabel={difficulty?.label ?? found.record.difficulty}
        message={message}
        summary={summary}
      />
      <div className="mt-5 flex justify-center">
        <CreditsSheet copy={config.copy} credits={credits} />
      </div>
    </section>
  )
}
