import type { ContentRegistry } from '@/content/loader'
import type {
  AppConfig,
  CaseAttemptRecord,
  CaseDocument,
  CaseLabConfig,
  Course,
  LearnerSeed,
  Lesson,
} from '@/content/schema'
import { formatCaseOrganSystem, formatCaseTier } from '@/engines/cases/formatters'
import { periodKey } from '@/engines/gamification/calendar'
import { evaluateCriterion } from '@/engines/gamification/criteria'
import type { LearnerStore } from '@/state/learnerStore'

type LearnerState = Pick<
  LearnerStore,
  | 'learner'
  | 'xp'
  | 'weeklyGoal'
  | 'lessonProgress'
  | 'caseProgress'
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
  return selectLeaderboardView(state, entries, entries.length, 'weekly').rank
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time'

function configuredPeriodXp(
  entry: AppConfig['leaderboard']['entries'][number],
  period: LeaderboardPeriod,
) {
  if (period === 'weekly') return entry.weeklyXp
  if (period === 'monthly') return entry.monthlyXp ?? entry.weeklyXp
  return entry.totalXp ?? entry.monthlyXp ?? entry.weeklyXp
}

function currentLearnerPeriodXp(
  state: Pick<LearnerStore, 'xp'>,
  entry: AppConfig['leaderboard']['entries'][number],
  period: LeaderboardPeriod,
) {
  if (period === 'weekly') return state.xp.weekly
  if (period === 'all_time') return state.xp.total

  const configuredTotal = entry.totalXp ?? state.xp.total
  const configuredMonthly = entry.monthlyXp ?? entry.weeklyXp
  const xpEarnedSinceSnapshot = Math.max(0, state.xp.total - configuredTotal)
  return Math.max(state.xp.weekly, configuredMonthly + xpEarnedSinceSnapshot)
}

