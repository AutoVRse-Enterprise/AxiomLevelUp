import { Clock3 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AnatomyFindingProvider } from '@/anatomy3d/viewer/findingContext'
import { Chip } from '@/components/ui'
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
import {
  openClue,
  reviewClue,
  type CaseClueOpenContext,
  type CaseClueOpenRecord,
  type CaseClueReviewMethod,
} from '@/engines/cases/clues'
import {
  canPinCaseEvidence,
  resolveCaseLocationLabel,
  updateCaseEvidencePins,
  type CaseEvidenceItem,
} from '@/engines/cases/evidence'
import { buildCasePlan, stageForStep, type CasePlan } from '@/engines/cases/plan'
import { normalizeCaseResponse } from '@/engines/cases/responses'
import { calculateCaseScore } from '@/engines/cases/scoring'
import type { ActivitySession, CaseProgress } from '@/engines/learning/session'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { emitEvent, subscribeToEvents } from '@/events/bus'
import {
  ActivityPlayer,
  type ActivityPlayerCompletionContext,
  type ActivityPlayerTimedAttempt,
} from '@/player/ActivityPlayer'
import { CaseCompare } from '@/player/case/CaseCompare'
import { CaseNotes } from '@/player/case/CaseNotes'
import { CaseResults } from '@/player/case/CaseResults'
import { CaseWalkthrough } from '@/player/case/CaseWalkthrough'
import type { WorkspaceSegment } from '@/player/case/CaseWorkspace'
import { ClueBoard } from '@/player/case/ClueBoard'
import { StageBanner } from '@/player/case/StageBanner'
import { StageHeader } from '@/player/case/StageHeader'
import { CaseReasoningProvider } from '@/player/case/reasoningContext'
import {
  presentLiveCaseResult,
  type CaseAttemptHistoryItem,
  type CaseAttemptResult,
  type CaseStepResult,
} from '@/player/case/types'
import { useLearnerStore } from '@/state/learnerStore'

const EMPTY_CASE_PROGRESS: CaseProgress = {
  openedClueIds: [],
  reviewedClueIds: [],
  clueOpenContexts: {},
  stepElapsedMs: {},
  caseElapsedMs: 0,
  caseClockExpired: false,
  evidence: { pinned: [] },
  differential: {},
  differentialCheckpoints: {},
}

function normalizeCaseProgress(progress?: CaseProgress): CaseProgress {
  return {
    ...EMPTY_CASE_PROGRESS,
    ...progress,
    openedClueIds: [...new Set(progress?.openedClueIds ?? [])],
    reviewedClueIds: [...new Set(progress?.reviewedClueIds ?? [])],
    clueOpenContexts: { ...(progress?.clueOpenContexts ?? {}) },
    stepElapsedMs: { ...(progress?.stepElapsedMs ?? {}) },
    evidence: {
      pinned: [...(progress?.evidence?.pinned ?? [])],
      ...(progress?.evidence?.currentLocation
        ? { currentLocation: { ...progress.evidence.currentLocation } }
        : {}),
    },
    differential: { ...(progress?.differential ?? {}) },
    differentialCheckpoints: { ...(progress?.differentialCheckpoints ?? {}) },
  }
}

export interface CaseClueOpened {
  caseId: string
  clueId: string
  essential: boolean
  stageId: string
  context: CaseClueOpenContext
  beforeResponse: boolean
}

