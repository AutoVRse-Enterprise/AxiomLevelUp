import type { CaseAttemptRecord } from '@/content/schema'
import { normalizeCaseResponse } from '@/engines/cases/responses'
import type { LearnerEvent } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

export function applyCaseProgressEvent(
  state: LearnerData,
  event: LearnerEvent,
  historyLimit: number,
) {
  if (event.event !== 'case_completed') return false

  const attempts = state.caseAttempts[event.caseId] ?? []
  if (attempts.some(({ attemptId }) => attemptId === event.attemptId)) return false

  const previous = state.caseProgress[event.caseId] ?? {
    completions: 0,
    bestTotal: null,
    lastCompletedAt: null,
  }
  const record: CaseAttemptRecord = {
    resultVersion: 7,
    attemptId: event.attemptId,
    tier: event.tier,
    total: event.breakdown.total,
    anatomy: event.breakdown.anatomy,
    diagnosis: event.breakdown.diagnosis,
    speed: event.breakdown.speed,
    perStepSpeed: event.breakdown.perStepSpeed,
    caseSpeed: event.breakdown.caseSpeed,
    speedModel: event.breakdown.speedModel,
    speedEligibility: structuredClone(event.breakdown.speedEligibility),
    clueCostPoints: event.breakdown.penalty,
    speedScored: event.breakdown.speedScored,
    timingMode: event.breakdown.timingMode,
    weights: structuredClone(event.breakdown.weights),
    actualAwardedXp: null,
    actualAwardedXpSource: null,
    durationSeconds: event.durationSeconds,
    openedClueIds: [...new Set(event.openedClueIds)],
    reviewedClueIds: [...new Set(event.reviewedClueIds)],
    evidence: structuredClone(event.evidence),
    differential: structuredClone(event.differential),
    timeoutCreditApplied: event.timeoutCreditApplied,
    stepResults: event.stepResults.map((step) => ({
      ...structuredClone(step),
      response: normalizeCaseResponse(step.response),
    })),
    completedAt: event.occurredAt,
  }

  state.caseAttempts[event.caseId] = [...attempts, record].slice(-historyLimit)
  state.caseProgress[event.caseId] = {
    completions: previous.completions + 1,
    bestTotal: Math.max(previous.bestTotal ?? 0, event.breakdown.total),
    lastCompletedAt: event.occurredAt,
  }
  state.gamification.counters.caseCompletions[event.caseId] =
    (state.gamification.counters.caseCompletions[event.caseId] ?? 0) + 1
  state.gamification.counters.caseCompletionsByTier[event.tier] =
    (state.gamification.counters.caseCompletionsByTier[event.tier] ?? 0) + 1
  if (previous.completions === 0) state.stats.casesCompleted += 1
  return true
}

export function attachCaseAttemptRewardResult(state: LearnerData, event: LearnerEvent) {
  if (event.event !== 'case_completed') return
  const activityResult = state.gamification.lastActivityResult
  if (
    activityResult?.activityKind !== 'case' ||
    activityResult.activityId !== event.caseId ||
    activityResult.sourceEventId !== event.id
  ) {
    return
  }

  const attempt = state.caseAttempts[event.caseId]?.find(
    (candidate) => candidate.attemptId === event.attemptId,
  )
  if (!attempt || attempt.resultVersion === 5) return
  attempt.actualAwardedXp = activityResult.xpEarned
  attempt.actualAwardedXpSource = 'gamification_activity_result'
}
