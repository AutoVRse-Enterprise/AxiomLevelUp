import type { ContentRegistry } from '@/content/loader'
import type { AppConfig, Course, LearnerSeed, Lesson } from '@/content/schema'
import { periodKey } from '@/engines/gamification/calendar'
import { evaluateCriterion } from '@/engines/gamification/criteria'
import type { LearnerStore } from '@/state/learnerStore'

type LearnerState = Pick<
  LearnerStore,
  | 'learner'
  | 'xp'
  | 'weeklyGoal'
  | 'lessonProgress'
  | 'challenges'
  | 'badges'
  | 'mastery'
  | 'stats'
  | 'gamification'
>

export type LearningStatus = 'completed' | 'in_progress' | 'available' | 'locked' | 'new'

export function selectLevel(
  state: Pick<LearnerStore, 'xp'>,
  levels: AppConfig['gamification']['levels'],
) {
  return [...levels]
    .sort((a, b) => a.minimumXp - b.minimumXp)
    .reduce(
      (level, threshold) => (state.xp.total >= threshold.minimumXp ? threshold.level : level),
      1,
    )
}

export function selectLevelProgress(
  state: Pick<LearnerStore, 'xp'>,
  levels: AppConfig['gamification']['levels'],
) {
  const ordered = [...levels].sort((a, b) => a.minimumXp - b.minimumXp)
  const current =
    [...ordered].reverse().find(({ minimumXp }) => state.xp.total >= minimumXp) ?? ordered[0]
  const next = current ? ordered.find(({ level }) => level > current.level) : undefined
  const floor = current?.minimumXp ?? 0
  const range = next ? next.minimumXp - floor : 0
  return {
    level: current?.level ?? 1,
    label: current?.label,
    minimumXp: floor,
    nextLevelXp: next?.minimumXp ?? null,
    xpIntoLevel: Math.max(0, state.xp.total - floor),
    xpForLevel: range,
    percentage: next ? Math.min(100, Math.round(((state.xp.total - floor) / range) * 100)) : 100,
  }
}

export function selectLeaderboardRank(
  state: Pick<LearnerStore, 'learner' | 'xp'>,
  entries: AppConfig['leaderboard']['entries'],
) {
  const scores = entries.map((entry) => ({
    ...entry,
    weeklyXp: entry.id === state.learner.id ? state.xp.weekly : entry.weeklyXp,
  }))
  scores.sort((a, b) => b.weeklyXp - a.weeklyXp)
  const index = scores.findIndex(({ id }) => id === state.learner.id)
  return index === -1 ? null : index + 1
}

export function selectLeaderboardView(
  state: Pick<LearnerStore, 'learner' | 'xp'>,
  entries: AppConfig['leaderboard']['entries'],
  visibleWindow: number,
) {
  const rows = entries
    .map((entry) => ({
      ...entry,
      weeklyXp: entry.id === state.learner.id ? state.xp.weekly : entry.weeklyXp,
    }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      movement: entry.previousRank ? entry.previousRank - (index + 1) : 0,
      isCurrentLearner: entry.id === state.learner.id,
    }))
  const learnerIndex = rows.findIndex(({ isCurrentLearner }) => isCurrentLearner)
  if (learnerIndex < 0) return { rank: null, movement: 0, rows: rows.slice(0, visibleWindow) }
  const start = Math.max(
    0,
    Math.min(learnerIndex - Math.floor(visibleWindow / 2), rows.length - visibleWindow),
  )
  const learnerRow = rows[learnerIndex]
  return {
    rank: learnerRow?.rank ?? null,
    movement: learnerRow?.movement ?? 0,
    rows: rows.slice(start, start + visibleWindow),
  }
}

export function selectLessonAvailability(
  state: Pick<LearnerStore, 'lessonProgress'>,
  lesson: Lesson,
  lessonById: ReadonlyMap<string, Lesson>,
) {
  const progress = state.lessonProgress[lesson.id]
  const unmetPrerequisites = lesson.prerequisites
    .filter((id) => state.lessonProgress[id]?.status !== 'completed')
    .map((id) => lessonById.get(id)?.title ?? id)
  let status: LearningStatus
  if (progress?.status === 'completed') status = 'completed'
  else if (progress?.status === 'current') status = 'in_progress'
  else if (progress?.status === 'new') status = 'new'
  else status = unmetPrerequisites.length > 0 ? 'locked' : 'available'
  return { status, unmetPrerequisites, progress }
}

