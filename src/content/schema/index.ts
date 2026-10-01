import { z } from 'zod'

import { primitiveTypeSet } from '../primitiveTypes'
import {
  primitiveContentSchemas,
  validateScenarioGraph,
  type ScenarioPrimitive,
  type TypedPrimitive,
} from './primitives'
import { idSchema, primitiveBaseSchema, type Primitive } from './primitiveBase'

const versionSchema = z.string().trim().min(1)
const pathSchema = z.string().trim().min(1)
const isoDateSchema = z.string().datetime({ offset: true })

export * from './primitiveBase'
export * from './primitives'

export interface PrimitiveParseResult {
  primitive?: Primitive
  warnings: string[]
  issues: z.core.$ZodIssue[]
}

export function parsePrimitive(input: unknown): PrimitiveParseResult {
  const baseResult = primitiveBaseSchema.safeParse(input)
  if (!baseResult.success) {
    return { warnings: [], issues: baseResult.error.issues }
  }

  const { type } = baseResult.data
  if (!primitiveTypeSet.has(type)) {
    return {
      primitive: baseResult.data,
      warnings: [`Unsupported primitive type "${type}" will use the runtime fallback.`],
      issues: [],
    }
  }

  if (type in primitiveContentSchemas) {
    const contentSchema = primitiveContentSchemas[type as keyof typeof primitiveContentSchemas]
    const typedResult = contentSchema.schema.safeParse(input)
    if (!typedResult.success) {
      return { warnings: [], issues: typedResult.error.issues }
    }
    return {
      primitive: typedResult.data as TypedPrimitive,
      warnings:
        type === 'scenario'
          ? validateScenarioGraph((typedResult.data as ScenarioPrimitive).content).warnings.map(
              ({ message }) => message,
            )
          : [],
      issues: [],
    }
  }

  return { primitive: baseResult.data, warnings: [], issues: [] }
}

export const lessonSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['foundation', 'intermediate', 'advanced']),
  conceptIds: z.array(idSchema).min(1),
  xpReward: z.number().int().nonnegative().optional(),
  starThresholds: z
    .object({
      one: z.number().min(0).max(100),
      two: z.number().min(0).max(100),
      three: z.number().min(0).max(100),
    })
    .optional(),
  prerequisites: z.array(idSchema).default([]),
  primitives: z.array(primitiveBaseSchema).min(1),
})

export const courseSchema = z.object({
  schemaVersion: z.literal('0.1'),
  courseVersion: versionSchema,
  id: idSchema,
  visibility: z.enum(['learner', 'internal']).default('learner'),
  title: z.string().min(1),
  description: z.string().min(1),
  imageAssetId: idSchema.optional(),
  category: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['foundation', 'intermediate', 'advanced']),
  authors: z.array(z.string().min(1)).min(1),
  conceptIds: z.array(idSchema).min(1),
  prerequisites: z.array(idSchema).default([]),
  completionRequirement: z.object({
    mode: z.enum(['all_lessons', 'minimum_lessons']),
    minimumLessons: z.number().int().positive().optional(),
  }),
  lessons: z.array(lessonSchema).min(1),
})

export const conceptSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
})

export const pathwaySchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  active: z.boolean(),
  nodes: z
    .array(
      z.object({
        id: idSchema,
        type: z.enum(['lesson', 'assessment', 'case', 'challenge', 'practice', 'checkpoint']),
        refId: idSchema,
        optional: z.boolean().default(false),
      }),
    )
    .min(1),
  edges: z.array(
    z.object({
      from: idSchema,
      to: idSchema,
    }),
  ),
})

