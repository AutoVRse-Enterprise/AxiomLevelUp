interface EventPayloads {
  app_opened: { source: 'client' }
  course_opened: { courseId: string }
  lesson_started: { courseId: string; lessonId: string }
  primitive_viewed: { lessonId: string; primitiveId: string; primitiveType: string }
  artifact_interacted: { primitiveId: string; interaction: string }
  question_answered: {
    questionId: string
    conceptIds: string[]
    correct: boolean
    attempt: number
    xp: number
  }
  dicom_slice_changed: { primitiveId: string; sliceIndex: number }
  dicom_window_changed: { primitiveId: string; preset?: string; center: number; width: number }
  dicom_region_selected: { primitiveId: string; x: number; y: number; correct?: boolean }
  measurement_created: { primitiveId: string; value: number; unit: string }
  lesson_completed: { courseId: string; lessonId: string; score: number }
  challenge_completed: { challengeId: string; score: number }
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
