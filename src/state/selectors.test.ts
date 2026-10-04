import appConfigData from '../../public/content/app-config.json'
import clinicalResearchData from '../../public/content/courses/clinical-research.json'
import dataInterpretationData from '../../public/content/courses/data-interpretation.json'
import safetyAssessmentData from '../../public/content/courses/safety-assessment.json'
import scientificImagingData from '../../public/content/courses/scientific-imaging.json'
import asthmaFoundationData from '../../public/content/cases/asthma-foundation.json'
import advancedSeedData from '../../public/content/seeds/advanced.json'
import freshSeedData from '../../public/content/seeds/fresh.json'
import { describe, expect, it } from 'vitest'

import {
  appConfigSchema,
  caseDocumentSchema,
  courseSchema,
  learnerSeedSchema,
} from '@/content/schema'
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
const lessonById = new Map(
  courses.flatMap((item) => item.lessons.map((lesson) => [lesson.id, lesson])),
)
const courseById = new Map(courses.map((item) => [item.id, item]))
const cases = [caseDocumentSchema.parse(asthmaFoundationData)]
const caseById = new Map(cases.map((item) => [item.id, item]))

describe('derived learner selectors', () => {
  it('derives level from configuration thresholds without relying on input order', () => {
    expect(selectLevel(learner, [...appConfig.gamification.levels].reverse())).toBe(7)
    expect(selectLevel({ xp: { total: 0, weekly: 0 } }, appConfig.gamification.levels)).toBe(1)
  })

  it('derives the configured learner rank', () => {
    expect(selectLeaderboardRank(learner, appConfig.leaderboard.entries)).toBe(8)
  })

  it('ranks each leaderboard period and derives the current learner totals from live state', () => {
    const monthly = selectLeaderboardView(learner, appConfig.leaderboard.entries, 15, 'monthly')
    const allTime = selectLeaderboardView(learner, appConfig.leaderboard.entries, 15, 'all_time')
    const updated = {
      ...learner,
      xp: { total: learner.xp.total + 600, weekly: learner.xp.weekly + 600 },
    }

    expect(monthly.rank).toBe(9)
    expect(monthly.rows.find(({ isCurrentLearner }) => isCurrentLearner)?.periodXp).toBe(3180)
    expect(allTime.rank).toBe(13)
    expect(allTime.rows.find(({ isCurrentLearner }) => isCurrentLearner)?.periodXp).toBe(4820)
    expect(
      selectLeaderboardView(updated, appConfig.leaderboard.entries, 15, 'monthly').rows.find(
        ({ isCurrentLearner }) => isCurrentLearner,
      )?.periodXp,
    ).toBe(3780)
    expect(
      selectLeaderboardView(updated, appConfig.leaderboard.entries, 15, 'all_time').rows.find(
        ({ isCurrentLearner }) => isCurrentLearner,
      )?.periodXp,
    ).toBe(5420)

    const legacyEntries = appConfig.leaderboard.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      weeklyXp: entry.weeklyXp,
      isCurrentLearner: entry.isCurrentLearner,
      ...(entry.previousRank === undefined ? {} : { previousRank: entry.previousRank }),
    }))
    expect(selectLeaderboardView(learner, legacyEntries, 15, 'monthly').rank).toBe(8)
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
      caseById,
      appConfig.challenges,
    )

    expect(pathway.layers.map((layer) => layer.length)).toEqual([1, 1, 1, 2, 1])
    expect(pathway.currentNode?.refId).toBe('thoracic-ct')
    expect(pathway.nodes.find(({ id }) => id === 'node-case')).toEqual(
      expect.objectContaining({
        refId: 'asthma-foundation',
        title: 'Variable Airflow Review',
        status: 'completed',
      }),
    )
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
