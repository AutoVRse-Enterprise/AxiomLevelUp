import { Clock3 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button, Chip } from '@/components/ui'
import type { AnatomyMap, AppConfig, CaseDocument } from '@/content/schema'
import {
  createCaseClock,
  pauseCaseClock,
  persistCaseClock,
  resumeCaseClock,
  selectCaseClock,
  updateCaseClock,
  type CaseClockMode,
  type CaseClockState,
} from '@/engines/cases/clock'
import { openClue } from '@/engines/cases/clues'
import {
  buildCasePlan,
  stageForStep,
  type CasePlan,
  type CaseStageBoundary,
} from '@/engines/cases/plan'
import { calculateCaseScore } from '@/engines/cases/scoring'
import type { ActivitySession, CaseProgress } from '@/engines/learning/session'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import {
  ActivityPlayer,
  type ActivityPlayerCompletionContext,
  type ActivityPlayerTimedAttempt,
} from '@/player/ActivityPlayer'
import { CaseCompare } from '@/player/case/CaseCompare'
import { CaseResults } from '@/player/case/CaseResults'
import { ClueBoard } from '@/player/case/ClueBoard'
import { StageHeader } from '@/player/case/StageHeader'
import type { CaseAttemptHistoryItem, CaseAttemptResult, CaseStepResult } from '@/player/case/types'

const EMPTY_CASE_PROGRESS: CaseProgress = {
  openedClueIds: [],
  stepElapsedMs: {},
  caseElapsedMs: 0,
  caseClockExpired: false,
}

export interface CaseClueOpened {
  caseId: string
  clueId: string
  essential: boolean
  stageId: string
}

export interface CasePlayerProps {
  caseDoc: CaseDocument
  config: AppConfig
  anatomyMap?: AnatomyMap
  previousAttempts: number
  previousBestScore: number | null
  continuePath: string
  exitPath: string
  attemptHistory?: readonly CaseAttemptHistoryItem[]
  onClueOpened?: (opened: CaseClueOpened) => void
  onComplete?: (result: CaseAttemptResult) => void
}

function formatClock(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function CaseClock({
  mode,
  maximumMs,
  progress,
  onProgress,
}: {
  mode: CaseClockMode
  maximumMs: number | null
  progress: CaseProgress
  onProgress: (patch: Partial<CaseProgress>) => void
}) {
  const initialClock = createCaseClock({
    mode,
    maxDurationMs: maximumMs,
    accumulatedActiveMs: progress.caseElapsedMs,
    expired: progress.caseClockExpired,
  })
  const clockRef = useRef<CaseClockState>(initialClock)
  const [snapshot, setSnapshot] = useState(() => selectCaseClock(initialClock, Date.now()))
  const persistedSecond = useRef(Math.floor(progress.caseElapsedMs / 1_000))
  const onProgressRef = useRef(onProgress)

  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])

  useEffect(() => {
    if (mode === 'none') return
    const sync = (now: number, pause = false) => {
      clockRef.current = pause
        ? pauseCaseClock(clockRef.current, now)
        : updateCaseClock(clockRef.current, now)
      const next = selectCaseClock(clockRef.current, now)
      setSnapshot(next)
      const second = Math.floor(next.elapsedMs / 1_000)
      if (pause || second !== persistedSecond.current || next.expired) {
        persistedSecond.current = second
        const persisted = persistCaseClock(clockRef.current, now)
        onProgressRef.current({
          caseElapsedMs: persisted.accumulatedActiveMs,
          caseClockExpired: persisted.expired,
        })
      }
    }
    const resume = () => {
      clockRef.current = resumeCaseClock(clockRef.current, Date.now())
      setSnapshot(selectCaseClock(clockRef.current, Date.now()))
    }
    const onVisibility = () => {
      if (document.hidden) sync(Date.now(), true)
      else resume()
    }

    resume()
    document.addEventListener('visibilitychange', onVisibility)
    const interval = window.setInterval(() => sync(Date.now()), 250)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      sync(Date.now(), true)
    }
  }, [mode])

  if (mode === 'none') return null
  const visibleMs = mode === 'countdown' ? (snapshot.remainingMs ?? 0) : snapshot.elapsedMs
  const label = mode === 'countdown' ? 'Case time remaining' : 'Case elapsed time'
  return (
    <Chip tone={snapshot.expired ? 'warning' : 'neutral'}>
      <Clock3 aria-hidden="true" size={15} />
      <span role="timer" aria-label={`${label}: ${formatClock(visibleMs)}`}>
        {formatClock(visibleMs)}
      </span>
    </Chip>
  )
}