export const badgeSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['learning', 'performance', 'consistency']),
  icon: z.string().min(1),
  rewardXp: z.number().int().nonnegative().default(0),
  criteria: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('lessons_completed'),
      count: z.number().int().positive(),
      lessonIds: z.array(idSchema).min(1).optional(),
      courseIds: z.array(idSchema).min(1).optional(),
      difficulties: z
        .array(z.enum(['foundation', 'intermediate', 'advanced']))
        .min(1)
        .optional(),
    }),
    z.object({
      type: z.literal('course_completed'),
      count: z.number().int().positive().default(1),
      courseIds: z.array(idSchema).min(1).optional(),
    }),
    z.object({
      type: z.literal('perfect_lessons'),
      count: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('streak_days'),
      count: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('weekly_goals_met'),
      count: z.number().int().positive(),
    }),
    z.object({
      type: z.literal('challenges_completed'),
      count: z.number().int().positive(),
      challengeIds: z.array(idSchema).min(1).optional(),
    }),
    z.object({
      type: z.literal('first_attempt_correct'),
      count: z.number().int().positive(),
      primitiveTypes: z.array(z.string().min(1)).min(1).optional(),
      conceptIds: z.array(idSchema).min(1).optional(),
    }),
    z.object({
      type: z.literal('primitive_reward'),
      rewardId: idSchema,
    }),
  ]),
})

export type AchievementCriterion = z.infer<typeof badgeSchema>['criteria']

export const challengeSchema = z.object({
  id: idSchema,
  type: z.enum(['daily', 'weekly']),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  rewardXp: z.number().int().nonnegative(),
  itemCount: z.number().int().positive(),
  items: z.array(primitiveBaseSchema).default([]),
  target: z.number().int().positive().optional(),
  progressRule: badgeSchema.shape.criteria.optional(),
})

export const leaderboardEntrySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  weeklyXp: z.number().int().nonnegative(),
  isCurrentLearner: z.boolean().default(false),
  previousRank: z.number().int().positive().optional(),
})

export const appConfigSchema = z.object({
  schemaVersion: z.literal('0.1'),
  app: z.object({
    name: z.string().min(1),
    cohortName: z.string().min(1),
  }),
  product: z.object({
    weekStartsOn: z.number().int().min(0).max(6).default(1),
    revision: z.object({
      masteryThreshold: z.number().min(0).max(100),
      maxRecommendations: z.number().int().positive(),
    }),
    leaderboard: z.object({
      visibleWindow: z.number().int().positive(),
    }),
    home: z.object({
      recentAchievementCount: z.number().int().nonnegative(),
    }),
    player: z.object({
      maxAttempts: z.number().int().positive(),
      retryByDefault: z.boolean(),
      revealAnswer: z.enum(['never', 'final_attempt', 'always']).default('final_attempt'),
      mediaCompletionThreshold: z.number().min(0).max(1).default(0.9),
      timerAnnouncements: z.array(z.number().int().positive()).default([60, 30, 10]),
    }),
    dicom: z.strictObject({
      prefetchRadius: z.number().int().nonnegative(),
      preloadConcurrency: z.number().int().positive().max(8),
      cacheMaxMiB: z.number().int().positive(),
      sliceEventDebounceMs: z.number().int().nonnegative(),
      tapMaxMovementPx: z.number().positive(),
    }),
  }),
  gamification: z.object({
    xp: z.strictObject({
      correctStandard: z.number().int().nonnegative(),
      correctDifficult: z.number().int().nonnegative(),
      lessonComplete: z.number().int().nonnegative(),
      perfectLessonBonus: z.number().int().nonnegative(),
      dailyChallenge: z.number().int().nonnegative(),
      perfectChallengeBonus: z.number().int().nonnegative(),
      revisionComplete: z.number().int().nonnegative(),
      weeklyTarget: z.number().int().nonnegative(),
      dicomFirstTask: z.number().int().nonnegative(),
    }),
    levels: z
      .array(
        z.object({
          level: z.number().int().positive(),
          minimumXp: z.number().int().nonnegative(),
          label: z.string().optional(),
        }),
      )
      .min(1),
    stars: z.object({
      one: z.number().min(0).max(100),
      two: z.number().min(0).max(100),
      three: z.number().min(0).max(100),
    }),
    weeklyGoal: z.object({
      defaultTargetDays: z.number().int().min(1).max(7),
    }),
    mastery: z.object({
      gain: z.number().positive(),
      loss: z.number().positive(),
      difficultyWeights: z.strictObject({
        foundation: z.number().positive(),
        intermediate: z.number().positive(),
        advanced: z.number().positive(),
      }),
      defaultDifficulty: z.enum(['foundation', 'intermediate', 'advanced']),
      initialScore: z.number().min(0).max(100),
      historyLimit: z.number().int().positive(),
    }),
  }),
  concepts: z.array(conceptSchema).min(1),
  pathways: z.array(pathwaySchema).min(1),
  badges: z.array(badgeSchema),
  challenges: z.array(challengeSchema),
  leaderboard: z.object({
    scope: z.string().min(1),
    period: z.literal('weekly'),
    entries: z.array(leaderboardEntrySchema).min(1),
  }),
})

