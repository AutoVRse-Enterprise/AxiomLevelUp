import type { AppConfig, Course } from '@/content/schema'
import type { LearnerStore } from '@/state/learnerStore'

export function selectLevel(state: Pick<LearnerStore, 'xp'>, levels: AppConfig['gamification']['levels']) {
  return [...levels]
    .sort((a, b) => a.minimumXp - b.minimumXp)
    .reduce((level, threshold) => (state.xp.total >= threshold.minimumXp ? threshold.level : level), 1)
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

export function selectCourseCompletion(
  state: Pick<LearnerStore, 'lessonProgress'>,
  course: Course,
) {
  const completed = course.lessons.filter(
    (lesson) => state.lessonProgress[lesson.id]?.status === 'completed',
  ).length
  return Math.round((completed / course.lessons.length) * 100)
}