function StageTransition({
  stage,
  stageIndex,
  stageCount,
  onContinue,
}: {
  stage: CaseStageBoundary
  stageIndex: number
  stageCount: number
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-neutral-950/60 p-5">
      <section
        aria-modal="true"
        className="w-full max-w-lg rounded-xl bg-white p-7 shadow-overlay"
        role="dialog"
      >
        <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
          Stage {stageIndex + 1} of {stageCount}
        </p>
        <h2 className="mt-2 text-display font-bold text-neutral-950">{stage.title}</h2>
        {stage.intro ? <p className="mt-4 text-neutral-700">{stage.intro}</p> : null}
        <Button className="mt-7" onClick={onContinue}>
          Begin stage
        </Button>
      </section>
    </div>
  )
}

function buildResult(
  caseDoc: CaseDocument,
  plan: CasePlan,
  session: ActivitySession,
  caseProgress: CaseProgress,
  config: AppConfig,
): CaseAttemptResult {
  const caseLab = config.caseLab
  if (!caseLab) throw new Error('Case Lab configuration is required to score a case.')

  const stepResults: CaseStepResult[] = plan.steps.map((step) => {
    const progress = session.progress[step.primitive.id]
    return {
      primitiveId: step.primitive.id,
      firstAttemptScore: progress?.firstScore ?? 0,
      ...(caseProgress.stepElapsedMs[step.primitive.id] === undefined
        ? {}
        : { elapsedMs: caseProgress.stepElapsedMs[step.primitive.id] }),
      timedOut: progress?.firstTimedOut ?? false,
      response: progress?.firstResponse ?? null,
    }
  })
  const breakdown = calculateCaseScore({
    timingMode: plan.tierPreset.timing,
    steps: plan.steps.map((step, index) => {
      const boundary = stageForStep(plan, index)
      const scoring = step.primitive.scoring as Record<string, unknown>
      return {
        component: boundary?.component ?? 'none',
        firstAttemptScore: session.progress[step.primitive.id]?.firstScore ?? 0,
        weight: step.primitive.scoring.weight,
        elapsedMs: caseProgress.stepElapsedMs[step.primitive.id],
        targetSeconds:
          typeof scoring.targetSeconds === 'number' ? scoring.targetSeconds : undefined,
        maxSeconds:
          typeof scoring.maxSeconds === 'number'
            ? scoring.maxSeconds
            : step.primitive.timer?.durationSeconds,
        timedOut: session.progress[step.primitive.id]?.firstTimedOut ?? false,
      }
    }),
    clues: [...plan.clueMap.values()],
    openedClueIds: caseProgress.openedClueIds,
    durationMs: caseProgress.caseElapsedMs,
    caseTargetSeconds: caseDoc.timing?.caseTargetSeconds,
    caseMaxSeconds: caseDoc.timing?.caseMaxSeconds,
    caseClockExpired: caseProgress.caseClockExpired,
    config: caseLab.scoring,
  })

  return {
    caseId: caseDoc.id,
    breakdown,
    stepResults,
    completedAt: session.completedAt ?? new Date().toISOString(),
  }
}

function CompletionFlow({
  context,
  caseDoc,
  config,
  caseProgress,
  attemptHistory,
  onComplete,
  onResetProgress,
}: {
  context: ActivityPlayerCompletionContext
  caseDoc: CaseDocument
  config: AppConfig
  caseProgress: CaseProgress
  attemptHistory: readonly CaseAttemptHistoryItem[]
  onComplete?: (result: CaseAttemptResult) => void
  onResetProgress: () => void
}) {
  const [view, setView] = useState<'results' | 'compare'>('results')
  const result = useMemo(
    () => buildResult(caseDoc, context.plan as CasePlan, context.session, caseProgress, config),
    [caseDoc, caseProgress, config, context.plan, context.session],
  )
  const notified = useRef(false)
  useEffect(() => {
    if (notified.current) return
    notified.current = true
    onComplete?.(result)
  }, [onComplete, result])

  const replay = () => {
    onResetProgress()
    context.onReplay()
  }
  const caseLab = config.caseLab!
  return view === 'results' ? (
    <CaseResults
      caseDoc={caseDoc}
      result={result}
      clues={caseDoc.clues}
      starThresholds={config.gamification.stars}
      completionXp={caseLab.xp.caseComplete}
      onCompare={() => setView('compare')}
      onContinue={context.onContinue}
      onReplay={replay}
    />
  ) : (
    <CaseCompare
      caseDoc={caseDoc}
      result={result}
      history={attemptHistory}
      historyLimit={caseLab.historyLimit}
      onBack={() => setView('results')}
      onContinue={context.onContinue}
      onReplay={replay}
    />
  )
}

