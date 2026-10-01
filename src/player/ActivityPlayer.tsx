import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'

import { useContent } from '@/app/contentContext'
import { Button } from '@/components/ui'
import { isPrimitiveComplete } from '@/engines/learning/completionRules'
import type { ActivityPlan } from '@/engines/learning/plan'
import {
  createActivitySession,
  selectActivitySummary,
  selectCurrentStep,
  selectProgressFraction,
  sessionReducer,
  type ActivitySession,
  type SessionAction,
} from '@/engines/learning/session'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { emitEvent } from '@/events/bus'
import { ActivityIntro } from '@/player/ActivityIntro'
import { CompletionSummary } from '@/player/CompletionSummary'
import { ExitConfirmDialog } from '@/player/ExitConfirmDialog'
import { FeedbackPanel, type FeedbackStatus } from '@/player/FeedbackPanel'
import { mapInteractionToEvents } from '@/player/interactionEvents'
import { shouldRevealAnswer } from '@/player/reviewPolicy'
import { StepFrame } from '@/player/StepFrame'
import { TimerBadge } from '@/player/TimerBadge'
import { useAttemptTimer } from '@/player/useAttemptTimer'
import { evaluatePrimitive } from '@/primitives/definitions'
import { PrimitiveRenderer } from '@/primitives/registry'

interface ActivityPlayerProps {
  plan: ActivityPlan
  previousAttempts: number
  previousBestScore: number | null
  continuePath: string
  exitPath: string
}

