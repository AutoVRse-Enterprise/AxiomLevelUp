import type { PrimitiveInteraction } from '@/primitives/types'

export type MediaProgressMilestone = 25 | 50 | 75 | 100

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
  primitive_viewed: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    primitiveId: string
    primitiveType: string
  }
  primitive_completed: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    primitiveId: string
    primitiveType: string
    stepIndex: number
  }
  artifact_interacted: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    primitiveId: string
    primitiveType: string
    interaction: PrimitiveInteraction
  }
  question_answered: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    questionId: string
    primitiveType: string
    conceptIds: string[]
    score: number
    correct: boolean
    attempt: number
    difficulty: 'foundation' | 'intermediate' | 'advanced'
    timedOut?: boolean
  }
  scenario_decision_made: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    primitiveId: string
    primitiveType: string
    nodeId: string
    choiceId: string
    decisionIndex: number
  }
  media_progressed: {
    activityKind: 'lesson' | 'challenge'
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
  activityKind: 'lesson' | 'challenge'
  activityId: string
  primitiveId: string
  primitiveType: string
}

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