export function selectCourseCompletion(
  state: Pick<LearnerStore, 'lessonProgress'>,
  course: Course,
) {
  const completed = course.lessons.filter(
    (lesson) => state.lessonProgress[lesson.id]?.status === 'completed',
  ).length
  return Math.round((completed / course.lessons.length) * 100)
}

export function selectCourseSummary(
  state: Pick<LearnerStore, 'lessonProgress'>,
  course: Course,
  lessonById: ReadonlyMap<string, Lesson>,
  courseById?: ReadonlyMap<string, Course>,
) {
  const lessons = course.lessons.map((lesson) => ({
    lesson,
    ...selectLessonAvailability(state, lesson, lessonById),
  }))
  const completedCount = lessons.filter(({ status }) => status === 'completed').length
  const unmetCoursePrerequisites = course.prerequisites
    .filter((id) => {
      const prerequisite = courseById?.get(id)
      return prerequisite ? selectCourseCompletion(state, prerequisite) < 100 : true
    })
    .map((id) => courseById?.get(id)?.title ?? id)
  const next =
    lessons.find(({ status }) => status === 'in_progress') ??
    lessons.find(({ status }) => status === 'new') ??
    lessons.find(({ status }) => status === 'available')
  let status: LearningStatus = 'available'
  if (completedCount === lessons.length) status = 'completed'
  else if (unmetCoursePrerequisites.length) status = 'locked'
  else if (
    lessons.some(({ status: lessonStatus }) => lessonStatus === 'in_progress') ||
    completedCount
  )
    status = 'in_progress'
  else if (lessons.some(({ status: lessonStatus }) => lessonStatus === 'new')) status = 'new'
  return {
    course,
    lessons,
    status,
    completedCount,
    totalCount: lessons.length,
    completion: Math.round((completedCount / lessons.length) * 100),
    nextLesson: next?.lesson ?? null,
    remainingMinutes: lessons
      .filter(({ status: lessonStatus }) => lessonStatus !== 'completed')
      .reduce((total, { lesson }) => total + lesson.estimatedMinutes, 0),
    unmetCoursePrerequisites,
  }
}

export function selectContinueLearning(
  state: Pick<LearnerStore, 'lessonProgress'>,
  courses: readonly Course[],
  lessonById: ReadonlyMap<string, Lesson>,
  courseById?: ReadonlyMap<string, Course>,
) {
  const summaries = courses.map((course) =>
    selectCourseSummary(state, course, lessonById, courseById),
  )
  return (
    summaries.find(({ lessons }) => lessons.some(({ status }) => status === 'in_progress')) ??
    summaries.find(
      ({ status, nextLesson }) => status !== 'locked' && status !== 'completed' && nextLesson,
    ) ??
    null
  )
}

export function selectWeeklyActivity(
  state: Pick<LearnerStore, 'weeklyGoal'>,
  weekStartsOn: number,
  today: string,
) {
  const current = new Date(`${today}T12:00:00`)
  const offset = (current.getDay() - weekStartsOn + 7) % 7
  const start = new Date(current)
  start.setDate(current.getDate() - offset)
  const completed = new Set(state.weeklyGoal.completedDays)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
    return {
      date: dateKey,
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 1),
      completed: completed.has(dateKey),
      isToday: dateKey === today,
    }
  })
  return {
    days,
    completedCount: days.filter(({ completed: isCompleted }) => isCompleted).length,
    targetDays: state.weeklyGoal.targetDays,
  }
}

export function selectRevisionRecommendations(
  state: Pick<LearnerStore, 'mastery' | 'lessonProgress'>,
  concepts: AppConfig['concepts'],
  courses: readonly Course[],
  threshold: number,
  limit: number,
) {
  return concepts
    .map((concept) => {
      const score = state.mastery[concept.id]?.score ?? 0
      const candidates = courses.flatMap((course) =>
        course.lessons
          .filter((lesson) => lesson.conceptIds.includes(concept.id))
          .map((lesson) => ({ course, lesson })),
      )
      const target =
        candidates.find(({ lesson }) => state.lessonProgress[lesson.id]?.status !== 'completed') ??
        candidates[0]
      return { concept, score, course: target?.course, lesson: target?.lesson }
    })
    .filter(({ score, lesson }) => score < threshold && lesson)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}