export function ActivityPlayer({
  plan,
  previousAttempts,
  previousBestScore,
  continuePath,
  exitPath,
}: ActivityPlayerProps) {
  const navigate = useNavigate()
  const { appConfig } = useContent()
  const [session, setSession] = useState(() => useActivitySessionStore.getState().loadForPlan(plan))
  const [awaitingResume, setAwaitingResume] = useState(
    session.startedAt !== null && session.phase !== 'intro' && session.phase !== 'complete',
  )
  const sessionRef = useRef(session)
  const viewed = useRef(new Set<string>())
  const pendingDraft = useRef<{ primitiveId: string; draft: unknown } | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaProgress = useRef<Record<string, number>>({})
  const blocker = useBlocker(session.startedAt !== null && session.phase !== 'complete')

  const transition = useCallback((action: SessionAction) => {
    const next = sessionReducer(sessionRef.current, action)
    sessionRef.current = next
    setSession(next)
    useActivitySessionStore.getState().save(next)
  }, [])

  const flushDraft = useCallback(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = null
    const pending = pendingDraft.current
    pendingDraft.current = null
    if (pending) {
      transition({ type: 'draft', primitiveId: pending.primitiveId, draft: pending.draft })
    }
  }, [transition])

  const queueDraft = useCallback(
    (primitiveId: string, draft: unknown) => {
      pendingDraft.current = { primitiveId, draft }
      if (draftTimer.current) clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(flushDraft, 300)
    },
    [flushDraft],
  )

  useEffect(() => flushDraft, [flushDraft])

  const emitStarted = useCallback(
    (resumed: boolean) => {
      if (plan.activity.kind === 'lesson') {
        emitEvent({
          event: 'lesson_started',
          courseId: plan.activity.courseId ?? '',
          lessonId: plan.activity.id,
          attempt: previousAttempts + (resumed ? 0 : 1),
          resumed,
        })
      } else {
        emitEvent({
          event: 'challenge_started',
          challengeId: plan.activity.id,
          attempt: 1,
          resumed,
        })
      }
    },
    [plan.activity, previousAttempts],
  )

  const step = selectCurrentStep(session, plan)
  const stepProgress = step ? session.progress[step.primitive.id] : undefined

  useEffect(() => {
    if (awaitingResume || session.phase !== 'step' || !step) return
    if (viewed.current.has(step.primitive.id)) return
    viewed.current.add(step.primitive.id)
    emitEvent({
      event: 'primitive_viewed',
      activityKind: plan.activity.kind,
      activityId: plan.activity.id,
      primitiveId: step.primitive.id,
      primitiveType: step.primitive.type,
    })
  }, [awaitingResume, plan.activity.id, plan.activity.kind, session.phase, step])

  const markComplete = useCallback(() => {
    if (!step || stepProgress?.completed) return
    transition({ type: 'complete_current', primitiveId: step.primitive.id })
    emitEvent({
      event: 'primitive_completed',
      activityKind: plan.activity.kind,
      activityId: plan.activity.id,
      primitiveId: step.primitive.id,
      primitiveType: step.primitive.type,
      stepIndex: session.stepIndex,
    })
  }, [
    plan.activity.id,
    plan.activity.kind,
    session.stepIndex,
    step,
    stepProgress?.completed,
    transition,
  ])

  const submitResponse = useCallback(
    (submittedResponse: unknown, timedOut = false) => {
      if (!step || !stepProgress || sessionRef.current.phase !== 'step') return

      const hasPendingDraft = pendingDraft.current?.primitiveId === step.primitive.id
      const response = timedOut
        ? hasPendingDraft
          ? pendingDraft.current?.draft
          : stepProgress.draft
        : submittedResponse
      flushDraft()
      const result = timedOut
        ? { score: 0, correct: false }
        : evaluatePrimitive(step.primitive, response)
      const attempts = stepProgress.attempts + 1
      const completed = isPrimitiveComplete(step.primitive, {
        attempts,
        correct: result.correct,
        interactionKeys: stepProgress.interactionKeys,
        explorableKeys: step.explorableKeys,
        mediaProgress: stepProgress.mediaProgress,
        mediaCompletionThreshold: appConfig.product.player.mediaCompletionThreshold,
        reportedComplete: step.primitive.completion.mode === 'outcome',
        retry: step.retry,
        maxAttempts: step.maxAttempts,
      })
      transition({
        type: 'submit',
        primitiveId: step.primitive.id,
        response,
        score: result.score,
        completed,
        timedOut,
      })
      emitEvent({
        event: 'question_answered',
        activityKind: plan.activity.kind,
        activityId: plan.activity.id,
        questionId: step.primitive.id,
        primitiveType: step.primitive.type,
        conceptIds: step.primitive.conceptIds,
        score: result.score,
        correct: result.correct,
        attempt: attempts,
        xp: step.primitive.scoring.xp ?? 0,
        timedOut,
      })
      if (completed) {
        emitEvent({
          event: 'primitive_completed',
          activityKind: plan.activity.kind,
          activityId: plan.activity.id,
          primitiveId: step.primitive.id,
          primitiveType: step.primitive.type,
          stepIndex: session.stepIndex,
        })
      }
    },
    [
      appConfig.product.player.mediaCompletionThreshold,
      flushDraft,
      plan.activity.id,
      plan.activity.kind,
      session.stepIndex,
      step,
      stepProgress,
      transition,
    ],
  )

  const attemptTimer = useAttemptTimer({
    active:
      !awaitingResume &&
      session.phase === 'step' &&
      Boolean(step?.supported && step.timerCompatible && step.primitive.timer),
    attemptKey: `${step?.primitive.id ?? 'none'}:${stepProgress?.attempts ?? 0}`,
    durationSeconds: step?.primitive.timer?.durationSeconds ?? null,
    mode: step?.primitive.timer?.mode ?? 'countdown',
    onExpire: () => submitResponse(undefined, true),
  })

  const finish = useCallback(
    (current: ActivitySession) => {
      const at = new Date().toISOString()
      const finished = sessionReducer(current, { type: 'finish', at })
      sessionRef.current = finished
      setSession(finished)
      useActivitySessionStore.getState().clear()
      const summary = selectActivitySummary(finished, plan)
      const durationSeconds = current.startedAt
        ? Math.max(0, Math.round((Date.parse(at) - Date.parse(current.startedAt)) / 1000))
        : 0
      if (plan.activity.kind === 'lesson') {
        emitEvent({
          event: 'lesson_completed',
          courseId: plan.activity.courseId ?? '',
          lessonId: plan.activity.id,
          ...summary,
          durationSeconds,
        })
      } else {
        emitEvent({
          event: 'challenge_completed',
          challengeId: plan.activity.id,
          ...summary,
          durationSeconds,
        })
      }
    },
    [plan],
  )

  if (awaitingResume || session.phase === 'intro') {
    const conceptNames = plan.activity.conceptIds.map(
      (id) => appConfig.concepts.find((concept) => concept.id === id)?.title ?? id,
    )
    return (
      <ActivityIntro
        plan={plan}
        conceptNames={conceptNames}
        canResume={awaitingResume}
        onStart={() => {
          const resumed = awaitingResume
          setAwaitingResume(false)
          transition({ type: resumed ? 'resume' : 'start', at: new Date().toISOString() })
          emitStarted(resumed)
        }}
        onRestart={() => {
          setAwaitingResume(false)
          transition({ type: 'restart', at: new Date().toISOString() })
          emitStarted(false)
        }}
      />
    )
  }

  if (session.phase === 'complete') {
    const summary = selectActivitySummary(session, plan)
    return (
      <CompletionSummary
        title={plan.activity.title}
        summary={summary}
        personalBest={previousBestScore === null || summary.score > previousBestScore}
        onContinue={() => navigate(continuePath)}
        onReplay={() => {
          const restarted = sessionReducer(createActivitySession(plan), {
            type: 'start',
            at: new Date().toISOString(),
          })
          sessionRef.current = restarted
          setSession(restarted)
          useActivitySessionStore.getState().save(restarted)
          viewed.current.clear()
          emitStarted(false)
        }}
      />
    )
  }

  if (!step || !stepProgress) return null

  const feedbackCorrect = stepProgress.lastCorrect === true
  const feedbackStatus: FeedbackStatus = feedbackCorrect
    ? 'correct'
    : (stepProgress.lastScore ?? 0) > 0
      ? 'partial'
      : 'incorrect'
  const reviewEvaluation = evaluatePrimitive(step.primitive, stepProgress.response)
  const feedbackMessage = stepProgress.lastTimedOut
    ? "Time's up."
    : ((feedbackCorrect ? step.primitive.feedback.correct : step.primitive.feedback.incorrect) ??
      (typeof step.primitive.content.explanation === 'string'
        ? step.primitive.content.explanation
        : null))
  const canRetry = !stepProgress.completed && step.retry && stepProgress.attempts < step.maxAttempts

  const handleContinue = () => {
    flushDraft()
    if (session.stepIndex >= plan.steps.length - 1) {
      finish(sessionRef.current)
    } else {
      transition({ type: 'continue', stepCount: plan.steps.length })
    }
  }

  return (
    <>
      <StepFrame
        title={`${plan.activity.title}: ${step.primitive.type.replaceAll('_', ' ')}`}
        definitionLabel={step.label}
        progress={selectProgressFraction(session, plan) * 100}
        layout={step.layout}
        onExit={() => navigate(exitPath)}
        timer={
          session.phase === 'step' && attemptTimer ? (
            <TimerBadge
              key={`${step.primitive.id}:${stepProgress.attempts}`}
              seconds={attemptTimer.seconds}
              mode={attemptTimer.mode}
              announcementThresholds={appConfig.product.player.timerAnnouncements}
            />
          ) : undefined
        }
        footer={
          session.phase === 'step' && stepProgress.completed ? (
            <Button onClick={handleContinue}>Continue</Button>
          ) : undefined
        }
      >
        {session.phase === 'feedback' ? (
          <div className="space-y-6">
            <PrimitiveRenderer
              key={`${step.primitive.id}:${stepProgress.attempts}:review`}
              primitive={step.primitive}
              attempt={stepProgress.attempts}
              mode="review"
              review={{
                response: stepProgress.response,
                evaluation: reviewEvaluation,
                revealAnswer: shouldRevealAnswer(appConfig.product.player.revealAnswer, {
                  attempt: stepProgress.attempts,
                  maxAttempts: step.maxAttempts,
                  retry: step.retry,
                  correct: feedbackCorrect,
                }),
              }}
              draft={stepProgress.draft}
              disabled
              onDraftChange={() => undefined}
              onComplete={() => undefined}
              onInteract={() => undefined}
              onSubmit={() => undefined}
            />
            <FeedbackPanel
              status={feedbackStatus}
              message={feedbackMessage}
              source={step.primitive.source}
              canRetry={canRetry}
              onRetry={() => transition({ type: 'retry' })}
              onContinue={handleContinue}
            />
          </div>
        ) : (
          <PrimitiveRenderer
            key={`${step.primitive.id}:${stepProgress.attempts}`}
            primitive={step.primitive}
            attempt={stepProgress.attempts}
            mode="interactive"
            draft={stepProgress.draft}
            onDraftChange={(draft) => queueDraft(step.primitive.id, draft)}
            onComplete={markComplete}
            onInteract={(interaction) => {
              const key = 'key' in interaction ? (interaction.key ?? interaction.name) : undefined
              const nextReportedMediaProgress =
                interaction.name === 'media_progress' && 'fraction' in interaction
                  ? interaction.fraction
                  : undefined
              const previousMediaProgress =
                mediaProgress.current[step.primitive.id] ?? stepProgress.mediaProgress
              const interactionKeys =
                key && !stepProgress.interactionKeys.includes(key)
                  ? [...stepProgress.interactionKeys, key]
                  : stepProgress.interactionKeys
              const nextMediaProgress =
                nextReportedMediaProgress === undefined
                  ? stepProgress.mediaProgress
                  : Math.max(previousMediaProgress, nextReportedMediaProgress)
              if (nextReportedMediaProgress !== undefined) {
                mediaProgress.current[step.primitive.id] = nextMediaProgress
              }
              const completed = isPrimitiveComplete(step.primitive, {
                attempts: stepProgress.attempts,
                correct: stepProgress.lastCorrect,
                interactionKeys,
                explorableKeys: step.explorableKeys,
                mediaProgress: nextMediaProgress,
                mediaCompletionThreshold: appConfig.product.player.mediaCompletionThreshold,
                reportedComplete: false,
                retry: step.retry,
                maxAttempts: step.maxAttempts,
              })
              transition({
                type: 'interact',
                primitiveId: step.primitive.id,
                key,
                mediaProgress: nextReportedMediaProgress,
                completed,
              })
              const eventContext = {
                activityKind: plan.activity.kind,
                activityId: plan.activity.id,
                primitiveId: step.primitive.id,
                primitiveType: step.primitive.type,
              }
              for (const event of mapInteractionToEvents(
                eventContext,
                interaction,
                previousMediaProgress,
              )) {
                emitEvent(event)
              }
              if (completed && !stepProgress.completed) {
                emitEvent({
                  event: 'primitive_completed',
                  activityKind: plan.activity.kind,
                  activityId: plan.activity.id,
                  primitiveId: step.primitive.id,
                  primitiveType: step.primitive.type,
                  stepIndex: session.stepIndex,
                })
              }
            }}
            onSubmit={(response) => submitResponse(response)}
          />
        )}
      </StepFrame>
      <ExitConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
        onExit={() => {
          if (plan.activity.kind === 'lesson') {
            emitEvent({
              event: 'lesson_exited',
              courseId: plan.activity.courseId ?? '',
              lessonId: plan.activity.id,
              stepIndex: session.stepIndex,
            })
          }
          if (blocker.state === 'blocked') blocker.proceed()
        }}
      />
    </>
  )
}
