import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { AnatomyEntryContext } from '@/anatomy3d/viewer/entryContext'
import { useContent } from '@/app/contentContext'
import type { GameDocument } from '@/content/schema/game'
import { correctAnswerDimensions, correctAnswerLabel } from '@/engines/games/answers'
import type { GameRunContext } from '@/engines/games/runContext'
import { resolveSpeedBonusTier } from '@/engines/games/scoring'
import type { GameSession } from '@/engines/games/session'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { revealViewModel } from '@/engines/games/results'
import { emitEvent } from '@/events/bus'
import { versionedModelUrl } from '@/pwa/modelCache'
import { GameExitDialog } from '@/player/game/GameExitDialog'
import { GameResumePrompt } from '@/player/game/GameResumePrompt'
import { GameTopBar } from '@/player/game/GameTopBar'
import { FindingReveal } from '@/player/game/FindingReveal'
import { PinReveal } from '@/player/game/PinReveal'
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
  runContext,
}: {
  game: GameDocument
  difficultyId: string
  seed: number
  resumable: GameSession | null
  runContext: GameRunContext
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
      runContext={runContext}
      seed={choice?.seed ?? seed}
    />
  )
}

function GameRun({
  game,
  difficultyId,
  seed,
  resumedSession,
  runContext,
}: {
  game: GameDocument
  difficultyId: string
  seed: number
  resumedSession: GameSession | null
  runContext: GameRunContext
}) {
  const registry = useContent()
  const config = registry.appConfig.games!
  const copy = config.copy!
  const navigate = useNavigate()
  const [exitOpen, setExitOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pauseStartedAt = useRef<number | null>(null)
  const run = useGameRun({ game, registry, difficultyId, seed, resumedSession, runContext })
  const { session, plan, dispatch } = run
  const spatialModelUrls = useMemo(
    () => [
      ...new Set(
        plan.rounds.flatMap((planned) => {
          const plannedDocument = registry.roundById.get(planned.roundId)
          const map = plannedDocument?.anatomyMapId
            ? registry.anatomyMapById.get(plannedDocument.anatomyMapId)
            : undefined
          const asset = map ? registry.assetById.get(map.modelAssetId) : undefined
          return asset?.type === 'model' ? [versionedModelUrl(asset)] : []
        }),
      ),
    ],
    [plan.rounds, registry.anatomyMapById, registry.assetById, registry.roundById],
  )
  const plannedRound = plan.rounds[session.roundIndex]
  const round = plannedRound ? registry.roundById.get(plannedRound.roundId) : undefined
  const answerAnatomyMap = round?.anatomyMapId
    ? registry.anatomyMapById.get(round.anatomyMapId)
    : undefined
  const roundSession = session.rounds[session.roundIndex]
  const lockedResumePending = useRef(resumedSession?.phase === 'locked')

  useEffect(() => {
    if (session.phase === 'ready') run.start()
  }, [run, session.phase])

  useEffect(() => {
    if (session.phase === 'complete' && session.runId) {
      navigate(`/results/${session.runId}`, { replace: true })
    }
  }, [navigate, session.phase, session.runId])

  useEffect(() => {
    if (spatialModelUrls.length === 0) return
    let cancelled = false
    const releases: Array<() => void> = []
    void import('@/anatomy3d/three/createAnatomyController').then(
      async ({ prefetchAnatomyModel }) => {
        for (const url of spatialModelUrls) {
          const release = await prefetchAnatomyModel(url)
          if (cancelled) release()
          else releases.push(release)
        }
      },
    )
    return () => {
      cancelled = true
      releases.forEach((release) => release())
    }
  }, [spatialModelUrls])

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
    if (!lockedResumePending.current || session.phase !== 'locked' || !roundSession) return
    lockedResumePending.current = false
    const elapsed = roundSession.elapsedMs ?? roundSession.elapsedCheckpointMs ?? 0
    if (roundSession.skipped) run.skip(elapsed)
    else if (roundSession.timedOut) run.timeout(roundSession.response, elapsed)
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
      zoomIn: copy.zoomIn,
      zoomOut: copy.zoomOut,
      resetImageView: copy.resetImageView,
      imageZoomControls: copy.imageZoomControls,
      imageViewerHint: copy.imageViewerHint,
      zoomLevel: (percent) => copy.zoomLevel.replace('{percent}', String(percent)),
      compareReference: copy.compareReference,
      returnToFinding: copy.returnToFinding,
      movesLeft: (count) => copy.movesLeft.replace('{count}', String(count)),
      anatomyInteractionHint: copy.spatialHint,
    }),
    [copy],
  )
  const total = run.results.reduce((sum, result) => sum + result.points, 0)

  if (!plannedRound || !round || !roundSession) return null

  const currentResult = roundSession.result
  const reveal = currentResult
    ? revealViewModel(
        currentResult,
        round.feedback,
        correctAnswerLabel(plannedRound, answerAnatomyMap),
      )
    : null
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
  return (
    <PresentationProvider labels={labels} variant="game">
      <AnatomyEntryContext.Provider
        value={{
          ...(plannedRound.dropWaypointId ? { entryWaypointId: plannedRound.dropWaypointId } : {}),
          neutralNavigationLabels: Boolean(plannedRound.dropWaypointId),
          hideLocationLabels: Boolean(plannedRound.dropWaypointId),
        }}
      >
        <StepActionScope placement="game">
          <GameTopBar
            exitLabel={copy.exitGame}
            onExit={() => setExitOpen(true)}
            pointsLabel={copy.pointsAbbreviation}
            roundCount={plan.rounds.length}
            roundIndex={session.roundIndex}
            roundProgressLabel={copy.roundProgress}
            score={total}
            scoreToBeat={runContext.opponent?.score}
            scoreToBeatLabel={config.hub.scoreToBeat}
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
                continueLabel={copy.continue}
                onContinue={run.startRound}
                round={plannedRound}
                roundLabel={copy.roundLabel}
                title={round.intro}
              />
            ) : null}
            {session.phase === 'playing' || session.phase === 'locked' ? (
              <RoundStage
                allowSkip={config.failurePolicy.allowSkip}
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
                onExploreDraftChange={(draft) => dispatch({ type: 'exploreDraftChanged', draft })}
                onInteract={run.interact}
                onFailureChange={(failed) => {
                  if (!config.failurePolicy.pauseClockOnFailure) return
                  if (failed) {
                    checkpoint(clock.getElapsedMs())
                    pauseStartedAt.current = Date.now()
                  } else if (pauseStartedAt.current !== null) {
                    dispatch({ type: 'paused', elapsedMs: Date.now() - pauseStartedAt.current })
                    pauseStartedAt.current = null
                  }
                  setConfirmOpen(failed)
                }}
                onSkip={() => {
                  setConfirmOpen(false)
                  run.skip(clock.getElapsedMs())
                }}
                onSubmit={(response) => run.submit(response, clock.getElapsedMs())}
                onRoundStepChange={(step) => dispatch({ type: 'roundStepChanged', step })}
                plannedRound={plannedRound}
                round={round}
                roundSession={roundSession}
              />
            ) : null}
            {session.phase === 'reveal' && reveal ? (
              <RoundReveal
                answerDimensions={correctAnswerDimensions(plannedRound, answerAnatomyMap)}
                copy={copy}
                lastRound={session.roundIndex === plan.rounds.length - 1}
                onNext={run.next}
                speedBonusLabel={speedTier?.label ?? null}
                total={total}
                view={reveal}
              >
                {round.mechanic === 'spatial_explore' &&
                round.anatomyMapId &&
                !roundSession.result?.skipped ? (
                  <PinReveal
                    config={registry.appConfig.product.anatomy3d}
                    copy={copy}
                    map={registry.anatomyMapById.get(round.anatomyMapId)!}
                    plannedRound={plannedRound}
                    response={roundSession.response}
                  />
                ) : null}
                {round.mechanic === 'spot_finding' && !roundSession.result?.skipped ? (
                  <FindingReveal
                    copy={copy}
                    correct={roundSession.result?.correct ?? false}
                    plannedRound={plannedRound}
                    response={roundSession.response}
                  />
                ) : null}
              </RoundReveal>
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
      </AnatomyEntryContext.Provider>
    </PresentationProvider>
  )
}
