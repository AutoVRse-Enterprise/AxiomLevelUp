import appConfigData from '../../public/content/app-config.json'
import clinicalResearchData from '../../public/content/courses/clinical-research.json'
import dataInterpretationData from '../../public/content/courses/data-interpretation.json'
import safetyAssessmentData from '../../public/content/courses/safety-assessment.json'
import scientificImagingData from '../../public/content/courses/scientific-imaging.json'
import advancedSeedData from '../../public/content/seeds/advanced.json'
import freshSeedData from '../../public/content/seeds/fresh.json'
import { describe, expect, it } from 'vitest'

import { appConfigSchema, courseSchema, learnerSeedSchema } from '@/content/schema'
import {
  selectCourseCompletion,
  selectCourseSummary,
  selectContinueLearning,
  selectGreetingPeriod,
  selectLeaderboardView,
  selectLeaderboardRank,
  selectLessonAvailability,
  selectLevel,
  selectLevelProgress,
  selectPathwayView,
  selectProfileStats,
  selectRevisionRecommendations,
  selectWeeklyActivity,
} from '@/state/selectors'

const appConfig = appConfigSchema.parse(appConfigData)
const course = courseSchema.parse(scientificImagingData)
const learner = learnerSeedSchema.parse(advancedSeedData)
const freshLearner = learnerSeedSchema.parse(freshSeedData)
const courses = [
  course,
  courseSchema.parse(clinicalResearchData),
  courseSchema.parse(dataInterpretationData),
  courseSchema.parse(safetyAssessmentData),
]
const lessonById = new Map(courses.flatMap((item) => item.lessons.map((lesson) => [lesson.id, lesson])))
const courseById = new Map(courses.map((item) => [item.id, item]))

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

  it('derives effective locks and course continuation from prerequisites', () => {
    const current = course.lessons.find(({ id }) => id === 'thoracic-ct')
    const locked = course.lessons.find(({ id }) => id === 'imaging-case-practice')

    expect(current && selectLessonAvailability(learner, current, lessonById).status).toBe(
      'in_progress',
    )
    expect(locked && selectLessonAvailability(learner, locked, lessonById)).toEqual(
      expect.objectContaining({
        status: 'locked',
        unmetPrerequisites: ['Interpreting Thoracic CT'],
      }),
    )
    expect(selectContinueLearning(learner, courses, lessonById, courseById)?.nextLesson?.id).toBe(
      'thoracic-ct',
    )
    expect(selectCourseSummary(learner, course, lessonById).remainingMinutes).toBe(63)
  })

  it('builds a branching pathway in deterministic layers', () => {
    const pathway = selectPathwayView(
      learner,
      appConfig.pathways[0]!,
      lessonById,
      appConfig.challenges,
    )

    expect(pathway.layers.map((layer) => layer.length)).toEqual([1, 1, 1, 2, 1])
    expect(pathway.currentNode?.refId).toBe('thoracic-ct')
  })

  it('derives weekly activity across a calendar boundary', () => {
    const view = selectWeeklyActivity(
      { weeklyGoal: { targetDays: 5, completedDays: ['2026-09-28', '2026-10-01'] } },
      1,
      '2026-10-01',
    )

    expect(view.days[0]?.date).toBe('2026-09-28')
    expect(view.completedCount).toBe(2)
    expect(view.days.find(({ isToday }) => isToday)?.date).toBe('2026-10-01')
  })

  it('derives recommendations, rank window, profile and level progress', () => {
    expect(
      selectRevisionRecommendations(learner, appConfig.concepts, courses, 70, 2).map(
        ({ concept }) => concept.id,
      ),
    ).toEqual(['thoracic-imaging', 'biostatistics'])
    expect(selectLeaderboardView(learner, appConfig.leaderboard.entries, 10)).toEqual(
      expect.objectContaining({ rank: 8, movement: 3 }),
    )
    expect(selectProfileStats(learner).accuracy).toBe(85)
    expect(selectProfileStats(freshLearner).accuracy).toBe(0)
    expect(selectLevelProgress(learner, appConfig.gamification.levels)).toEqual(
      expect.objectContaining({ level: 7, nextLevelXp: 6000 }),
    )
    expect(selectGreetingPeriod(new Date('2026-10-01T19:00:00'))).toBe('evening')
  })
})
