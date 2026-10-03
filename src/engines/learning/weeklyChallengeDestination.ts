import type { ContentRegistry } from '@/content/loader'
import type { AchievementCriterion, AppConfig, Course, Lesson } from '@/content/schema'
import type { LearnerData } from '@/state/learnerStore'
import { selectCourseSummary, selectLessonAvailability } from '@/state/selectors/viewModels'

type WeeklyChallenge = AppConfig['challenges'][number]
type ResolverState = Pick<LearnerData, 'lessonProgress' | 'caseProgress' | 'caseAttempts'>

export interface WeeklyChallengeDestination {
  to: string
  context: string
}

function eligibleLesson(
  state: ResolverState,
  registry: ContentRegistry,
  matches: (lesson: Lesson, course: Course) => boolean,
) {
  const candidates = registry.catalogCourses.flatMap((course) =>
    course.lessons
      .filter((lesson) => matches(lesson, course))
      .flatMap((lesson) => {
        const courseSummary = selectCourseSummary(
          state,
          course,
          registry.lessonById,
          registry.courseById,
        )
        const availability = selectLessonAvailability(state, lesson, registry.lessonById)
        if (
          courseSummary.status === 'locked' ||
          availability.status === 'locked' ||
          availability.status === 'completed'
        ) {
          return []
        }
        return [{ course, lesson, status: availability.status }]
      }),
  )

  return (
    candidates.find(({ status }) => status === 'in_progress') ??
    candidates.find(({ status }) => status === 'new') ??
    candidates.find(({ status }) => status === 'available') ??
    null
  )
}

function lessonDestination(
  state: ResolverState,
  registry: ContentRegistry,
  matches: (lesson: Lesson, course: Course) => boolean,
): WeeklyChallengeDestination | null {
  const candidate = eligibleLesson(state, registry, matches)
  return candidate
    ? {
        to: `/learn/courses/${candidate.course.id}/lessons/${candidate.lesson.id}`,
        context: `Next: ${candidate.lesson.title}`,
      }
    : null
}

function criterionDestination(
  criterion: AchievementCriterion,
  challengeId: string,
  state: ResolverState,
  registry: ContentRegistry,
): WeeklyChallengeDestination | null {
  switch (criterion.type) {
    case 'lessons_completed':
      return lessonDestination(state, registry, (lesson, course) => {
        if (criterion.lessonIds && !criterion.lessonIds.includes(lesson.id)) return false
        if (criterion.courseIds && !criterion.courseIds.includes(course.id)) return false
        return !criterion.difficulties || criterion.difficulties.includes(lesson.difficulty)
      })
    case 'course_completed':
      return lessonDestination(
        state,
        registry,
        (_, course) => !criterion.courseIds || criterion.courseIds.includes(course.id),
      )
    case 'perfect_lessons':
      return lessonDestination(state, registry, () => true)
    case 'first_attempt_correct':
      return lessonDestination(state, registry, (lesson) => {
        if (
          criterion.conceptIds &&
          !criterion.conceptIds.some((conceptId) => lesson.conceptIds.includes(conceptId))
        ) {
          return false
        }
        return (
          !criterion.primitiveTypes ||
          lesson.primitives.some(({ type }) => criterion.primitiveTypes?.includes(type))
        )
      })
    case 'primitive_reward':
      return lessonDestination(state, registry, (lesson) =>
        lesson.primitives.some(({ reward }) => reward?.id === criterion.rewardId),
      )
    case 'cases_completed': {
      const candidate =
        registry.cases.find(
          (caseDoc) =>
            (!criterion.tiers || criterion.tiers.includes(caseDoc.tier)) &&
            (state.caseProgress[caseDoc.id]?.completions ?? 0) === 0,
        ) ??
        registry.cases.find((caseDoc) => !criterion.tiers || criterion.tiers.includes(caseDoc.tier))
      return candidate
        ? { to: `/learn/cases/${candidate.id}`, context: `Next: ${candidate.title}` }
        : null
    }
    case 'case_component_score':
    case 'case_duration': {
      const caseId = registry.appConfig.caseLab?.featuredCaseId
      const candidate = caseId ? registry.caseById.get(caseId) : registry.cases[0]
      return candidate
        ? { to: `/learn/cases/${candidate.id}`, context: `Practice: ${candidate.title}` }
        : null
    }
    case 'challenges_completed': {
      const candidate = registry.appConfig.challenges.find(
        ({ id, type, items }) =>
          id !== challengeId &&
          (!criterion.challengeIds || criterion.challengeIds.includes(id)) &&
          (type === 'daily' || (items?.length ?? 0) > 0),
      )
      return candidate
        ? { to: `/challenge/${candidate.id}/play`, context: `Next: ${candidate.title}` }
        : { to: '/challenge', context: 'Choose a challenge' }
    }
    case 'streak_days':
    case 'weekly_goals_met':
      return null
  }
}

export function resolveWeeklyChallengeDestination(
  challenge: WeeklyChallenge,
  state: ResolverState,
  registry: ContentRegistry,
): WeeklyChallengeDestination {
  const destination = challenge.progressRule
    ? criterionDestination(challenge.progressRule, challenge.id, state, registry)
    : null

  return destination ?? { to: '/learn', context: 'Choose a learning activity' }
}
