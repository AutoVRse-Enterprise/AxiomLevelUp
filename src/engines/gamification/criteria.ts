import type { AchievementCriterion } from '@/content/schema'
import type { ContentRegistry } from '@/content/loader'
import type { LearnerData } from '@/state/learnerStore'

type CriterionState = Pick<
  LearnerData,
  'lessonProgress' | 'caseProgress' | 'caseAttempts' | 'gamification' | 'streak'
>

export interface CriterionProgress {
  current: number
  target: number
  percentage: number
  complete: boolean
}

function completedLessons(
  state: CriterionState,
  registry: ContentRegistry,
  criterion: Extract<AchievementCriterion, { type: 'lessons_completed' }>,
) {
  return [...registry.lessonById.values()].filter((lesson) => {
    if (state.lessonProgress[lesson.id]?.status !== 'completed') return false
    if (criterion.lessonIds && !criterion.lessonIds.includes(lesson.id)) return false
    if (
      criterion.courseIds &&
      !criterion.courseIds.some((courseId) =>
        registry.courseById.get(courseId)?.lessons.some(({ id }) => id === lesson.id),
      )
    ) {
      return false
    }
    return !criterion.difficulties || criterion.difficulties.includes(lesson.difficulty)
  }).length
}

function completedCourses(
  state: CriterionState,
  registry: ContentRegistry,
  criterion: Extract<AchievementCriterion, { type: 'course_completed' }>,
) {
  return [...registry.courseById.values()].filter((course) => {
    if (criterion.courseIds && !criterion.courseIds.includes(course.id)) return false
    const completed = course.lessons.filter(
      ({ id }) => state.lessonProgress[id]?.status === 'completed',
    ).length
    return course.completionRequirement.mode === 'all_lessons'
      ? completed === course.lessons.length
      : completed >= (course.completionRequirement.minimumLessons ?? course.lessons.length)
  }).length
}

function completedCases(
  state: CriterionState,
  registry: ContentRegistry,
  criterion: Extract<AchievementCriterion, { type: 'cases_completed' }>,
) {
  return [...registry.caseById.values()].filter((caseDocument) => {
    if ((state.caseProgress[caseDocument.id]?.completions ?? 0) === 0) return false
    return !criterion.tiers || criterion.tiers.includes(caseDocument.tier)
  }).length
}

function openedOptionalClueCount(
  registry: ContentRegistry,
  caseId: string,
  openedClueIds: readonly string[],
) {
  const optionalIds = new Set(
    registry.caseById
      .get(caseId)
      ?.clues.filter(({ essential }) => !essential)
      .map(({ id }) => id) ?? [],
  )
  return new Set(openedClueIds.filter((id) => optionalIds.has(id))).size
}

export function evaluateCriterion(
  criterion: AchievementCriterion,
  state: CriterionState,
  registry: ContentRegistry,
): CriterionProgress {
  let current = 0
  const target =
    criterion.type === 'primitive_reward' || criterion.type === 'case_duration'
      ? 1
      : criterion.type === 'case_component_score'
        ? criterion.min
        : criterion.count
  switch (criterion.type) {
    case 'lessons_completed':
      current = completedLessons(state, registry, criterion)
      break
    case 'course_completed':
      current = completedCourses(state, registry, criterion)
      break
    case 'perfect_lessons':
      current = state.gamification.counters.perfectLessons
      break
    case 'streak_days':
      current = state.streak.currentDays
      break
    case 'weekly_goals_met':
      current = state.gamification.counters.weeklyGoalsMet
      break
    case 'challenges_completed':
      current = criterion.challengeIds
        ? criterion.challengeIds.reduce(
            (total, id) => total + (state.gamification.counters.challengeCompletions[id] ?? 0),
            0,
          )
        : Object.values(state.gamification.counters.challengeCompletions).reduce(
            (total, count) => total + count,
            0,
          )
      break
    case 'first_attempt_correct':
      if (criterion.primitiveTypes) {
        current = criterion.primitiveTypes.reduce(
          (total, type) =>
            total + (state.gamification.counters.firstAttemptCorrectByType[type] ?? 0),
          0,
        )
      } else if (criterion.conceptIds) {
        current = criterion.conceptIds.reduce(
          (total, id) =>
            total + (state.gamification.counters.firstAttemptCorrectByConcept[id] ?? 0),
          0,
        )
      } else {
        current = state.gamification.counters.firstAttemptCorrect
      }
      break
    case 'primitive_reward':
      current = state.gamification.digitalRewards.some(({ id }) => id === criterion.rewardId)
        ? 1
        : 0
      break
    case 'cases_completed':
      current = completedCases(state, registry, criterion)
      break
    case 'case_component_score':
      current = Math.max(
        0,
        ...Object.entries(state.caseAttempts).flatMap(([caseId, attempts]) =>
          attempts
            .filter(
              (attempt) =>
                criterion.maxOptionalClues === undefined ||
                openedOptionalClueCount(registry, caseId, attempt.openedClueIds) <=
                  criterion.maxOptionalClues,
            )
            .map((attempt) => attempt[criterion.component]),
        ),
      )
      break
    case 'case_duration':
      current = Object.entries(state.caseAttempts).some(([caseId, attempts]) => {
        const targetSeconds = registry.caseById.get(caseId)?.timing?.caseTargetSeconds
        return (
          targetSeconds !== undefined &&
          attempts.some(
            ({ durationSeconds }) =>
              durationSeconds / targetSeconds <= criterion.maxRatioOfTarget,
          )
        )
      })
        ? 1
        : 0
      break
  }
  return {
    current,
    target,
    percentage: target === 0 ? 100 : Math.min(100, Math.round((current / target) * 100)),
    complete: current >= target,
  }
}
