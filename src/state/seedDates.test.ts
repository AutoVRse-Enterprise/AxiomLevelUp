import advancedSeedData from '../../public/content/seeds/advanced.json'
import { describe, expect, it } from 'vitest'

import { learnerSeedSchema } from '@/content/schema'
import { rebaseSeedDates } from '@/state/seedDates'

describe('seed date rebasing', () => {
  it('moves all dated activity relative to the seed reference date', () => {
    const seed = learnerSeedSchema.parse(advancedSeedData)
    const rebased = rebaseSeedDates(seed, '2026-10-08')

    expect(rebased.referenceDate).toBe('2026-10-08')
    expect(rebased.streak.lastQualifyingDate).toBe('2026-10-08')
    expect(rebased.weeklyGoal.completedDays).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ])
    expect(rebased.lessonProgress['imaging-orientation']?.completedAt).toContain('2026-09-29')
    expect(rebased.caseProgress['asthma-foundation']?.lastCompletedAt).toContain('2026-10-04')
    expect(rebased.caseAttempts['asthma-foundation']?.[0]?.completedAt).toContain('2026-10-04')
    expect(seed.referenceDate).toBe('2026-10-01')
  })
})
