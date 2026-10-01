interface EventPayloads {
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
  artifact_interacted: { primitiveId: string; interaction: string }
  question_answered: {
    activityKind: 'lesson' | 'challenge'
    activityId: string
    questionId: string
    primitiveType: string
    conceptIds: string[]
    correct: boolean
    attempt: number
    xp: number
  }
  dicom_slice_changed: { primitiveId: string; sliceIndex: number }
  dicom_window_changed: { primitiveId: string; preset?: string; center: number; width: number }
  dicom_region_selected: { primitiveId: string; x: number; y: number; correct?: boolean }
  measurement_created: { primitiveId: string; value: number; unit: string }
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
  course_downloaded: { courseId: string; bytes: number }
  xp_awarded: { amount: number; reason: string }
}

export type LearnerEventName = keyof EventPayloads

export type LearnerEventDraft = {
  [Name in LearnerEventName]: { event: Name } & EventPayloads[Name]
}[LearnerEventName]

export type LearnerEvent = LearnerEventDraft & {
  id: string
  occurredAt: string
}
