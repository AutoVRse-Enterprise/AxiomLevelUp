import type { CaseScoreBreakdown } from '@/engines/cases/scoring'

export interface CaseStepResult {
  primitiveId: string
  firstAttemptScore: number
  elapsedMs?: number
  timedOut: boolean
  response: unknown
}

export interface CaseAttemptResult {
  caseId: string
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
