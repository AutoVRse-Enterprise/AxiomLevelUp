import type { CaseAttemptRecord } from '@/content/schema'
import type { CaseScoreBreakdown } from '@/engines/cases/scoring'
import type { CaseProgress } from '@/engines/learning/session'
import type { CaseEventStepResult } from '@/events/types'

export type CaseStepResult = CaseEventStepResult

export interface CaseAttemptResult {
  caseId: string
  attemptId: string
  breakdown: CaseScoreBreakdown
  stepResults: CaseStepResult[]
  reviewedClueIds: string[]
  evidence: CaseProgress['evidence']
  differential: CaseProgress['differential']
  differentialCheckpoints: CaseProgress['differentialCheckpoints']
  timeoutCreditApplied: boolean
  completedAt: string
}

export type CaseAttemptHistoryItem = CaseAttemptRecord

export type CaseResultPresentation = Omit<
  CaseAttemptResult,
  | 'breakdown'
  | 'reviewedClueIds'
  | 'evidence'
  | 'differential'
  | 'differentialCheckpoints'
  | 'timeoutCreditApplied'
> & {
  breakdown: Pick<
    CaseScoreBreakdown,
    'anatomy' | 'diagnosis' | 'speed' | 'total' | 'durationSeconds' | 'openedClueIds'
  > &
    Partial<
      Pick<
        CaseScoreBreakdown,
        | 'perStepSpeed'
        | 'caseSpeed'
        | 'speedModel'
        | 'speedEligibility'
        | 'speedScored'
        | 'timingMode'
        | 'weights'
      >
    > & {
      clueCostPoints?: number
    }
  actualAwardedXp?: number | null
  reviewedClueIds?: string[]
  evidence?: CaseProgress['evidence']
  differential?: CaseProgress['differential']
  differentialCheckpoints?: CaseProgress['differentialCheckpoints']
  timeoutCreditApplied?: boolean
  resultVersion: 5 | 6 | 7 | 8
}

export function presentLiveCaseResult(
  result: CaseAttemptResult,
  persistedAttempt?: CaseAttemptRecord,
): CaseResultPresentation {
  return {
    ...result,
    resultVersion: 8,
    breakdown: {
      anatomy: result.breakdown.anatomy,
      diagnosis: result.breakdown.diagnosis,
      speed: result.breakdown.speed,
      perStepSpeed: result.breakdown.perStepSpeed,
      caseSpeed: result.breakdown.caseSpeed,
      speedModel: result.breakdown.speedModel,
      speedEligibility: result.breakdown.speedEligibility,
      speedScored: result.breakdown.speedScored,
      timingMode: result.breakdown.timingMode,
      clueCostPoints: result.breakdown.penalty,
      total: result.breakdown.total,
      weights: result.breakdown.weights,
      durationSeconds: result.breakdown.durationSeconds,
      openedClueIds: result.breakdown.openedClueIds,
    },
    actualAwardedXp:
      persistedAttempt && persistedAttempt.resultVersion !== 5
        ? persistedAttempt.actualAwardedXp
        : undefined,
  }
}

export function presentCaseAttemptRecord(
  caseId: string,
  attempt: CaseAttemptRecord,
): CaseResultPresentation {
  const details =
    attempt.resultVersion !== 5
      ? {
          perStepSpeed: attempt.perStepSpeed,
          caseSpeed: attempt.caseSpeed,
          speedScored: attempt.speedScored,
          timingMode: attempt.timingMode,
          clueCostPoints: attempt.clueCostPoints,
          weights: attempt.weights,
          ...(attempt.resultVersion === 7 || attempt.resultVersion === 8
            ? {
                speedModel: attempt.speedModel,
                speedEligibility: attempt.speedEligibility,
              }
            : {}),
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
    ...(attempt.resultVersion === 7 || attempt.resultVersion === 8
      ? {
          reviewedClueIds: attempt.reviewedClueIds,
          evidence: attempt.evidence,
          differential: attempt.differential,
          timeoutCreditApplied: attempt.timeoutCreditApplied,
          ...(attempt.resultVersion === 8
            ? { differentialCheckpoints: attempt.differentialCheckpoints }
            : {}),
        }
      : {}),
    completedAt: attempt.completedAt,
    actualAwardedXp: attempt.resultVersion !== 5 ? attempt.actualAwardedXp : undefined,
  }
}
