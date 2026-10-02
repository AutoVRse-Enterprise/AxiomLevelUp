import type { LearnerSeed } from '@/content/schema'
import { startOfLocalWeek } from '@/engines/gamification/calendar'

const DAY_MS = 86_400_000

function dateToUtcDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function shiftDate(value: string, days: number) {
  const shifted = new Date(dateToUtcDay(value) + days * DAY_MS)
  return shifted.toISOString().slice(0, 10)
}

function shiftTimestamp(value: string, days: number) {
  return new Date(new Date(value).getTime() + days * DAY_MS).toISOString()
}

export function rebaseSeedDates(seed: LearnerSeed, targetDate: string): LearnerSeed {
  const days = Math.round((dateToUtcDay(targetDate) - dateToUtcDay(seed.referenceDate)) / DAY_MS)
  const rebased = structuredClone(seed)

  rebased.referenceDate = targetDate
  if (rebased.streak.lastQualifyingDate) {
    rebased.streak.lastQualifyingDate = shiftDate(rebased.streak.lastQualifyingDate, days)
  }
  rebased.weeklyGoal.completedDays = rebased.weeklyGoal.completedDays.map((date) =>
    shiftDate(date, days),
  )
  rebased.gamification.xpWeekStart = startOfLocalWeek(targetDate, 1)
  if (rebased.gamification.weeklyTargetRewardedWeek) {
    rebased.gamification.weeklyTargetRewardedWeek = shiftDate(
      rebased.gamification.weeklyTargetRewardedWeek,
      days,
    )
  }
  Object.entries(rebased.gamification.challengePeriods).forEach(([id, period]) => {
    const original = seed.gamification.challengePeriods[id]
    if (period.progressPeriod) {
      period.progressPeriod =
        original?.progressPeriod === seed.gamification.xpWeekStart
          ? rebased.gamification.xpWeekStart
          : shiftDate(period.progressPeriod, days)
    }
    if (period.lastCompletedPeriod) {
      period.lastCompletedPeriod =
        original?.lastCompletedPeriod === seed.gamification.xpWeekStart
          ? rebased.gamification.xpWeekStart
          : shiftDate(period.lastCompletedPeriod, days)
    }
  })
  if (rebased.gamification.activeRun) {
    rebased.gamification.activeRun.startedAt = shiftTimestamp(
      rebased.gamification.activeRun.startedAt,
      days,
    )
  }
  if (rebased.gamification.lastQuestionReward) {
    rebased.gamification.lastQuestionReward.at = shiftTimestamp(
      rebased.gamification.lastQuestionReward.at,
      days,
    )
  }
  rebased.gamification.digitalRewards = rebased.gamification.digitalRewards.map((reward) => ({
    ...reward,
    grantedAt: shiftTimestamp(reward.grantedAt, days),
  }))

  Object.values(rebased.lessonProgress).forEach((progress) => {
    if (progress.completedAt) progress.completedAt = shiftTimestamp(progress.completedAt, days)
  })
  Object.values(rebased.caseProgress).forEach((progress) => {
    if (progress.lastCompletedAt) {
      progress.lastCompletedAt = shiftTimestamp(progress.lastCompletedAt, days)
    }
  })
  Object.values(rebased.caseAttempts).forEach((attempts) => {
    attempts.forEach((attempt) => {
      attempt.completedAt = shiftTimestamp(attempt.completedAt, days)
    })
  })
  Object.values(rebased.badges).forEach((badge) => {
    if (badge.unlockedAt) badge.unlockedAt = shiftTimestamp(badge.unlockedAt, days)
  })
  Object.values(rebased.mastery).forEach((mastery) => {
    mastery.history = mastery.history.map((entry) => ({
      ...entry,
      at: shiftTimestamp(entry.at, days),
    }))
  })

  return rebased
}