export const lessonProgressSchema = z.object({
  status: z.enum(['completed', 'current', 'available', 'locked', 'new']),
  stars: z.number().int().min(0).max(3),
  bestScore: z.number().min(0).max(100).nullable(),
  attempts: z.number().int().nonnegative(),
  lastPrimitiveIndex: z.number().int().nonnegative(),
  completedAt: isoDateSchema.nullable(),
})

export const masteryStateSchema = z.object({
  score: z.number().min(0).max(100),
  history: z.array(
    z.object({
      at: isoDateSchema,
      delta: z.number(),
      reason: z.string().min(1),
    }),
  ),
})

const activityResultSchema = z.object({
  activityKind: z.enum(['lesson', 'challenge']),
  activityId: idSchema,
  xpEarned: z.number().int().nonnegative(),
  stars: z.number().int().min(0).max(3),
  masteryDelta: z.record(idSchema, z.number()),
  rankBefore: z.number().int().positive().nullable(),
  rankAfter: z.number().int().positive().nullable(),
  badgesUnlocked: z.array(idSchema),
  levelFrom: z.number().int().positive(),
  levelTo: z.number().int().positive(),
  streak: z.number().int().nonnegative(),
  revision: z.boolean(),
})

const celebrationSchema = z.discriminatedUnion('type', [
  z.object({
    id: idSchema,
    type: z.literal('badge'),
    badgeId: idSchema,
    rewardXp: z.number().int().nonnegative(),
  }),
  z.object({
    id: idSchema,
    type: z.literal('level'),
    from: z.number().int().positive(),
    to: z.number().int().positive(),
  }),
])

export const gamificationStateSchema = z.object({
  xpWeekStart: z.iso.date(),
  weeklyTargetRewardedWeek: z.iso.date().nullable(),
  lessonRewards: z.record(
    idSchema,
    z.object({
      completionAwarded: z.boolean(),
      perfectAwarded: z.boolean(),
    }),
  ),
  challengePeriods: z.record(
    idSchema,
    z.object({
      progressPeriod: z.string().nullable(),
      lastCompletedPeriod: z.string().nullable(),
      periodProgress: z.number().int().nonnegative(),
    }),
  ),
  counters: z.object({
    perfectLessons: z.number().int().nonnegative(),
    weeklyGoalsMet: z.number().int().nonnegative(),
    challengeCompletions: z.record(idSchema, z.number().int().nonnegative()),
    firstAttemptCorrect: z.number().int().nonnegative(),
    firstAttemptCorrectByType: z.record(z.string(), z.number().int().nonnegative()),
    firstAttemptCorrectByConcept: z.record(idSchema, z.number().int().nonnegative()),
  }),
  activeRun: z
    .object({
      activityKind: z.enum(['lesson', 'challenge']),
      activityId: idSchema,
      revision: z.boolean(),
      xpEarned: z.number().int().nonnegative(),
      masteryBefore: z.record(idSchema, z.number()),
      weeklyXpBefore: z.number().int().nonnegative(),
      startedAt: isoDateSchema,
    })
    .nullable(),
  lastQuestionReward: z
    .object({
      questionId: idSchema,
      xp: z.number().int().nonnegative(),
      at: isoDateSchema,
    })
    .nullable(),
  lastActivityResult: activityResultSchema.nullable(),
  celebrations: z.array(celebrationSchema),
  digitalRewards: z.array(
    z.object({
      type: z.enum(['badge', 'certificate', 'points', 'recognition']),
      id: idSchema,
      grantedAt: isoDateSchema,
    }),
  ),
})

