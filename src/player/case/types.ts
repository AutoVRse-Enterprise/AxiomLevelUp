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

export interface CaseAttemptHistoryItem {
  attemptId: string
  total: number
  anatomy: number
  diagnosis: number
  speed: number
  durationSeconds: number
  openedClueIds: string[]
  completedAt: string
}
