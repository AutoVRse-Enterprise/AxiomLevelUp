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
import { FeedbackPanel } from '@/player/FeedbackPanel'
import { StepFrame } from '@/player/StepFrame'
import { evaluatePrimitive } from '@/primitives/evaluators'
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
  const [session, setSession] = useState(() =>
    useActivitySessionStore.getState().loadForPlan(plan),
  )
  const [awaitingResume, setAwaitingResume] = useState(
    session.startedAt !== null && session.phase !== 'intro' && session.phase !== 'complete',
  )
  const viewed = useRef(new Set<string>())
  const blocker = useBlocker(
    session.startedAt !== null && session.phase !== 'complete',
  )

  const transition = useCallback((action: SessionAction) => {
    setSession((current) => {
      const next = sessionReducer(current, action)
      useActivitySessionStore.getState().save(next)
      return next
    })
  }, [])

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

  const finish = useCallback(
    (current: ActivitySession) => {
      const at = new Date().toISOString()
      const finished = sessionReducer(current, { type: 'finish', at })
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
  const feedbackMessage =
    (feedbackCorrect ? step.primitive.feedback.correct : step.primitive.feedback.incorrect) ??
    (typeof step.primitive.content.explanation === 'string'
      ? step.primitive.content.explanation
      : null)
  const canRetry =
    !stepProgress.completed &&
    step.retry &&
    stepProgress.attempts < step.maxAttempts

  const handleContinue = () => {
    if (session.stepIndex >= plan.steps.length - 1) {
      finish(session)
    } else {
      transition({ type: 'continue', stepCount: plan.steps.length })
    }
  }

  return (
    <>
      <StepFrame
        title={`${plan.activity.title}: ${step.primitive.type.replaceAll('_', ' ')}`}
        progress={selectProgressFraction(session, plan) * 100}
        onExit={() => navigate(exitPath)}
        footer={
          session.phase === 'step' && stepProgress.completed ? (
            <Button onClick={handleContinue}>Continue</Button>
          ) : undefined
        }
      >
        {session.phase === 'feedback' ? (
          <FeedbackPanel
            correct={feedbackCorrect}
            message={feedbackMessage}
            source={step.primitive.source}
            canRetry={canRetry}
            onRetry={() => transition({ type: 'retry' })}
            onContinue={handleContinue}
          />
        ) : (
          <PrimitiveRenderer
            key={`${step.primitive.id}:${stepProgress.attempts}`}
            primitive={step.primitive}
            attempt={stepProgress.attempts}
            onComplete={markComplete}
            onInteract={(interaction) => {
              transition({ type: 'interact', primitiveId: step.primitive.id })
              emitEvent({
                event: 'artifact_interacted',
                primitiveId: step.primitive.id,
                interaction,
              })
            }}
            onSubmit={(response) => {
              const result = evaluatePrimitive(step.primitive, response)
              const attempts = stepProgress.attempts + 1
              const completed = isPrimitiveComplete(step.primitive, {
                attempts,
                correct: result.correct,
                interactions: stepProgress.interactions,
                reportedComplete: false,
                retry: step.retry,
                maxAttempts: step.maxAttempts,
              })
              transition({
                type: 'submit',
                primitiveId: step.primitive.id,
                response,
                correct: result.correct,
                completed,
              })
              emitEvent({
                event: 'question_answered',
                activityKind: plan.activity.kind,
                activityId: plan.activity.id,
                questionId: step.primitive.id,
                primitiveType: step.primitive.type,
                conceptIds: step.primitive.conceptIds,
                correct: result.correct,
                attempt: attempts,
                xp: step.primitive.scoring.xp ?? 0,
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
            }}
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