export const learnerSeedSchema = z.object({
  schemaVersion: z.literal('0.1'),
  stateVersion: z.number().int().positive(),
  seedProfile: z.enum(['fresh', 'advanced']),
  referenceDate: z.iso.date(),
  learner: z.object({
    id: idSchema,
    name: z.string().min(1),
    role: z.string().min(1),
    avatar: z.string().optional(),
  }),
  xp: z.object({
    total: z.number().int().nonnegative(),
    weekly: z.number().int().nonnegative(),
  }),
  streak: z.object({
    currentDays: z.number().int().nonnegative(),
    lastQualifyingDate: z.string().nullable(),
  }),
  weeklyGoal: z.object({
    targetDays: z.number().int().positive(),
    completedDays: z.array(z.string()),
  }),
  lessonProgress: z.record(idSchema, lessonProgressSchema),
  challenges: z.record(
    idSchema,
    z.object({
      completed: z.boolean(),
      progress: z.number().int().nonnegative(),
      bestScore: z.number().min(0).max(100).nullable(),
    }),
  ),
  badges: z.record(
    idSchema,
    z.object({
      unlockedAt: isoDateSchema.nullable(),
      progress: z.number().min(0).max(100).optional(),
    }),
  ),
  mastery: z.record(idSchema, masteryStateSchema),
  gamification: gamificationStateSchema,
  stats: z.object({
    coursesCompleted: z.number().int().nonnegative(),
    lessonsCompleted: z.number().int().nonnegative(),
    challengesCompleted: z.number().int().nonnegative(),
    questionsAnswered: z.number().int().nonnegative(),
    correctAnswers: z.number().int().nonnegative(),
  }),
  onboarding: z.object({
    viewed: z.boolean(),
  }),
  offlineDownloads: z.record(
    idSchema,
    z.object({
      status: z.enum(['queued', 'downloading', 'available', 'failed']),
      downloadedBytes: z.number().int().nonnegative(),
      totalBytes: z.number().int().nonnegative(),
    }),
  ),
})

const dicomSeriesMetadataSchema = z.strictObject({
  sliceCount: z.number().int().positive(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  pixelSpacingMm: z.tuple([z.number().positive(), z.number().positive()]),
  sliceThicknessMm: z.number().positive(),
  calibrated: z.boolean(),
})

const assetSchema = z
  .object({
    assetId: idSchema,
    path: pathSchema,
    type: z.enum(['image', 'video', 'audio', 'dicom', 'document', 'text']),
    offlineRequired: z.boolean(),
    sizeBytes: z.number().int().nonnegative().optional(),
    mimeType: z.string().trim().min(1).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    series: dicomSeriesMetadataSchema.optional(),
  })
  .superRefine((asset, context) => {
    if (asset.type === 'dicom' && !asset.series) {
      context.addIssue({
        code: 'custom',
        path: ['series'],
        message: 'DICOM assets require series geometry and calibration metadata.',
      })
    }
    if (asset.type !== 'dicom' && asset.series) {
      context.addIssue({
        code: 'custom',
        path: ['series'],
        message: 'Only DICOM assets may declare series metadata.',
      })
    }
  })

export const assetManifestSchema = z.object({
  schemaVersion: z.literal('0.1'),
  assets: z.array(assetSchema),
})

export const contentManifestSchema = z.object({
  schemaVersion: z.literal('0.1'),
  appConfig: pathSchema,
  courses: z.array(pathSchema).min(1),
  seeds: z.object({
    advanced: pathSchema,
    fresh: pathSchema,
  }),
  defaultSeed: z.enum(['advanced', 'fresh']),
  assetManifest: pathSchema,
})

export type Course = z.infer<typeof courseSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type AppConfig = z.infer<typeof appConfigSchema>
export type LearnerSeed = z.infer<typeof learnerSeedSchema>
export type ContentManifest = z.infer<typeof contentManifestSchema>
export type AssetManifest = z.infer<typeof assetManifestSchema>
