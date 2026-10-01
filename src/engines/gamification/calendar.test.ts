import { describe, expect, it } from 'vitest'

import {
  addLocalDays,
  differenceInLocalDays,
  periodKey,
  startOfLocalWeek,
} from '@/engines/gamification/calendar'
import { displayedStreak, nextStreak } from '@/engines/gamification/streak'

describe('gamification calendar', () => {
  it('uses configured local week boundaries across months', () => {
    expect(startOfLocalWeek('2026-10-01', 1)).toBe('2026-09-28')
    expect(periodKey('weekly', '2026-10-04', 1)).toBe('2026-09-28')
    expect(periodKey('weekly', '2026-10-05', 1)).toBe('2026-10-05')
  })

  it('handles consecutive, duplicate and missed streak days', () => {
    expect(nextStreak(3, '2026-10-01', '2026-10-02')).toEqual({
      currentDays: 4,
      lastQualifyingDate: '2026-10-02',
    })
    expect(nextStreak(4, '2026-10-02', '2026-10-02').currentDays).toBe(4)
    expect(nextStreak(4, '2026-10-02', '2026-10-04').currentDays).toBe(1)
    expect(displayedStreak(4, '2026-10-02', '2026-10-04')).toBe(0)
  })

  it('performs local date arithmetic without UTC rollover', () => {
    expect(addLocalDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(differenceInLocalDays('2026-03-01', '2026-02-28')).toBe(1)
  })
})