export function selectBadgeViews(
  state: Pick<LearnerStore, 'badges' | 'lessonProgress' | 'gamification' | 'streak'>,
  badges: AppConfig['badges'],
  registry: ContentRegistry,
) {
  return badges
    .map((badge) => ({
      ...badge,
      ...state.badges[badge.id],
      progress: evaluateCriterion(badge.criteria, state, registry).percentage,
      unlocked: Boolean(state.badges[badge.id]?.unlockedAt),
    }))
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '')
    })
}

export function selectProfileStats(state: Pick<LearnerStore, 'stats'>) {
  return {
    ...state.stats,
    accuracy:
      state.stats.questionsAnswered === 0
        ? 0
        : Math.round((state.stats.correctAnswers / state.stats.questionsAnswered) * 100),
  }
}

export function selectGreetingPeriod(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function selectPathwayView(
  state: LearnerState,
  pathway: AppConfig['pathways'][number],
  lessonById: ReadonlyMap<string, Lesson>,
  challenges: AppConfig['challenges'],
  currentDate?: string,
  weekStartsOn = 1,
) {
  const incoming = new Map(pathway.nodes.map(({ id }) => [id, [] as string[]]))
  pathway.edges.forEach(({ from, to }) => incoming.get(to)?.push(from))
  const depth = new Map<string, number>()
  const getDepth = (id: string): number => {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    const parents = incoming.get(id) ?? []
    const value = parents.length ? Math.max(...parents.map(getDepth)) + 1 : 0
    depth.set(id, value)
    return value
  }
  const nodeViews = pathway.nodes.map((node) => {
    const lesson = node.type === 'challenge' ? undefined : lessonById.get(node.refId)
    const challenge =
      node.type === 'challenge' ? challenges.find(({ id }) => id === node.refId) : undefined
    let status: LearningStatus = 'available'
    let unmetPrerequisites: string[] = []
    if (lesson) {
      const result = selectLessonAvailability(state, lesson, lessonById)
      status = result.status
      unmetPrerequisites = result.unmetPrerequisites
    } else if (challenge) {
      const progress = state.challenges[challenge.id]
      const period = state.gamification.challengePeriods[challenge.id]
      const completedThisPeriod =
        currentDate &&
        period?.lastCompletedPeriod === periodKey(challenge.type, currentDate, weekStartsOn)
      if (completedThisPeriod || (!currentDate && progress?.completed)) status = 'completed'
      else {
        const incompleteParents = (incoming.get(node.id) ?? []).filter((parentId) => {
          const parent = pathway.nodes.find(({ id }) => id === parentId)
          if (!parent) return true
          if (parent.type === 'challenge') return !state.challenges[parent.refId]?.completed
          return state.lessonProgress[parent.refId]?.status !== 'completed'
        })
        status = incompleteParents.length
          ? 'locked'
          : progress?.progress
            ? 'in_progress'
            : 'available'
        unmetPrerequisites = incompleteParents
      }
    } else {
      status = 'locked'
      unmetPrerequisites = [node.refId]
    }
    return {
      ...node,
      depth: getDepth(node.id),
      lesson,
      challenge,
      title: lesson?.title ?? challenge?.title ?? node.refId,
      estimatedMinutes: lesson?.estimatedMinutes ?? challenge?.estimatedMinutes,
      status,
      unmetPrerequisites,
      unlocks: pathway.edges.filter(({ from }) => from === node.id).map(({ to }) => to),
    }
  })
  const maxDepth = Math.max(0, ...nodeViews.map(({ depth: nodeDepth }) => nodeDepth))
  return {
    nodes: nodeViews,
    layers: Array.from({ length: maxDepth + 1 }, (_, layer) =>
      nodeViews.filter(({ depth: nodeDepth }) => nodeDepth === layer),
    ),
    currentNode:
      nodeViews.find(({ status }) => status === 'in_progress') ??
      nodeViews.find(({ status }) => status === 'available') ??
      null,
  }
}

export type LearnerSeedState = LearnerSeed
