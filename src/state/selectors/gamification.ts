import type { ContentRegistry } from '@/content/loader'
import { periodKey } from '@/engines/gamification/calendar'
import { displayedStreak } from '@/engines/gamification/streak'
import type { LearnerStore } from '@/state/learnerStore'

export function selectDisplayedStreak(state: Pick<LearnerStore, 'streak'>, currentDate: string) {
  return displayedStreak(state.streak.currentDays, state.streak.lastQualifyingDate, currentDate)
}

export function selectChallengePeriod(
  state: Pick<LearnerStore, 'gamification'>,
  challenge: ContentRegistry['appConfig']['challenges'][number],
  currentDate: string,
  weekStartsOn: number,
) {
  const currentPeriod = periodKey(challenge.type, currentDate, weekStartsOn)
  const stored = state.gamification.challengePeriods[challenge.id]
  const completed = stored?.lastCompletedPeriod === currentPeriod
  return {
    completed,
    progress: completed
      ? challenge.progressRule && 'count' in challenge.progressRule
        ? challenge.progressRule.count
        : challenge.itemCount
      : stored?.progressPeriod === currentPeriod
        ? stored.periodProgress
        : 0,
  }
}

export function selectActivityResult(
  state: Pick<LearnerStore, 'gamification'>,
  activityId: string,
) {
  const result = state.gamification.lastActivityResult
  return result?.activityId === activityId ? result : null
}

export function describeCriterion(
  criterion: ContentRegistry['appConfig']['badges'][number]['criteria'],
) {
  switch (criterion.type) {
    case 'lessons_completed':
      return `Complete ${criterion.count} qualifying lesson${criterion.count === 1 ? '' : 's'}`
    case 'course_completed':
      return `Complete ${criterion.count} course${criterion.count === 1 ? '' : 's'}`
    case 'perfect_lessons':
      return `Complete ${criterion.count} perfect lesson${criterion.count === 1 ? '' : 's'}`
    case 'streak_days':
      return `Reach a ${criterion.count}-day streak`
    case 'weekly_goals_met':
      return `Meet ${criterion.count} weekly goal${criterion.count === 1 ? '' : 's'}`
    case 'challenges_completed':
      return `Complete ${criterion.count} challenge${criterion.count === 1 ? '' : 's'}`
    case 'first_attempt_correct':
      return `Answer ${criterion.count} qualifying item${criterion.count === 1 ? '' : 's'} correctly`
    case 'primitive_reward':
      return 'Complete the linked learning activity'
  }
}
