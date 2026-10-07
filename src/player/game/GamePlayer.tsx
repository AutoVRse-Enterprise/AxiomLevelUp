import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { useContent } from '@/app/contentContext'
import type { GameDocument } from '@/content/schema/game'
import { correctAnswerLabel } from '@/engines/games/answers'
import { createRunSeed } from '@/engines/games/seed'
import { resolveSpeedBonusTier } from '@/engines/games/scoring'
import type { GameSession } from '@/engines/games/session'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { revealViewModel, selectResultMessage, summarizeRun } from '@/engines/games/results'
import { emitEvent } from '@/events/bus'
import { GameExitDialog } from '@/player/game/GameExitDialog'
import { GameFinal } from '@/player/game/GameFinal'
import { GameResumePrompt } from '@/player/game/GameResumePrompt'
import { GameTopBar } from '@/player/game/GameTopBar'
import { RoundIntro } from '@/player/game/RoundIntro'
import { RoundReveal } from '@/player/game/RoundReveal'
import { RoundStage } from '@/player/game/RoundStage'
import { useGameRun } from '@/player/game/useGameRun'
import { useRoundClock } from '@/player/game/useRoundClock'
import { StepActionScope } from '@/player/StepActionSlot'
import {
  PresentationProvider,
  type PresentationLabels,
} from '@/primitives/presentation/PresentationContext'

export function GamePlayer({
  game,
  difficultyId,
  seed,
  resumable,
}: {
  game: GameDocument
  difficultyId: string
  seed: number
  resumable: GameSession | null
}) {
  const [choice, setChoice] = useState<GameSession | null | undefined>(resumable ? undefined : null)
  const clear = useGameSessionStore((state) => state.clear)
  const copy = useContent().appConfig.games!.copy!
  if (choice === undefined) {
    return (
      <GameResumePrompt
        copy={copy}
        onContinue={() => setChoice(resumable)}
        onNew={() => {
          if (resumable?.runId) {
            emitEvent({
              event: 'game_abandoned',
              runId: resumable.runId,
              slotIndex: resumable.roundIndex,
            })
          }
          clear()
          setChoice(null)
        }}
      />
    )
  }
  return (
    <GameRun
      difficultyId={choice?.difficulty ?? difficultyId}
      game={game}
      resumedSession={choice}
      seed={choice?.seed ?? seed}
    />
  )
}

