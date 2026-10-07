import type { PrimitiveInteraction } from '@/primitives/types'
import type { AnatomyVector3 } from '@/anatomy3d/viewer/controller'
import type { CaseDocument, GameMechanic } from '@/content/schema'
import type { CaseClueOpenContext, CaseClueReviewMethod } from '@/engines/cases/clues'
import type { CaseScoreBreakdown } from '@/engines/cases/scoring'
import type { CaseProgress } from '@/engines/learning/session'

export type MediaProgressMilestone = 25 | 50 | 75 | 100
export type EventActivityKind = 'lesson' | 'challenge' | 'case' | 'game'

export type GameRunMode = 'standard' | 'daily' | 'challenge' | 'expert'

export interface GameEventRoundResult {
  slotId: string
  roundId: string
  mechanic: GameMechanic
  accuracy: number
  correct: boolean
  points: number
  basePoints: number
  speedBonus: number
  clueCost: number
  elapsedMs: number
  timedOut: boolean
}

export interface CaseEventStepResult {
  primitiveId: string
  firstAttemptScore: number
  elapsedMs?: number
  timedOut: boolean
  response: unknown
}

export interface EventPayloads {
  app_opened: { source: 'client' }
  pathway_opened: { pathwayId: string }
  course_opened: { courseId: string }
  lesson_started: {
    courseId: string
    lessonId: string
    attempt: number
    resumed: boolean
  }
  challenge_started: { challengeId: string; attempt: number; resumed: boolean }
  case_opened: { caseId: string }
  case_started: {
    caseId: string
    attempt: number
    resumed: boolean
    tier: CaseDocument['tier']
  }
  case_clue_opened: {
    caseId: string
    clueId: string
    essential: boolean
    stageId: string
    context: CaseClueOpenContext
    beforeResponse: boolean
  }
  case_clue_reviewed: {
    caseId: string
    clueId: string
    primitiveId: string
    primitiveType: string
    stageId: string
    method: CaseClueReviewMethod
  }
  case_evidence_pinned: {
    caseId: string
    evidence: { kind: 'clue' | 'finding'; id: string }
    pinned: boolean
  }
  case_hypothesis_updated: {
    caseId: string
    hypothesisId: string
    confidence: 'unlikely' | 'possible' | 'likely'
    checkpointId?: string
  }
  case_stage_completed: { caseId: string; stageId: string; stageIndex: number }
  case_completed: {
    caseId: string
    attemptId: string
    tier: CaseDocument['tier']
    breakdown: CaseScoreBreakdown
    durationSeconds: number
    openedClueIds: string[]
    stepResults: CaseEventStepResult[]
    reviewedClueIds: string[]
    evidence: CaseProgress['evidence']
    differential: CaseProgress['differential']
    differentialCheckpoints: CaseProgress['differentialCheckpoints']
    timeoutCreditApplied: boolean
    challengeId?: string
  }
  game_opened: { gameId: string; source: 'hub' | 'link' | 'expert' | 'daily' }
  game_started: {
    gameId: string
    runId: string
    difficulty: string
    seed: number
    mode: GameRunMode
    challengeToken?: string
  }
  game_round_started: {
    runId: string
    slotId: string
    roundId: string
    mechanic: GameMechanic
  }
  game_clue_revealed: {
    runId: string
    roundId: string
    clueId: string
    paid: boolean
    cost: number
  }
  game_round_answered: {
    runId: string
    roundId: string
    accuracy: number
    correct: boolean
    points: number
    speedBonus: number
    elapsedMs: number
    timedOut: boolean
  }
  game_completed: {
    runId: string
    gameId: string
    difficulty: string
    seed: number
    mode: GameRunMode
    total: number
    correctCount: number
    durationSeconds: number
    roundResults: GameEventRoundResult[]
    challengeToken?: string
  }
  game_abandoned: { runId: string; slotIndex: number }
  game_shared: { runId: string; channel: 'native' | 'copy' | 'mock' }
  game_challenge_opened: { token: string; fromName: string; targetScore: number }
  primitive_viewed: {
    activityKind: EventActivityKind
    activityId: string
    primitiveId: string
    primitiveType: string
  }
  primitive_completed: {
    activityKind: EventActivityKind
    activityId: string
    primitiveId: string
    primitiveType: string
    stepIndex: number
  }
  artifact_interacted: {
    activityKind: EventActivityKind
    activityId: string
    primitiveId: string
    primitiveType: string
    interaction: PrimitiveInteraction
  }
  question_answered: {
    activityKind: EventActivityKind
    activityId: string
    questionId: string
    primitiveType: string
    conceptIds: string[]
    score: number
    correct: boolean
    attempt: number
    difficulty: 'foundation' | 'intermediate' | 'advanced'
    timedOut?: boolean
    elapsedMs?: number
  }
  scenario_decision_made: {
    activityKind: EventActivityKind
    activityId: string
    primitiveId: string
    primitiveType: string
    nodeId: string
    choiceId: string
    decisionIndex: number
  }
  media_progressed: {
    activityKind: EventActivityKind
    activityId: string
    primitiveId: string
    primitiveType: string
    milestone: MediaProgressMilestone
  }
  dicom_slice_changed: DicomEventContext & { slice: number }
  dicom_window_changed: DicomEventContext & {
    presetId?: string
    center: number
    width: number
  }
  dicom_region_selected: DicomEventContext & { slice: number; x: number; y: number }
  measurement_created: DicomEventContext & {
    slice: number
    value: number
    unit: string
  }
  dicom_viewer_loaded: DicomEventContext & { firstImageMs: number; sliceCount: number }
  dicom_viewer_failed: DicomEventContext & { reason: string }
  anatomy_structure_selected: AnatomyEventContext & { structureId: string }
  anatomy_waypoint_reached: AnatomyEventContext & { waypointId: string }
  anatomy_finding_inspected: AnatomyEventContext & { findingId: string }
  anatomy_view_changed: AnatomyEventContext & {
    position: AnatomyVector3
    target: AnatomyVector3
    waypointId: string | null
    endoscopic: boolean
  }
  anatomy_viewer_loaded: AnatomyEventContext & {
    loadMs: number
    meshCount: number
    triangleCount: number
  }
  anatomy_viewer_failed: AnatomyEventContext & { reason: string }
  lesson_exited: { courseId: string; lessonId: string; stepIndex: number }
  lesson_completed: {
    courseId: string
    lessonId: string
    score: number
    accuracy: number
    correctCount: number
    scoredCount: number
    durationSeconds: number
  }
  course_completed: { courseId: string }
  challenge_opened: { challengeId: string }
  challenge_completed: {
    challengeId: string
    score: number
    accuracy: number
    correctCount: number
    scoredCount: number
    durationSeconds: number
  }
  badge_unlocked: { badgeId: string }
  level_up: { from: number; to: number }
  stars_awarded: { lessonId: string; stars: number }
  streak_updated: { currentDays: number; qualifyingDate: string }
  weekly_goal_met: { weekStart: string; completedDays: number }
  mastery_updated: { conceptId: string; previous: number; current: number; delta: number }
  reward_granted: {
    rewardType: 'badge' | 'certificate' | 'points' | 'recognition'
    rewardId: string
  }
  course_download_started: { courseId: string; bytes: number }
  course_downloaded: { courseId: string; bytes: number }
  course_download_failed: {
    courseId: string
    reason: 'network' | 'integrity' | 'quota' | 'cancelled'
  }
  course_download_removed: { courseId: string; bytes: number }
  xp_awarded: {
    amount: number
    reason:
      | 'question'
      | 'lesson_complete'
      | 'lesson_perfect'
      | 'revision'
      | 'challenge_complete'
      | 'challenge_perfect'
      | 'case_complete'
      | 'case_perfect'
      | 'weekly_target'
      | 'badge'
      | 'demo'
    sourceId: string
  }
  celebration_dismissed: { celebrationId: string }
  demo_command:
    | { command: 'grant_xp'; amount: number }
    | { command: 'simulate_badge'; badgeId?: string }
    | { command: 'simulate_level_up' }
    | { command: 'unlock_all' }
}

interface DicomEventContext {
  activityKind: EventActivityKind
  activityId: string
  primitiveId: string
  primitiveType: string
}

type AnatomyEventContext = DicomEventContext

export type LearnerEventName = keyof EventPayloads

export type LearnerEventDraft = {
  [Name in LearnerEventName]: { event: Name } & EventPayloads[Name]
}[LearnerEventName]

export type LearnerEvent = LearnerEventDraft & {
  id: string
  occurredAt: string
}

export type LearnerOutputEventName =
  | 'badge_unlocked'
  | 'level_up'
  | 'stars_awarded'
  | 'streak_updated'
  | 'weekly_goal_met'
  | 'mastery_updated'
  | 'reward_granted'
  | 'xp_awarded'

export function isLearnerOutputEvent(event: LearnerEvent): boolean {
  const outputs: ReadonlySet<LearnerOutputEventName> = new Set([
    'badge_unlocked',
    'level_up',
    'stars_awarded',
    'streak_updated',
    'weekly_goal_met',
    'mastery_updated',
    'reward_granted',
    'xp_awarded',
  ])
  return outputs.has(event.event as LearnerOutputEventName)
}
