import appConfigData from '../../public/content/app-config.json'
import scientificImagingData from '../../public/content/courses/scientific-imaging.json'
import advancedSeedData from '../../public/content/seeds/advanced.json'
import { describe, expect, it } from 'vitest'

import { appConfigSchema, courseSchema, learnerSeedSchema } from '@/content/schema'
import {
  selectCourseCompletion,
  selectLeaderboardRank,
  selectLevel,
} from '@/state/selectors'

const appConfig = appConfigSchema.parse(appConfigData)
const course = courseSchema.parse(scientificImagingData)
const learner = learnerSeedSchema.parse(advancedSeedData)

describe('derived learner selectors', () => {
  it('derives level from configuration thresholds without relying on input order', () => {
    expect(selectLevel(learner, [...appConfig.gamification.levels].reverse())).toBe(7)
    expect(selectLevel({ xp: { total: 0, weekly: 0 } }, appConfig.gamification.levels)).toBe(1)
  })

  it('derives the configured learner rank', () => {
    expect(selectLeaderboardRank(learner, appConfig.leaderboard.entries)).toBe(8)
  })

  it('derives course completion from lesson progress', () => {
    expect(selectCourseCompletion(learner, course)).toBe(40)
  })
})