function GameRun({
  game,
  difficultyId,
  seed,
  resumedSession,
}: {
  game: GameDocument
  difficultyId: string
  seed: number
  resumedSession: GameSession | null
}) {
  const registry = useContent()
  const config = registry.appConfig.games!
  const copy = config.copy!
  const navigate = useNavigate()
  const [exitOpen, setExitOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pauseStartedAt = useRef<number | null>(null)
  const run = useGameRun({ game, registry, difficultyId, seed, resumedSession })
  const { session, plan, dispatch } = run
  const plannedRound = plan.rounds[session.roundIndex]
  const round = plannedRound ? registry.roundById.get(plannedRound.roundId) : undefined
  const roundSession = session.rounds[session.roundIndex]
  const resumedLocked = useRef(false)

  useEffect(() => {
    if (session.phase === 'ready') run.start()
  }, [run, session.phase])

  const checkpoint = useCallback(
    (elapsedMs: number) => dispatch({ type: 'checkpoint', elapsedMs }),
    [dispatch],
  )
  const recordPause = useCallback(
    (elapsedMs: number) => dispatch({ type: 'paused', elapsedMs }),
    [dispatch],
  )
  const clock = useRoundClock({
    active: session.phase === 'playing' && !confirmOpen,
    resetKey: `${session.runId}:${session.roundIndex}`,
    initialElapsedMs: roundSession?.elapsedCheckpointMs ?? 0,
    limitSeconds: plannedRound?.timeLimitSeconds ?? 1,
    announcementThresholds: registry.appConfig.product.player.timerAnnouncements,
    secondsRemainingLabel: copy.secondsRemaining,
    timeUpLabel: copy.timeUp,
    onCheckpoint: checkpoint,
    onPaused: recordPause,
    onExpire: (elapsedMs) => run.timeout(roundSession?.draft, elapsedMs),
  })

  useEffect(() => {
    if (session.phase !== 'locked' || resumedLocked.current || !roundSession) return
    resumedLocked.current = true
    const elapsed = roundSession.elapsedMs ?? roundSession.elapsedCheckpointMs ?? 0
    if (roundSession.timedOut) run.timeout(roundSession.response, elapsed)
    else run.submit(roundSession.response, elapsed)
  }, [roundSession, run, session.phase])

  const labels = useMemo<Partial<PresentationLabels>>(
    () => ({
      loadingActivity: copy.loadingRound,
      retryActivity: copy.retryRound,
      activityLoadError: copy.roundLoadError,
      activityLoadErrorMessage: copy.roundLoadErrorMessage,
      continue: copy.continue,
      checkAnswer: copy.lockIn,
      levelProgress: (current, total) =>
        copy.stepProgress.replace('{current}', String(current)).replace('{total}', String(total)),
      commitLocalisation: copy.lockIn,
      nextLevel: copy.nextStep,
      previousLevel: copy.previousStep,
      checkLocation: copy.checkLocation,
      loadingAudio: copy.loadingAudio,
      retryAudio: copy.retryAudio,
      audioUnavailable: copy.audioUnavailable,
      transcript: copy.transcript,
      loadingImage: copy.loadingImage,
      retryImage: copy.retryImage,
      imageUnavailable: copy.imageUnavailable,
      expandImage: copy.expandImage,
      hideAnnotations: copy.hideAnnotations,
      showAnnotations: copy.showAnnotations,
      expandTable: copy.expandTable,
      expandedDataTable: copy.expandedDataTable,
      showDataTable: copy.showDataTable,
      hideDataTable: copy.hideDataTable,
      keyTakeaway: copy.keyTakeaway,
    }),
    [copy],
  )
  const total = run.results.reduce((sum, result) => sum + result.points, 0)

  if (!plannedRound || !round || !roundSession) return null

  const currentResult = roundSession.result
  const reveal = currentResult
    ? revealViewModel(currentResult, round.feedback, correctAnswerLabel(plannedRound))
    : null
  const difficulty = config.difficulties.find(({ id }) => id === session.difficulty)!
  const speedTier =
    currentResult && config.scoring
      ? resolveSpeedBonusTier(
          {
            accuracy: currentResult.accuracy,
            elapsedMs: roundSession.elapsedMs ?? 0,
            timeLimitSeconds: plannedRound.timeLimitSeconds,
            timedOut: roundSession.timedOut,
            enabled: plannedRound.speedBonus,
          },
          config.scoring,
        )
      : null
  const summary = summarizeRun(run.results, session.difficulty)
  const message = selectResultMessage(config.messages, summary, run.results.at(-1)?.correct ?? null)
  const bestRoundTitle = summary.bestRound
    ? (registry.roundById.get(summary.bestRound.roundId)?.title ?? '')
    : ''

  return (
    <PresentationProvider labels={labels} variant="game">
      <StepActionScope placement="game">
        <GameTopBar
          exitLabel={copy.exitGame}
          onExit={() => setExitOpen(true)}
          pointsLabel={copy.pointsAbbreviation}
          roundCount={plan.rounds.length}
          roundIndex={session.roundIndex}
          roundProgressLabel={copy.roundProgress}
          score={total}
          seconds={
            session.phase === 'playing' ? clock.remainingSeconds : plannedRound.timeLimitSeconds
          }
          totalSeconds={plannedRound.timeLimitSeconds}
          timerLabel={copy.secondsRemaining}
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {session.phase === 'intro' ? (
            <RoundIntro
              autoAdvanceMs={config.player.introAutoAdvanceMs}
              onContinue={run.startRound}
              round={plannedRound}
              roundLabel={copy.roundLabel}
              title={round.intro}
            />
          ) : null}
          {session.phase === 'playing' || session.phase === 'locked' ? (
            <RoundStage
              copy={copy}
              disabled={session.phase === 'locked'}
              onClueReveal={run.revealClue}
              onConfirmOpenChange={(open) => {
                if (open) {
                  checkpoint(clock.getElapsedMs())
                  pauseStartedAt.current = Date.now()
                } else if (pauseStartedAt.current !== null) {
                  dispatch({ type: 'paused', elapsedMs: Date.now() - pauseStartedAt.current })
                  pauseStartedAt.current = null
                }
                setConfirmOpen(open)
              }}
              onDraftChange={(draft) => dispatch({ type: 'draftChanged', draft })}
              onInteract={run.interact}
              onSubmit={(response) => run.submit(response, clock.getElapsedMs())}
              plannedRound={plannedRound}
              round={round}
              roundSession={roundSession}
            />
          ) : null}
          {session.phase === 'reveal' && reveal ? (
            <RoundReveal
              copy={copy}
              lastRound={session.roundIndex === plan.rounds.length - 1}
              onNext={run.next}
              speedBonusLabel={speedTier?.label ?? null}
              total={total}
              view={reveal}
            />
          ) : null}
          {session.phase === 'final' || session.phase === 'complete' ? (
            <GameFinal
              bestRoundTitle={bestRoundTitle}
              copy={copy}
              difficultyLabel={difficulty.label}
              message={message}
              onPlayAgain={() => {
                useGameSessionStore.getState().clear()
                navigate(`?difficulty=${difficulty.id}&seed=${createRunSeed()}`, { replace: true })
                window.location.reload()
              }}
              summary={summary}
            />
          ) : null}
        </div>
        <GameExitDialog
          copy={copy}
          onExit={() => {
            checkpoint(clock.getElapsedMs())
            navigate('/')
          }}
          onOpenChange={setExitOpen}
          open={exitOpen}
        />
      </StepActionScope>
    </PresentationProvider>
  )
}
