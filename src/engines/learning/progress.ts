import type { ContentRegistry } from '@/content/loader'
import type { LearnerSeed } from '@/content/schema'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'

export type LearningProgressState = Pick<
  LearnerSeed,
  'lessonProgress' | 'challenges' | 'stats'
>

export interface LearningProgressResult {
  state: LearningProgressState
  followUps: LearnerEventDraft[]
}

const newLessonProgress = () => ({
  status: 'new' as const,
  stars: 0,
  bestScore: null,
  attempts: 0,
  lastPrimitiveIndex: 0,
  completedAt: null,
})

function requirementMet(
  registry: ContentRegistry,
  courseId: string,
  progress: LearningProgressState['lessonProgress'],
) {
  const course = registry.courseById.get(courseId)
  if (!course) return false
  const completed = course.lessons.filter(
    (lesson) => progress[lesson.id]?.status === 'completed',
  ).length
  return course.completionRequirement.mode === 'all_lessons'
    ? completed === course.lessons.length
    : completed >= (course.completionRequirement.minimumLessons ?? course.lessons.length)
}

export function applyLearningEvent(
  current: LearningProgressState,
  event: LearnerEvent,
  registry: ContentRegistry,
): LearningProgressResult {
  const state = structuredClone(current)
  const followUps: LearnerEventDraft[] = []

  switch (event.event) {
    case 'lesson_started': {
      const previous = state.lessonProgress[event.lessonId] ?? newLessonProgress()
      state.lessonProgress[event.lessonId] = {
        ...previous,
        status: previous.status === 'completed' ? 'completed' : 'current',
        attempts: previous.attempts + (event.resumed ? 0 : 1),
      }
      break
    }
    case 'primitive_completed': {
      if (event.activityKind !== 'lesson') break
      const previous = state.lessonProgress[event.activityId] ?? newLessonProgress()
      if (previous.status !== 'completed') {
        state.lessonProgress[event.activityId] = {
          ...previous,
          status: 'current',
          lastPrimitiveIndex: Math.max(previous.lastPrimitiveIndex, event.stepIndex + 1),
        }
      }
      break
    }
    case 'question_answered':
      if (event.attempt === 1) {
        state.stats.questionsAnswered += 1
        if (event.correct) state.stats.correctAnswers += 1
      }
      break
    case 'lesson_completed': {
      const previous = state.lessonProgress[event.lessonId] ?? newLessonProgress()
      const wasComplete = previous.status === 'completed'
      const courseWasComplete = requirementMet(registry, event.courseId, current.lessonProgress)
      state.lessonProgress[event.lessonId] = {
        ...previous,
        status: 'completed',
        bestScore: Math.max(previous.bestScore ?? 0, event.score),
        lastPrimitiveIndex: 0,
        completedAt: wasComplete ? previous.completedAt : event.occurredAt,
      }
      if (!wasComplete) state.stats.lessonsCompleted += 1
      if (!courseWasComplete && requirementMet(registry, event.courseId, state.lessonProgress)) {
        followUps.push({ event: 'course_completed', courseId: event.courseId })
      }
      break
    }
    case 'course_completed':
      state.stats.coursesCompleted += 1
      break
    case 'challenge_completed': {
      const previous = state.challenges[event.challengeId] ?? {
        completed: false,
        progress: 0,
        bestScore: null,
      }
      state.challenges[event.challengeId] = {
        completed: true,
        progress: Math.max(previous.progress, event.scoredCount),
        bestScore: Math.max(previous.bestScore ?? 0, event.score),
      }
      if (!previous.completed) state.stats.challengesCompleted += 1
      break
    }
  }

  return { state, followUps }
}