export interface CasePlayerProps {
  caseDoc: CaseDocument
  config: AppConfig
  anatomyMap?: AnatomyMap
  autoStartOrResume?: boolean
  previousAttempts: number
  previousBestScore: number | null
  continuePath: string
  exitPath: string
  challengeId?: string
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
  paused,
  progress,
  onProgress,
}: {
  mode: CaseClockMode
  maximumMs: number | null
  paused: boolean
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
  const persistedExpired = useRef(progress.caseClockExpired)
  const onProgressRef = useRef(onProgress)

  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])

  useEffect(() => {
    const sync = (now: number, pause = false) => {
      clockRef.current = pause
        ? pauseCaseClock(clockRef.current, now)
        : updateCaseClock(clockRef.current, now)
      const next = selectCaseClock(clockRef.current, now)
      setSnapshot(next)
      const second = Math.floor(next.elapsedMs / 1_000)
      if (
        pause ||
        second !== persistedSecond.current ||
        next.expired !== persistedExpired.current
      ) {
        persistedSecond.current = second
        persistedExpired.current = next.expired
        const persisted = persistCaseClock(clockRef.current, now)
        onProgressRef.current({
          caseElapsedMs: persisted.accumulatedActiveMs,
          caseClockExpired: persisted.expired,
        })
      }
    }
    let interval: number | null = null
    const stop = () => {
      if (interval !== null) window.clearInterval(interval)
      interval = null
    }
    const pause = () => {
      stop()
      sync(Date.now(), true)
    }
    const resume = () => {
      if (paused || document.hidden || interval !== null) return
      clockRef.current = resumeCaseClock(clockRef.current, Date.now())
      setSnapshot(selectCaseClock(clockRef.current, Date.now()))
      interval = window.setInterval(() => sync(Date.now()), 250)
    }
    const onVisibility = () => {
      if (document.hidden) pause()
      else resume()
    }

    if (paused || document.hidden) pause()
    else resume()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
      sync(Date.now(), true)
    }
  }, [mode, paused])

  const visibleMs = mode === 'countdown' ? (snapshot.remainingMs ?? 0) : snapshot.elapsedMs
  const label =
    mode === 'countdown'
      ? 'Case time remaining'
      : mode === 'none'
        ? 'Case elapsed time; speed is not scored'
        : 'Case elapsed time'
  return (
    <Chip tone={snapshot.expired ? 'warning' : 'neutral'}>
      <Clock3 aria-hidden="true" size={15} />
      {mode === 'none' ? <span>Speed not scored ·</span> : null}
      <span role="timer" aria-label={`${label}: ${formatClock(visibleMs)}`}>
        {formatClock(visibleMs)}
      </span>
    </Chip>
  )
}