export function CasePlayer({
  caseDoc,
  config,
  anatomyMap,
  previousAttempts,
  previousBestScore,
  continuePath,
  exitPath,
  attemptHistory = [],
  onClueOpened,
  onComplete,
}: CasePlayerProps) {
  const plan = useMemo(() => buildCasePlan(caseDoc, config), [caseDoc, config])
  const [initialSession] = useState(() =>
    useActivitySessionStore.getState().loadForPlan(plan),
  )
  const [caseProgress, setCaseProgress] = useState<CaseProgress>(
    initialSession.caseProgress ?? EMPTY_CASE_PROGRESS,
  )
  const caseProgressRef = useRef(caseProgress)
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null)
  const [pendingStage, setPendingStage] = useState<CaseStageBoundary | null>(null)
  const entryHandled = useRef(false)
  const completedAttemptRef = useRef<string | null>(null)
  const startedAtRef = useRef(initialSession.startedAt)
  const categoryLabels = useMemo(
    () => new Map(config.caseLab?.clueCategories.map(({ id, label }) => [id, label]) ?? []),
    [config.caseLab?.clueCategories],
  )

  const persistProgress = useCallback(
    (patch: Partial<CaseProgress>) => {
      const next = { ...caseProgressRef.current, ...patch }
      caseProgressRef.current = next
      setCaseProgress(next)
      const current = useActivitySessionStore.getState().session
      if (current && current.activityKind === 'case' && current.activityId === plan.activity.id) {
        useActivitySessionStore.getState().save({ ...current, caseProgress: next })
      }
    },
    [plan.activity.id],
  )

  useEffect(
    () =>
      useActivitySessionStore.subscribe((state) => {
        const nextSession = state.session
        if (
          !nextSession ||
          nextSession.activityKind !== 'case' ||
          nextSession.activityId !== plan.activity.id ||
          nextSession.startedAt === startedAtRef.current
        ) {
          return
        }
        const hadStarted = startedAtRef.current !== null
        startedAtRef.current = nextSession.startedAt
        if (!hadStarted || nextSession.caseProgress) return
        const reset = { ...EMPTY_CASE_PROGRESS, openedClueIds: [], stepElapsedMs: {} }
        caseProgressRef.current = reset
        setCaseProgress(reset)
        setSelectedClueId(null)
        entryHandled.current = false
      }),
    [plan.activity.id],
  )

  const handleOpenClue = useCallback(
    (clueId: string) => {
      const clue = plan.clueMap.get(clueId)
      if (!clue) return
      const currentStepIndex = useActivitySessionStore.getState().session?.stepIndex ?? 0
      const stageId =
        stageForStep(plan, currentStepIndex)?.stageId ?? plan.stageBoundaries[0]?.stageId ?? ''
      const result = openClue(caseProgressRef.current.openedClueIds, clueId)
      setSelectedClueId(clueId)
      if (!result.newlyOpened) return
      persistProgress({ openedClueIds: [...result.openedClueIds] })
      onClueOpened?.({
        caseId: caseDoc.id,
        clueId,
        essential: clue.essential,
        stageId,
      })
    },
    [caseDoc.id, onClueOpened, persistProgress, plan],
  )

  useEffect(() => {
    const entry = caseDoc.entry
    if (entryHandled.current || entry.mode !== 'clue_first') return
    const unsubscribe = useActivitySessionStore.subscribe((state) => {
      if (state.session?.activityId !== caseDoc.id || state.session.phase !== 'step') return
      entryHandled.current = true
      handleOpenClue(entry.clueId)
    })
    return unsubscribe
  }, [caseDoc.entry, caseDoc.id, handleOpenClue])

  const handleAttempt = useCallback(
    (attempt: ActivityPlayerTimedAttempt) => {
      if (
        attempt.attempt !== 1 ||
        caseProgressRef.current.stepElapsedMs[attempt.primitiveId] !== undefined
      ) {
        return
      }
      persistProgress({
        stepElapsedMs: {
          ...caseProgressRef.current.stepElapsedMs,
          [attempt.primitiveId]: attempt.elapsedMs,
        },
      })
    },
    [persistProgress],
  )

  const resetProgress = useCallback(() => {
    entryHandled.current = false
    completedAttemptRef.current = null
    setSelectedClueId(null)
    persistProgress({ ...EMPTY_CASE_PROGRESS, stepElapsedMs: {}, openedClueIds: [] })
  }, [persistProgress])

  const notifyComplete = useCallback(
    (result: CaseAttemptResult) => {
      const key = `${result.caseId}:${result.completedAt}`
      if (completedAttemptRef.current === key) return
      completedAttemptRef.current = key
      onComplete?.(result)
    },
    [onComplete],
  )

  const caseLab = config.caseLab
  if (!caseLab) throw new Error('CasePlayer requires appConfig.caseLab.')

  return (
    <>
      <ActivityPlayer
        plan={plan}
        previousAttempts={previousAttempts}
        previousBestScore={previousBestScore}
        continuePath={continuePath}
        exitPath={exitPath}
        clueContext={{
          clues: [...plan.clueMap.values()],
          anatomyMap,
          onReopenClue: handleOpenClue,
        }}
        onAttemptTimed={handleAttempt}
        onStepBoundary={({ fromStepIndex, toStepIndex }) => {
          if (toStepIndex === null) return
          const from = stageForStep(plan, fromStepIndex)
          const to = stageForStep(plan, toStepIndex)
          if (from?.stageId !== to?.stageId && to) setPendingStage(to)
        }}
        renderChrome={({ stepIndex }) => {
          const stage = stageForStep(plan, stepIndex) ?? plan.stageBoundaries[0]!
          const stageClues = stage.clueIds.flatMap((id) => {
            const clue = plan.clueMap.get(id)
            return clue ? [clue] : []
          })
          const selected = selectedClueId ? plan.clueMap.get(selectedClueId) : undefined
          const visibleClues =
            selected && !stageClues.some(({ id }) => id === selected.id)
              ? [...stageClues, selected]
              : stageClues
          const commonClueProps = {
            clues: visibleClues,
            categoryLabels,
            openedClueIds: caseProgress.openedClueIds,
            selectedClueId,
            labelEssentialClues: plan.tierPreset.labelEssentialClues,
            optionalClueCost: caseLab.scoring.cluePenalty.perOptionalClue,
            onOpenClue: handleOpenClue,
            onSelectedClueChange: setSelectedClueId,
          }
          return {
            header: (
              <>
                <StageHeader
                  stages={plan.stageBoundaries}
                  currentStage={stage}
                  tierLabel={plan.tierPreset.label}
                  clock={
                    <CaseClock
                      mode={plan.tierPreset.timing}
                      maximumMs={
                        plan.tierPreset.timing === 'countdown' && caseDoc.timing
                          ? caseDoc.timing.caseMaxSeconds * 1_000
                          : null
                      }
                      progress={caseProgress}
                      onProgress={persistProgress}
                    />
                  }
                />
                <ClueBoard {...commonClueProps} variant="mobile" />
              </>
            ),
            aside: <ClueBoard {...commonClueProps} variant="desktop" />,
          }
        }}
        renderCompletion={(context) => (
          <CompletionFlow
            context={context}
            caseDoc={caseDoc}
            config={config}
            caseProgress={caseProgress}
            attemptHistory={attemptHistory}
            onComplete={notifyComplete}
            onResetProgress={resetProgress}
          />
        )}
      />
      {pendingStage ? (
        <StageTransition
          stage={pendingStage}
          stageIndex={plan.stageBoundaries.findIndex(
            ({ stageId }) => stageId === pendingStage.stageId,
          )}
          stageCount={plan.stageBoundaries.length}
          onContinue={() => setPendingStage(null)}
        />
      ) : null}
    </>
  )
}
