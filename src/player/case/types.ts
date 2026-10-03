import type { CaseAttemptRecord } from '@/content/schema'
import type { CaseScoreBreakdown } from '@/engines/cases/scoring'
import type { CaseEventStepResult } from '@/events/types'

export type CaseStepResult = CaseEventStepResult

export interface CaseAttemptResult {
  caseId: string
  attemptId: string
  breakdown: CaseScoreBreakdown
  stepResults: CaseStepResult[]
  completedAt: string
}

export type CaseAttemptHistoryItem = CaseAttemptRecord

export type CaseResultPresentation = Omit<CaseAttemptResult, 'breakdown'> & {
  breakdown: Pick<
    CaseScoreBreakdown,
    'anatomy' | 'diagnosis' | 'speed' | 'total' | 'durationSeconds' | 'openedClueIds'
  > &
    Partial<
      Pick<
        CaseScoreBreakdown,
        'perStepSpeed' | 'caseSpeed' | 'speedScored' | 'timingMode' | 'weights'
      >
    > & {
      clueCostPoints?: number
    }
  actualAwardedXp?: number | null
  resultVersion: 5 | 6
}

export function presentLiveCaseResult(
  result: CaseAttemptResult,
  persistedAttempt?: CaseAttemptRecord,
): CaseResultPresentation {
  return {
    ...result,
    resultVersion: 6,
    breakdown: {
      anatomy: result.breakdown.anatomy,
      diagnosis: result.breakdown.diagnosis,
      speed: result.breakdown.speed,
      perStepSpeed: result.breakdown.perStepSpeed,
      caseSpeed: result.breakdown.caseSpeed,
      speedScored: result.breakdown.speedScored,
      timingMode: result.breakdown.timingMode,
      clueCostPoints: result.breakdown.penalty,
      total: result.breakdown.total,
      weights: result.breakdown.weights,
      durationSeconds: result.breakdown.durationSeconds,
      openedClueIds: result.breakdown.openedClueIds,
    },
    actualAwardedXp:
      persistedAttempt?.resultVersion === 6 ? persistedAttempt.actualAwardedXp : undefined,
  }
}

export function presentCaseAttemptRecord(
  caseId: string,
  attempt: CaseAttemptRecord,
): CaseResultPresentation {
  const details =
    attempt.resultVersion === 6
      ? {
          perStepSpeed: attempt.perStepSpeed,
          caseSpeed: attempt.caseSpeed,
          speedScored: attempt.speedScored,
          timingMode: attempt.timingMode,
          clueCostPoints: attempt.clueCostPoints,
          weights: attempt.weights,
        }
      : {}

  return {
    caseId,
    attemptId: attempt.attemptId,
    resultVersion: attempt.resultVersion,
    breakdown: {
      anatomy: attempt.anatomy,
      diagnosis: attempt.diagnosis,
      speed: attempt.speed,
      total: attempt.total,
      durationSeconds: attempt.durationSeconds,
      openedClueIds: attempt.openedClueIds,
      ...details,
    },
    stepResults: attempt.stepResults,
    completedAt: attempt.completedAt,
    actualAwardedXp: attempt.resultVersion === 6 ? attempt.actualAwardedXp : undefined,
  }
}