function selectInspectedFindingIds(session: ActivitySession | null | undefined) {
  return new Set(
    Object.values(session?.progress ?? {}).flatMap(({ interactionKeys }) =>
      interactionKeys.flatMap((key) => (key.startsWith('finding:') ? [key.slice(8)] : [])),
    ),
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

  const scoredSteps = plan.steps.filter(({ scored }) => scored)
  const stepResults: CaseStepResult[] = scoredSteps.map((step) => {
    const progress = session.progress[step.primitive.id]
    return {
      primitiveId: step.primitive.id,
      firstAttemptScore: progress?.firstScore ?? 0,
      ...(caseProgress.stepElapsedMs[step.primitive.id] === undefined
        ? {}
        : { elapsedMs: caseProgress.stepElapsedMs[step.primitive.id] }),
      timedOut: progress?.firstTimedOut ?? false,
      response: normalizeCaseResponse(progress?.firstResponse ?? null),
    }
  })
  const breakdown = calculateCaseScore({
    timingMode: plan.tierPreset.timing,
    steps: plan.steps.map((step, index) => {
      const boundary = stageForStep(plan, index)
      const scoring = step.primitive.scoring as Record<string, unknown>
      return {
        component: boundary?.component ?? 'none',
        scored: step.scored,
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
    clueOpenContexts: caseProgress.clueOpenContexts,
    durationMs: caseProgress.caseElapsedMs,
    caseTargetSeconds: caseDoc.timing?.caseTargetSeconds,
    caseMaxSeconds: caseDoc.timing?.caseMaxSeconds,
    caseClockExpired: caseProgress.caseClockExpired,
    config: caseLab.scoring,
  })

  return {
    caseId: caseDoc.id,
    attemptId: `${caseDoc.id}:${session.startedAt ?? session.completedAt ?? 'attempt'}`,
    breakdown,
    stepResults,
    reviewedClueIds: [...caseProgress.reviewedClueIds],
    evidence: {
      ...structuredClone(caseProgress.evidence),
      inspectedFindingIds: [...selectInspectedFindingIds(session)],
    },
    differential: { ...caseProgress.differential },
    differentialCheckpoints: structuredClone(caseProgress.differentialCheckpoints),
    timeoutCreditApplied: scoredSteps.some(
      ({ primitive }) => session.progress[primitive.id]?.firstTimeoutCreditApplied === true,
    ),
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
  const [evidenceAnchor, setEvidenceAnchor] = useState<string | null>(null)
  const result = useMemo(
    () => buildResult(caseDoc, context.plan as CasePlan, context.session, caseProgress, config),
    [caseDoc, caseProgress, config, context.plan, context.session],
  )
  const persistedAttempt = useLearnerStore((state) =>
    state.caseAttempts[caseDoc.id]?.find(({ attemptId }) => attemptId === result.attemptId),
  )
  const latestActivityResult = useLearnerStore((state) => state.gamification.lastActivityResult)
  const activityResult =
    latestActivityResult?.activityKind === 'case' && latestActivityResult.activityId === caseDoc.id
      ? latestActivityResult
      : null
  const presentedResult = useMemo(
    () => presentLiveCaseResult(result, persistedAttempt),
    [persistedAttempt, result],
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
      caseLab={caseLab}
      activityResult={activityResult}
      result={presentedResult}
      clues={caseDoc.clues}
      clueReview={caseLab.clueReview}
      starThresholds={config.gamification.stars}
      onCompare={(anchor) => {
        setEvidenceAnchor(anchor ?? null)
        setView('compare')
      }}
      onContinue={context.onContinue}
      onReplay={replay}
    />
  ) : (
    <CaseCompare
      caseDoc={caseDoc}
      caseLab={caseLab}
      result={presentedResult}
      history={attemptHistory}
      historyLimit={caseLab.historyLimit}
      evidenceAnchor={evidenceAnchor}
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
  autoStartOrResume = false,
  previousAttempts,
  previousBestScore,
  continuePath,
  exitPath,
  challengeId,
  attemptHistory = [],
  onClueOpened,
  onComplete,
}: CasePlayerProps) {
  const plan = useMemo(() => buildCasePlan(caseDoc, config), [caseDoc, config])
  const [initialSession] = useState(() => useActivitySessionStore.getState().loadForPlan(plan))
  const [caseProgress, setCaseProgress] = useState<CaseProgress>(
    normalizeCaseProgress(initialSession.caseProgress),
  )
  const [optionalClueConfirmationAcknowledged, setOptionalClueConfirmationAcknowledged] =
    useState(() =>
      (initialSession.caseProgress?.openedClueIds ?? []).some(
        (clueId) => plan.clueMap.get(clueId)?.essential === false,
      ),
    )
  const caseProgressRef = useRef(caseProgress)
  const [cluePresentation, setCluePresentation] = useState<{
    selectedClueId: string | null
    presenterOpen: boolean
  }>({ selectedClueId: null, presenterOpen: false })
  const walkthroughSeen = useLearnerStore((state) => state.caseLab.walkthroughSeen)
  const markWalkthroughSeen = useLearnerStore((state) => state.markCaseLabWalkthroughSeen)
  const [walkthroughOpen, setWalkthroughOpen] = useState(false)
  const [workspaceSegment, setWorkspaceSegment] = useState<WorkspaceSegment>('task')
  const entryClueAfterWalkthrough = useRef(false)
  const [cluePresenterBlocking, setCluePresenterBlocking] = useState(false)
  const entryHandled = useRef(false)
  const openedEventSent = useRef(false)
  const completedStageIds = useRef(new Set<string>())
  const completedAttemptRef = useRef<string | null>(null)
  const startedAtRef = useRef(initialSession.startedAt)
  const attemptNumberRef = useRef(previousAttempts + (initialSession.startedAt ? 1 : 0))
  const categoryLabels = useMemo(
    () => new Map(config.caseLab?.clueCategories.map(({ id, label }) => [id, label]) ?? []),
    [config.caseLab?.clueCategories],
  )

  useEffect(() => {
    if (openedEventSent.current) return
    openedEventSent.current = true
    emitEvent({ event: 'case_opened', caseId: caseDoc.id })
  }, [caseDoc.id])

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
      subscribeToEvents((event) => {
        if (
          event.event === 'case_hypothesis_updated' &&
          event.caseId === caseDoc.id &&
          event.checkpointId
        ) {
          const checkpoint = {
            ...(caseProgressRef.current.differentialCheckpoints[event.checkpointId] ?? {}),
            [event.hypothesisId]: event.confidence,
          }
          persistProgress({
            differential: {
              ...caseProgressRef.current.differential,
              [event.hypothesisId]: event.confidence,
            },
            differentialCheckpoints: {
              ...caseProgressRef.current.differentialCheckpoints,
              [event.checkpointId]: checkpoint,
            },
          })
          return
        }
        if (
          (event.event !== 'anatomy_waypoint_reached' &&
            event.event !== 'anatomy_structure_selected' &&
            event.event !== 'anatomy_finding_inspected') ||
          event.activityKind !== 'case' ||
          event.activityId !== caseDoc.id
        ) {
          return
        }
        const session = useActivitySessionStore.getState().session
        if (
          !session ||
          session.activityKind !== 'case' ||
          session.activityId !== caseDoc.id ||
          session.startedAt === null ||
          session.phase === 'complete'
        ) {
          return
        }
        if (event.event === 'anatomy_finding_inspected') {
          const inspectedFindingIds = [
            ...new Set([
              ...(caseProgressRef.current.evidence.inspectedFindingIds ?? []),
              event.findingId,
            ]),
          ]
          persistProgress({
            evidence: { ...caseProgressRef.current.evidence, inspectedFindingIds },
          })
          return
        }
        const currentLocation =
          event.event === 'anatomy_waypoint_reached'
            ? { kind: 'waypoint' as const, id: event.waypointId }
            : { kind: 'structure' as const, id: event.structureId }
        const current = caseProgressRef.current.evidence.currentLocation
        if (current?.kind === currentLocation.kind && current.id === currentLocation.id) return
        persistProgress({
          evidence: {
            ...caseProgressRef.current.evidence,
            currentLocation,
          },
        })
      }),
    [caseDoc.id, persistProgress],
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
        const reset = normalizeCaseProgress()
        caseProgressRef.current = reset
        setCaseProgress(reset)
        setCluePresentation({ selectedClueId: null, presenterOpen: false })
        setCluePresenterBlocking(false)
        setWalkthroughOpen(false)
        setWorkspaceSegment('task')
        setOptionalClueConfirmationAcknowledged(false)
        entryClueAfterWalkthrough.current = false
        entryHandled.current = false
      }),
    [plan.activity.id],
  )

  const presentClue = useCallback(
    (clueId: string, context: CaseClueOpenContext) => {
      const clue = plan.clueMap.get(clueId)
      if (!clue) return
      const currentSession = useActivitySessionStore.getState().session
      const currentStepIndex = currentSession?.stepIndex ?? 0
      const currentStep = plan.steps[currentStepIndex]
      const beforeResponse =
        currentSession?.phase === 'step' &&
        (currentStep
          ? (currentSession.progress[currentStep.primitive.id]?.attempts ?? 0) === 0
          : true)
      const stageId =
        stageForStep(plan, currentStepIndex)?.stageId ?? plan.stageBoundaries[0]?.stageId ?? ''
      const result = openClue(caseProgressRef.current.openedClueIds, clueId)
      setCluePresentation({ selectedClueId: clueId, presenterOpen: true })
      setWorkspaceSegment('evidence')
      if (!result.newlyOpened) return
      const opened: CaseClueOpenRecord = { context, beforeResponse }
      persistProgress({
        openedClueIds: [...result.openedClueIds],
        clueOpenContexts: {
          ...caseProgressRef.current.clueOpenContexts,
          [clueId]: opened,
        },
      })
      const event = {
        caseId: caseDoc.id,
        clueId,
        essential: clue.essential,
        stageId,
        ...opened,
      }
      emitEvent({ event: 'case_clue_opened', ...event })
      onClueOpened?.(event)
    },
    [caseDoc.id, onClueOpened, persistProgress, plan],
  )

  const presentEntryClue = useCallback(() => {
    const entry = caseDoc.entry
    if (entryHandled.current || entry.mode !== 'clue_first') return
    entryHandled.current = true
    presentClue(entry.clueId, 'entry')
  }, [caseDoc.entry, presentClue])

  const closeWalkthrough = useCallback(() => {
    setWalkthroughOpen(false)
    setWorkspaceSegment('task')
    markWalkthroughSeen()
    if (entryClueAfterWalkthrough.current) {
      entryClueAfterWalkthrough.current = false
      presentEntryClue()
    }
  }, [markWalkthroughSeen, presentEntryClue])

  const showWalkthrough = useCallback(() => {
    setCluePresentation({ selectedClueId: null, presenterOpen: false })
    setCluePresenterBlocking(false)
    setWalkthroughOpen(true)
  }, [])

  const markClueReviewed = useCallback(
    (clueId: string, method: CaseClueReviewMethod) => {
      const clue = plan.clueMap.get(clueId)
      if (!clue || !caseProgressRef.current.openedClueIds.includes(clueId)) return
      const result = reviewClue(caseProgressRef.current.reviewedClueIds, clueId)
      if (!result.newlyReviewed) return
      const currentSession = useActivitySessionStore.getState().session
      const currentStepIndex = currentSession?.stepIndex ?? 0
      const stageId =
        stageForStep(plan, currentStepIndex)?.stageId ?? plan.stageBoundaries[0]?.stageId ?? ''
      persistProgress({ reviewedClueIds: [...result.reviewedClueIds] })
      emitEvent({
        event: 'case_clue_reviewed',
        caseId: caseDoc.id,
        clueId,
        primitiveId: clue.primitive.id,
        primitiveType: clue.primitive.type,
        stageId,
        method,
      })
    },
    [caseDoc.id, persistProgress, plan],
  )

  const updateEvidencePin = useCallback(
    (item: CaseEvidenceItem, pinned: boolean) => {
      const inspectedFindingIds = selectInspectedFindingIds(
        useActivitySessionStore.getState().session,
      )
      if (
        pinned &&
        !canPinCaseEvidence(item, caseProgressRef.current.reviewedClueIds, inspectedFindingIds)
      ) {
        return
      }
      const nextPinned = updateCaseEvidencePins(
        caseProgressRef.current.evidence.pinned,
        item,
        pinned,
      )
      if (nextPinned === caseProgressRef.current.evidence.pinned) return
      persistProgress({
        evidence: { ...caseProgressRef.current.evidence, pinned: [...nextPinned] },
      })
      emitEvent({ event: 'case_evidence_pinned', caseId: caseDoc.id, evidence: item, pinned })
    },
    [caseDoc.id, persistProgress],
  )

  const updateHypothesis = useCallback(
    (hypothesisId: string, confidence: CaseProgress['differential'][string]) => {
      if (
        !caseDoc.differential?.some(({ id }) => id === hypothesisId) ||
        caseProgressRef.current.differential[hypothesisId] === confidence
      ) {
        return
      }
      persistProgress({
        differential: { ...caseProgressRef.current.differential, [hypothesisId]: confidence },
      })
      emitEvent({
        event: 'case_hypothesis_updated',
        caseId: caseDoc.id,
        hypothesisId,
        confidence,
      })
    },
    [caseDoc.differential, caseDoc.id, persistProgress],
  )

  const handleAttempt = useCallback(
    (attempt: ActivityPlayerTimedAttempt) => {
      const step = plan.steps[attempt.stepIndex]
      if (
        !step?.scored ||
        step.primitive.id !== attempt.primitiveId ||
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
    [persistProgress, plan.steps],
  )

  const resetProgress = useCallback(() => {
    entryHandled.current = false
    completedAttemptRef.current = null
    completedStageIds.current.clear()
    setCluePresentation({ selectedClueId: null, presenterOpen: false })
    setCluePresenterBlocking(false)
    setWalkthroughOpen(false)
    setWorkspaceSegment('task')
    setOptionalClueConfirmationAcknowledged(false)
    entryClueAfterWalkthrough.current = false
    persistProgress(normalizeCaseProgress())
  }, [persistProgress])

  const notifyComplete = useCallback(
    (result: CaseAttemptResult) => {
      const key = `${result.caseId}:${result.completedAt}`
      if (completedAttemptRef.current === key) return
      completedAttemptRef.current = key
      emitEvent({
        event: 'case_completed',
        caseId: result.caseId,
        attemptId: result.attemptId,
        tier: caseDoc.tier,
        breakdown: result.breakdown,
        durationSeconds: result.breakdown.durationSeconds,
        openedClueIds: result.breakdown.openedClueIds,
        stepResults: result.stepResults,
        reviewedClueIds: result.reviewedClueIds,
        evidence: result.evidence,
        differential: result.differential,
        differentialCheckpoints: result.differentialCheckpoints,
        timeoutCreditApplied: result.timeoutCreditApplied,
        ...(challengeId ? { challengeId } : {}),
      })
      if (challengeId) {
        const correctCount = result.stepResults.filter(
          ({ firstAttemptScore }) => firstAttemptScore === 1,
        ).length
        emitEvent({
          event: 'challenge_completed',
          challengeId,
          score: result.breakdown.total,
          accuracy:
            result.stepResults.length === 0
              ? 100
              : Math.round((correctCount / result.stepResults.length) * 100),
          correctCount,
          scoredCount: result.stepResults.length,
          durationSeconds: result.breakdown.durationSeconds,
        })
      }
      onComplete?.(result)
    },
    [caseDoc.tier, challengeId, onComplete],
  )

  const caseLab = config.caseLab
  if (!caseLab) throw new Error('CasePlayer requires appConfig.caseLab.')
  const pauseTiming = walkthroughOpen || cluePresenterBlocking

  return (
    <AnatomyFindingProvider findingsByStepId={plan.findingsByStepId}>
      <CaseReasoningProvider caseDoc={caseDoc} progress={caseProgress}>
        <ActivityPlayer
        plan={plan}
        autoStartOrResume={autoStartOrResume}
        previousAttempts={previousAttempts}
        previousBestScore={previousBestScore}
        continuePath={continuePath}
        exitPath={exitPath}
        pauseTiming={pauseTiming}
        clueContext={{
          clues: [...plan.clueMap.values()],
          anatomyMap,
          onReopenClue: (clueId) => presentClue(clueId, 'remediation'),
        }}
        onStarted={(resumed) => {
          if (!resumed) {
            attemptNumberRef.current += 1
          } else {
            entryHandled.current = true
            if (attemptNumberRef.current === previousAttempts) attemptNumberRef.current += 1
          }
          if (!walkthroughSeen) {
            entryClueAfterWalkthrough.current = !resumed && caseDoc.entry.mode === 'clue_first'
            setWalkthroughOpen(true)
          } else if (!resumed) {
            presentEntryClue()
          }
          emitEvent({
            event: 'case_started',
            caseId: caseDoc.id,
            attempt: attemptNumberRef.current,
            resumed,
            tier: caseDoc.tier,
          })
        }}
        onAttemptTimed={handleAttempt}
        onStepBoundary={({ fromStepIndex, toStepIndex }) => {
          setWorkspaceSegment('task')
          const from = stageForStep(plan, fromStepIndex)
          const to = toStepIndex === null ? null : stageForStep(plan, toStepIndex)
          if (
            from &&
            from.stageId !== to?.stageId &&
            !completedStageIds.current.has(from.stageId)
          ) {
            completedStageIds.current.add(from.stageId)
            emitEvent({
              event: 'case_stage_completed',
              caseId: caseDoc.id,
              stageId: from.stageId,
              stageIndex: plan.stageBoundaries.findIndex(({ stageId }) => stageId === from.stageId),
            })
          }
          if (from?.stageId !== to?.stageId) {
            setCluePresentation({ selectedClueId: null, presenterOpen: false })
            setCluePresenterBlocking(false)
          }
        }}
        renderChrome={({ stepIndex, step, session }) => {
          const stage = stageForStep(plan, stepIndex) ?? plan.stageBoundaries[0]!
          const stageClues = stage.clueIds.flatMap((id) => {
            const clue = plan.clueMap.get(id)
            return clue ? [clue] : []
          })
          const stageIndex = plan.stageBoundaries.findIndex(({ stageId }) => stageId === stage.stageId)
          const availableClueIds = [
            ...new Set(
              plan.stageBoundaries
                .slice(0, stageIndex + 1)
                .flatMap(({ clueIds }) => clueIds),
            ),
          ]
          const availableClues = availableClueIds.flatMap((id) => {
            const clue = plan.clueMap.get(id)
            return clue ? [clue] : []
          })
          const selected = cluePresentation.selectedClueId
            ? plan.clueMap.get(cluePresentation.selectedClueId)
            : undefined
          const visibleClues =
            selected && !availableClues.some(({ id }) => id === selected.id)
              ? [...availableClues, selected]
              : availableClues
          const commonClueProps = {
            clues: visibleClues,
            caseClueCount: caseDoc.clues.length,
            availableClueCount: stageClues.length,
            categoryLabels,
            openedClueIds: caseProgress.openedClueIds,
            reviewedClueIds: caseProgress.reviewedClueIds.filter((id) => plan.clueMap.has(id)),
            selectedClueId: cluePresentation.selectedClueId,
            presenterOpen: cluePresentation.presenterOpen,
            labelEssentialClues: plan.tierPreset.labelEssentialClues,
            relevantClueIds: step.primitive.clueIds,
            optionalClueCost: caseLab.scoring.cluePenalty.perOptionalClue,
            optionalClueConfirmationAcknowledged,
            clueReview: caseLab.clueReview,
            onPresentClue: (clueId: string) => presentClue(clueId, 'browse'),
            onOpenNoteClue: (clueId: string) => presentClue(clueId, 'remediation'),
            onReviewClue: markClueReviewed,
            onOptionalClueConfirmation: () => setOptionalClueConfirmationAcknowledged(true),
            onPresenterOpenChange: (presenterOpen: boolean) =>
              setCluePresentation((current) => ({ ...current, presenterOpen })),
            onBlockingChange: setCluePresenterBlocking,
          }
          return {
            header: (
              <div className="space-y-3">
                <StageHeader
                  stages={plan.stageBoundaries}
                  currentStage={stage}
                  onShowWalkthrough={showWalkthrough}
                  clock={
                    <CaseClock
                      mode={plan.tierPreset.timing}
                      maximumMs={
                        plan.tierPreset.timing === 'countdown' && caseDoc.timing
                          ? caseDoc.timing.caseMaxSeconds * 1_000
                          : null
                      }
                      paused={pauseTiming}
                      progress={caseProgress}
                      onProgress={persistProgress}
                    />
                  }
                />
                <StageBanner stage={stage} />
              </div>
            ),
            aside: <ClueBoard {...commonClueProps} variant="panel" />,
            notes: (
              <CaseNotes
                caseDoc={caseDoc}
                progress={caseProgress}
                availableClueIds={availableClueIds}
                inspectedFindingIds={selectInspectedFindingIds(session)}
                currentLocationLabel={resolveCaseLocationLabel(
                  anatomyMap,
                  caseProgress.evidence.currentLocation,
                )}
                onOpenClue={(clueId) => presentClue(clueId, 'remediation')}
                onPinChange={updateEvidencePin}
                onHypothesisChange={updateHypothesis}
              />
            ),
            evidenceAnnouncement: `${stageClues.length} evidence ${
              stageClues.length === 1 ? 'item is' : 'items are'
            } available in ${stage.title}.`,
            workspaceSegment,
            onWorkspaceSegmentChange: setWorkspaceSegment,
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
      </CaseReasoningProvider>
      <CaseWalkthrough open={walkthroughOpen} onClose={closeWalkthrough} />
    </AnatomyFindingProvider>
  )
}