export function selectLeaderboardView(
  state: Pick<LearnerStore, 'learner' | 'xp'>,
  entries: AppConfig['leaderboard']['entries'],
  visibleWindow: number,
  period: LeaderboardPeriod = 'weekly',
) {
  const rows = entries
    .map((entry) => ({
      ...entry,
      periodXp:
        entry.id === state.learner.id
          ? currentLearnerPeriodXp(state, entry, period)
          : configuredPeriodXp(entry, period),
    }))
    .sort((a, b) => b.periodXp - a.periodXp || a.name.localeCompare(b.name))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      movement: period === 'weekly' && entry.previousRank ? entry.previousRank - (index + 1) : 0,
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

type CaseLabState = Pick<LearnerStore, 'caseProgress' | 'caseAttempts'>
type CaseLabRegistry = Pick<ContentRegistry, 'appConfig' | 'caseById'>

export interface CaseLabCardView {
  caseDoc: CaseDocument
  caseId: string
  title: string
  summary: string
  tier: CaseDocument['tier']
  tierLabel: string
  timing: CaseLabConfig['tiers'][CaseDocument['tier']]['timing']
  hints: CaseLabConfig['tiers'][CaseDocument['tier']]['hints']
  organSystemLabel: string
  estimatedMinutes: number
  bestScore: number | null
  attempts: number
  daily: boolean
}

export interface CaseResultsView {
  caseId: string
  attempt: CaseAttemptRecord
}

export interface CaseCompareView extends CaseResultsView {
  history: CaseAttemptRecord[]
  bestScore: number
}

export function selectCaseLabCards(
  state: CaseLabState,
  registry: CaseLabRegistry,
): CaseLabCardView[] {
  const caseLab = registry.appConfig.caseLab
  if (!caseLab) return []

  const catalogueCaseIds = caseLab.caseIds.includes(caseLab.dailyQuickCaseId)
    ? caseLab.caseIds
    : [...caseLab.caseIds, caseLab.dailyQuickCaseId]

  return catalogueCaseIds.flatMap((caseId) => {
    const caseDoc = registry.caseById.get(caseId)
    if (!caseDoc) return []
    const progress = state.caseProgress[caseId]
    const attempts = progress?.completions ?? state.caseAttempts[caseId]?.length ?? 0
    const tier = caseLab.tiers[caseDoc.tier]
    return [
      {
        caseDoc,
        caseId,
        title: caseDoc.title,
        summary: caseDoc.summary,
        tier: caseDoc.tier,
        tierLabel: formatCaseTier(caseLab, caseDoc.tier),
        timing: tier.timing,
        hints: tier.hints,
        organSystemLabel: formatCaseOrganSystem(caseLab, caseDoc.organSystem),
        estimatedMinutes: caseDoc.estimatedMinutes,
        bestScore: progress?.bestTotal ?? null,
        attempts,
        daily: caseId === caseLab.dailyQuickCaseId,
      },
    ]
  })
}

export function selectFeaturedCase(
  state: CaseLabState,
  registry: CaseLabRegistry,
): CaseLabCardView | null {
  const featuredCaseId = registry.appConfig.caseLab?.featuredCaseId
  if (!featuredCaseId) return null
  return selectCaseLabCards(state, registry).find(({ caseId }) => caseId === featuredCaseId) ?? null
}

const caseTierOrder: Record<CaseDocument['tier'], number> = {
  foundation: 0,
  intermediate: 1,
  advanced: 2,
}

export function selectRecommendedCase(
  state: CaseLabState,
  registry: CaseLabRegistry,
): CaseLabCardView | null {
  return (
    selectCaseLabCards(state, registry)
      .filter(({ daily, attempts }) => !daily && attempts === 0)
      .sort((a, b) => caseTierOrder[a.tier] - caseTierOrder[b.tier])[0] ?? null
  )
}

export function selectCaseResults(
  state: Pick<LearnerStore, 'caseAttempts'>,
  attemptId: string,
): CaseResultsView | null {
  for (const [caseId, attempts] of Object.entries(state.caseAttempts)) {
    const attempt = attempts.find((candidate) => candidate.attemptId === attemptId)
    if (attempt) return { caseId, attempt }
  }
  return null
}

export function selectCaseCompare(
  state: Pick<LearnerStore, 'caseAttempts'>,
  caseId: string,
  attemptId: string,
): CaseCompareView | null {
  const attempts = state.caseAttempts[caseId] ?? []
  const attempt = attempts.find((candidate) => candidate.attemptId === attemptId)
  if (!attempt) return null
  const history = attempts.filter((candidate) => candidate.attemptId !== attemptId)
  return {
    caseId,
    attempt,
    history,
    bestScore: Math.max(attempt.total, ...history.map(({ total }) => total)),
  }
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
  state: Pick<
    LearnerStore,
    'badges' | 'lessonProgress' | 'caseProgress' | 'caseAttempts' | 'gamification' | 'streak'
  >,
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
  caseById: ReadonlyMap<string, CaseDocument>,
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
  const nodeCompleted = (node: (typeof pathway.nodes)[number]) => {
    if (node.type === 'case') {
      return (state.caseProgress[node.refId]?.completions ?? 0) > 0
    }
    if (node.type === 'challenge') {
      const challenge = challenges.find(({ id }) => id === node.refId)
      if (!challenge) return false
      const period = state.gamification.challengePeriods[node.refId]
      return currentDate
        ? period?.lastCompletedPeriod === periodKey(challenge.type, currentDate, weekStartsOn)
        : Boolean(state.challenges[node.refId]?.completed)
    }
    return state.lessonProgress[node.refId]?.status === 'completed'
  }
  const incompleteParents = (nodeId: string) =>
    (incoming.get(nodeId) ?? []).filter((parentId) => {
      const parent = pathway.nodes.find(({ id }) => id === parentId)
      return !parent || !nodeCompleted(parent)
    })
  const nodeViews = pathway.nodes.map((node) => {
    const lesson =
      node.type === 'challenge' || node.type === 'case' ? undefined : lessonById.get(node.refId)
    const caseDocument = node.type === 'case' ? caseById.get(node.refId) : undefined
    const challenge =
      node.type === 'challenge' ? challenges.find(({ id }) => id === node.refId) : undefined
    let status: LearningStatus = 'available'
    let unmetPrerequisites: string[] = []
    if (lesson) {
      const result = selectLessonAvailability(state, lesson, lessonById)
      status = result.status
      unmetPrerequisites = result.unmetPrerequisites
    } else if (caseDocument) {
      unmetPrerequisites = incompleteParents(node.id)
      status =
        (state.caseProgress[caseDocument.id]?.completions ?? 0) > 0
          ? 'completed'
          : unmetPrerequisites.length
            ? 'locked'
            : 'available'
    } else if (challenge) {
      const progress = state.challenges[challenge.id]
      const period = state.gamification.challengePeriods[challenge.id]
      const completedThisPeriod =
        currentDate &&
        period?.lastCompletedPeriod === periodKey(challenge.type, currentDate, weekStartsOn)
      if (completedThisPeriod || (!currentDate && progress?.completed)) status = 'completed'
      else {
        unmetPrerequisites = incompleteParents(node.id)
        status = unmetPrerequisites.length
          ? 'locked'
          : progress?.progress
            ? 'in_progress'
            : 'available'
      }
    } else {
      status = 'locked'
      unmetPrerequisites = [node.refId]
    }
    return {
      ...node,
      depth: getDepth(node.id),
      lesson,
      caseDocument,
      challenge,
      title: lesson?.title ?? caseDocument?.title ?? challenge?.title ?? node.refId,
      estimatedMinutes:
        lesson?.estimatedMinutes ?? caseDocument?.estimatedMinutes ?? challenge?.estimatedMinutes,
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
