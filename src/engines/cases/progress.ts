import type { CaseAttemptRecord } from '@/content/schema'
import type { LearnerEvent } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

export function applyCaseProgressEvent(
  state: LearnerData,
  event: LearnerEvent,
  historyLimit: number,
) {
  if (event.event !== 'case_completed') return

  const attempts = state.caseAttempts[event.caseId] ?? []
  if (attempts.some(({ attemptId }) => attemptId === event.attemptId)) return

  const previous = state.caseProgress[event.caseId] ?? {
    completions: 0,
    bestTotal: null,
    lastCompletedAt: null,
  }
  const record: CaseAttemptRecord = {
    attemptId: event.attemptId,
    tier: event.tier,
    total: event.breakdown.total,
    anatomy: event.breakdown.anatomy,
    diagnosis: event.breakdown.diagnosis,
    speed: event.breakdown.speed,
    durationSeconds: event.durationSeconds,
    openedClueIds: [...new Set(event.openedClueIds)],
    stepResults: structuredClone(event.stepResults),
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
}
