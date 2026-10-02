import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import { selectBadgeViews, selectChallengePeriod, selectDisplayedStreak } from '@/state/selectors'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const state = registry.seed

describe('gamification selectors', () => {
  it('derives badge progress from learner facts', () => {
    const badges = selectBadgeViews(
      {
        badges: state.badges,
        lessonProgress: state.lessonProgress,
        caseProgress: state.caseProgress,
        caseAttempts: state.caseAttempts,
        gamification: state.gamification,
        streak: state.streak,
      },
      registry.appConfig.badges,
      registry,
    )
    expect(badges.find(({ id }) => id === 'imaging-fundamentals')?.progress).toBe(100)
    expect(badges.find(({ id }) => id === 'clinical-research-basics')?.progress).toBe(50)
    expect(badges.find(({ id }) => id === 'case-master')?.progress).toBe(0)
    expect(badges.find(({ id }) => id === 'four-week-goal')?.progress).toBe(75)
  })

  it('derives challenge completion for the current period', () => {
    const daily = registry.appConfig.challenges.find(
      ({ id }) => id === 'daily-imaging-interpretation',
    )!
    const weekly = registry.appConfig.challenges.find(({ id }) => id === 'weekly-imaging-sprint')!
    expect(
      selectChallengePeriod({ gamification: state.gamification }, daily, '2026-10-01', 1),
    ).toEqual({ completed: false, progress: 0 })
    expect(
      selectChallengePeriod({ gamification: state.gamification }, weekly, '2026-10-01', 1),
    ).toEqual({ completed: false, progress: 2 })
    expect(
      selectChallengePeriod({ gamification: state.gamification }, weekly, '2026-10-05', 1).progress,
    ).toBe(0)
  })

  it('expires a displayed streak after a missed day', () => {
    expect(selectDisplayedStreak({ streak: state.streak }, '2026-10-02')).toBe(8)
    expect(selectDisplayedStreak({ streak: state.streak }, '2026-10-03')).toBe(0)
  })
})
