import { CheckCircle2, CircleX, SkipForward } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { announcePresentation } from '@/components/feedback/PresentationAnnouncer'
import { CreditsSheet } from '@/components/game/CreditsSheet'
import { ShareChallengeSheet } from '@/components/game/ShareChallengeSheet'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AnimatedNumber, Button, Card, Chip } from '@/components/ui'
import { Sheet } from '@/components/ui/Sheet'
import { resultItemVariants, resultSequenceVariants } from '@/design/motion'
import { collectRunCredits } from '@/engines/games/credits'
import { decodeChallenge } from '@/engines/games/links'
import { compareWithOpponent } from '@/engines/games/comparison'
import { createRunSeed } from '@/engines/games/seed'
import { roundStrip, selectResultMessage, summarizeRun } from '@/engines/games/results'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { useLearnerStore } from '@/state/learnerStore'

export function GameResultPage() {
  const { runId = '' } = useParams()
  const navigate = useNavigate()
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
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
  const game = registry.gameById.get(found.gameId)
  if (!game || !config.result) {
    return (
      <ErrorState message={config.copy.resultNotFound} title={config.copy.resultUnavailableTitle} />
    )
  }
  const gameCopy = config.copy
  const credits = collectRunCredits(
    found.record.roundResults.map(({ roundId }) => roundId),
    registry,
  )
  const strip = roundStrip(found.record.roundResults)
  const selected = selectedRound === null ? null : found.record.roundResults[selectedRound]
  const selectedDocument = selected ? registry.roundById.get(selected.roundId) : null
  const decoded = found.record.challengeToken ? decodeChallenge(found.record.challengeToken) : null
  const opponent =
    decoded?.ok === true ? { name: decoded.payload.f, score: decoded.payload.sc } : null
  const comparison = opponent ? compareWithOpponent(summary.total, opponent) : null
  const resultCopy = config.result
  const comparisonText =
    comparison?.outcome === 'win'
      ? resultCopy.winTemplate
          .replace('{name}', comparison.opponent.name)
          .replace('{margin}', comparison.margin.toLocaleString())
      : comparison?.outcome === 'loss'
        ? resultCopy.lossTemplate
            .replace('{name}', comparison.opponent.name)
            .replace('{margin}', comparison.margin.toLocaleString())
        : comparison
          ? resultCopy.tieTemplate.replace('{name}', comparison.opponent.name)
          : null
  const startNew = (seed: number, challengeToken?: string) => {
    useGameSessionStore.getState().clear()
    const query = challengeToken
      ? `challenge=${encodeURIComponent(challengeToken)}`
      : `difficulty=${encodeURIComponent(found.record.difficulty)}&seed=${seed}`
    navigate(`/play/${found.gameId}?${query}`)
  }

  return (
    <m.section
      animate="visible"
      className="mx-auto max-w-4xl space-y-6 py-6 sm:py-10"
      initial="hidden"
      variants={resultSequenceVariants}
    >
      <ResultAnnouncement label={resultCopy.pointsLabel} score={summary.total} title={game.title} />
      <m.div variants={resultItemVariants}>
        <Card className="overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-7 text-center text-white sm:p-10">
          {found.record.personalBest ? (
            <Chip className="bg-white/15 text-white">{resultCopy.personalBest}</Chip>
          ) : null}
          <p className="mt-3 text-small font-semibold uppercase tracking-wide text-brand-100">
            {resultCopy.pointsLabel}
          </p>
          <AnimatedNumber
            className="mt-1 block text-6xl font-black text-[var(--score-accent)] sm:text-7xl"
            value={summary.total}
          />
          {message ? <p className="mt-4 text-xl font-semibold">{message}</p> : null}
          {comparisonText ? (
            <p className="mx-auto mt-5 max-w-md rounded-lg bg-white/10 p-3 font-bold">
              {comparisonText}
            </p>
          ) : null}
        </Card>
      </m.div>

      <m.dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" variants={resultItemVariants}>
        {[
          resultCopy.correctTemplate
            .replace('{correct}', String(summary.correctCount))
            .replace('{total}', String(summary.roundCount)),
          resultCopy.timeTemplate.replace('{seconds}', String(summary.totalSeconds)),
          resultCopy.bestRoundTemplate.replace('{score}', String(summary.bestRound?.points ?? 0)),
          difficulty?.label ?? found.record.difficulty,
        ].map((value, index) => (
          <Card className="p-4 text-center font-bold" key={value}>
            <dt className="text-caption text-neutral-500">
              {
                [
                  gameCopy.correctCount,
                  gameCopy.totalTime,
                  gameCopy.bestRound,
                  gameCopy.difficulty,
                ][index]
              }
            </dt>
            <dd className="mt-1">{value}</dd>
          </Card>
        ))}
      </m.dl>

      <m.div variants={resultItemVariants}>
        <Card>
          <h2 className="text-heading font-bold">{resultCopy.roundDetailsTitle}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {strip.map((round) => {
              const Icon =
                round.outcome === 'correct'
                  ? CheckCircle2
                  : round.outcome === 'skipped'
                    ? SkipForward
                    : CircleX
              return (
                <button
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-neutral-200 p-3 text-left hover:border-brand-400"
                  key={round.key}
                  onClick={() => setSelectedRound(round.index)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="text-brand-700" size={20} />
                  <span className="min-w-0 flex-1 font-semibold">
                    {registry.roundById.get(round.roundId)?.title ??
                      `${gameCopy.roundLabel} ${round.index + 1}`}
                  </span>
                  <span className="font-bold tabular-nums">+{round.points}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </m.div>

      <div className="flex flex-wrap justify-center gap-3">
        <ShareChallengeSheet
          difficulty={found.record.difficulty}
          gameId={game.id}
          gameTitle={game.title}
          gameVersion={game.gameVersion}
          runId={found.record.runId}
          score={found.record.total}
          seed={found.record.seed}
          triggerLabel={
            found.record.mode === 'challenge' || found.record.mode === 'expert'
              ? resultCopy.challengeBack
              : resultCopy.challengeColleague
          }
        />
        {found.record.challengeToken ? (
          <Button
            onClick={() => startNew(found.record.seed, found.record.challengeToken)}
            variant="secondary"
          >
            {resultCopy.rematch}
          </Button>
        ) : null}
        <Button onClick={() => startNew(createRunSeed())} variant="secondary">
          {resultCopy.tryAgain}
        </Button>
        {!found.record.personalBest ? (
          <Button onClick={() => startNew(createRunSeed())} variant="secondary">
            {resultCopy.beatYourBest}
          </Button>
        ) : null}
        <Button onClick={() => navigate('/leaderboard')} variant="ghost">
          {resultCopy.leaderboard}
        </Button>
        <CreditsSheet copy={gameCopy} credits={credits} />
      </div>
      <Sheet
        description={
          selectedDocument
            ? selected?.correct
              ? selectedDocument.feedback.correct
              : selectedDocument.feedback.incorrect
            : ''
        }
        onOpenChange={(open) => {
          if (!open) setSelectedRound(null)
        }}
        open={selectedRound !== null}
        title={selectedDocument?.title ?? resultCopy.roundDetailsTitle}
      >
        <p className="text-neutral-700">
          {selected?.skipped
            ? gameCopy.skippedRoundMessage
            : selected?.correct
              ? selectedDocument?.feedback.correct
              : selectedDocument?.feedback.incorrect}
        </p>
        <p className="mt-4 font-bold">+{selected?.points ?? 0}</p>
      </Sheet>
    </m.section>
  )
}

function ResultAnnouncement({
  title,
  score,
  label,
}: {
  title: string
  score: number
  label: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
    announcePresentation(`${title} result. ${score.toLocaleString()} ${label}.`)
  }, [label, score, title])
  return (
    <h1 className="sr-only" ref={heading} tabIndex={-1}>
      {title} result
    </h1>
  )
}
