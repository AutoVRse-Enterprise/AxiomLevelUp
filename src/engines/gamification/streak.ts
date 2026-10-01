import { differenceInLocalDays } from '@/engines/gamification/calendar'

export function nextStreak(
  currentDays: number,
  lastQualifyingDate: string | null,
  qualifyingDate: string,
) {
  if (lastQualifyingDate === qualifyingDate) {
    return { currentDays, lastQualifyingDate }
  }
  const gap = lastQualifyingDate ? differenceInLocalDays(qualifyingDate, lastQualifyingDate) : null
  return {
    currentDays: gap === 1 ? currentDays + 1 : 1,
    lastQualifyingDate: qualifyingDate,
  }
}

export function displayedStreak(
  currentDays: number,
  lastQualifyingDate: string | null,
  currentDate: string,
) {
  if (!lastQualifyingDate) return 0
  return differenceInLocalDays(currentDate, lastQualifyingDate) <= 1 ? currentDays : 0
}
