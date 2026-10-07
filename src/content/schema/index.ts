import { z } from 'zod'

import { primitiveTypeSet } from '../primitiveTypes'
import { caseLabConfigSchema, caseTierSchema } from './case'
import { gameConfigSchema } from './game'
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
export * from './anatomyMap'
export * from './case'
export * from './game'

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
    z.object({
      type: z.literal('cases_completed'),
      count: z.number().int().positive(),
      tiers: z.array(caseTierSchema).min(1).optional(),
    }),
    z.object({
      type: z.literal('case_component_score'),
      component: z.enum(['anatomy', 'diagnosis', 'speed', 'total']),
      min: z.number().min(0).max(100),
      maxOptionalClues: z.number().int().nonnegative().optional(),
    }),
    z.object({
      type: z.literal('case_duration'),
      maxRatioOfTarget: z.number().positive(),
    }),
  ]),
})

export type AchievementCriterion = z.infer<typeof badgeSchema>['criteria']

const challengeBaseSchema = z.object({
  id: idSchema,
  type: z.enum(['daily', 'weekly']),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  rewardXp: z.number().int().nonnegative(),
  itemCount: z.number().int().positive(),
  target: z.number().int().positive().optional(),
  progressRule: badgeSchema.shape.criteria.optional(),
})

export const recordedOpponentSchema = z.strictObject({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  recordedAt: isoDateSchema,
  breakdown: z.strictObject({
    anatomy: z.number().min(0).max(1),
    diagnosis: z.number().min(0).max(1),
    speed: z.number().min(0).max(1),
    total: z.number().min(0).max(100),
    durationSeconds: z.number().int().positive(),
    openedClueCount: z.number().int().nonnegative(),
  }),
})

export const challengeSchema = z.union([
  challengeBaseSchema.extend({
    items: z.array(primitiveBaseSchema).default([]),
    caseId: z.never().optional(),
    recordedOpponent: z.never().optional(),
  }),
  challengeBaseSchema.extend({
    caseId: idSchema,
    items: z.never().optional(),
    recordedOpponent: recordedOpponentSchema.optional(),
  }),
])

export const leaderboardEntrySchema = z
  .strictObject({
    id: idSchema,
    name: z.string().min(1),
    weeklyXp: z.number().int().nonnegative(),
    monthlyXp: z.number().int().nonnegative().optional(),
    totalXp: z.number().int().nonnegative().optional(),
    isCurrentLearner: z.boolean().default(false),
    previousRank: z.number().int().positive().optional(),
    country: z.string().trim().min(1).optional(),
    specialty: z.string().trim().min(1).optional(),
    institution: z.string().trim().min(1).optional(),
  })
  .superRefine((entry, context) => {
    if (entry.monthlyXp !== undefined && entry.monthlyXp < entry.weeklyXp) {
      context.addIssue({
        code: 'custom',
        path: ['monthlyXp'],
        message: 'Monthly XP must be at least weekly XP.',
      })
    }
    if (entry.totalXp !== undefined && entry.totalXp < (entry.monthlyXp ?? entry.weeklyXp)) {
      context.addIssue({
        code: 'custom',
        path: ['totalXp'],
        message: 'Total XP must be at least monthly XP.',
      })
    }
  })

export const appConfigSchema = z.object({
  schemaVersion: z.literal('0.1'),
  app: z.object({
    name: z.string().min(1),
    cohortName: z.string().min(1),
  }),
  demo: z
    .strictObject({
      enabled: z.boolean(),
      defaultProfile: z.enum(['fresh', 'advanced']),
      profiles: z
        .array(
          z.strictObject({
            id: idSchema,
            label: z.string().trim().min(1),
            description: z.string().trim().min(1),
            seedProfile: z.enum(['fresh', 'advanced']),
          }),
        )
        .min(2),
    })
    .optional(),
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
    anatomy3d: z
      .strictObject({
        pixelRatioCap: z.number().positive().max(3),
        maxTriangleCountWarning: z.number().int().positive(),
        cameraAnimationDurationMs: z.number().int().nonnegative().max(10_000),
        viewEventDebounceMs: z.number().int().nonnegative().max(5_000),
        tapMaxMovementPx: z.number().positive(),
        flyThroughEasing: z.enum(['linear', 'ease_out', 'ease_in_out']),
        backgroundColor: z.string().regex(/^#[0-9a-f]{6}$/i),
        highlightColor: z.string().regex(/^#[0-9a-f]{6}$/i),
        highlightOpacity: z.number().min(0).max(1),
        markerColor: z.string().regex(/^#[0-9a-f]{6}$/i),
        comparisonStyles: z
          .strictObject({
            guess: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
            }),
            actual: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
            }),
          })
          .default({
            guess: { color: '#38bdf8', opacity: 0.78 },
            actual: { color: '#f6c453', opacity: 0.86 },
          }),
        volumeStyles: z
          .strictObject({
            color: z.string().regex(/^#[0-9a-f]{6}$/i),
            opacity: z.number().positive().max(1),
            highlightColor: z.string().regex(/^#[0-9a-f]{6}$/i),
            highlightOpacity: z.number().positive().max(1),
            contextOpacity: z.number().positive().max(1),
            emissiveIntensity: z.number().min(0).max(1),
            highlightEmissiveIntensity: z.number().min(0).max(1),
            roughness: z.number().min(0).max(1),
            metalness: z.number().min(0).max(1),
            widthSegments: z.number().int().min(8).max(64),
            heightSegments: z.number().int().min(6).max(48),
          })
          .default({
            color: '#38bdf8',
            opacity: 0.28,
            highlightColor: '#f6c453',
            highlightOpacity: 0.72,
            contextOpacity: 0.16,
            emissiveIntensity: 0.08,
            highlightEmissiveIntensity: 0.18,
            roughness: 0.62,
            metalness: 0,
            widthSegments: 24,
            heightSegments: 16,
          }),
        volumeValidation: z
          .strictObject({
            ancestorFitTolerance: z.number().min(0).max(0.5),
            sameLevelOverlapTolerance: z.number().min(0).max(1),
          })
          .default({
            ancestorFitTolerance: 0.05,
            sameLevelOverlapTolerance: 0.2,
          }),
        findingStyles: z
          .strictObject({
            lumen_narrowing: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
              maxRadiusReduction: z.number().positive().max(0.9),
              axialLengthRadiusMultiplier: z.number().positive().max(10),
            }),
            lumen_occlusion: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
              blobCount: z.number().int().min(1).max(24),
              blobRadiusRatio: z.number().positive().max(2),
              spreadRadiusRatio: z.number().nonnegative().max(2),
            }),
            wall_thickening: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
              thicknessRadiusRatio: z.number().positive().max(1),
              axialLengthRadiusMultiplier: z.number().positive().max(10),
            }),
            region: z.strictObject({
              color: z.string().regex(/^#[0-9a-f]{6}$/i),
              opacity: z.number().positive().max(1),
              scale: z.number().min(1).max(2),
            }),
            pickRadiusRatio: z.number().positive().max(2),
          })
          .default({
            lumen_narrowing: {
              color: '#f59e0b',
              opacity: 0.9,
              maxRadiusReduction: 0.65,
              axialLengthRadiusMultiplier: 1.8,
            },
            lumen_occlusion: {
              color: '#d6b36a',
              opacity: 0.92,
              blobCount: 7,
              blobRadiusRatio: 0.42,
              spreadRadiusRatio: 0.28,
            },
            wall_thickening: {
              color: '#ef4444',
              opacity: 0.72,
              thicknessRadiusRatio: 0.18,
              axialLengthRadiusMultiplier: 1.5,
            },
            region: {
              color: '#f97316',
              opacity: 0.3,
              scale: 1.01,
            },
            pickRadiusRatio: 0.45,
          }),
        lumen: z.strictObject({
          defaultRadius: z.number().positive(),
          radialSegments: z.number().int().min(6).max(64),
          tubularSegmentsPerConnection: z.number().int().min(1).max(128),
          color: z.string().regex(/^#[0-9a-f]{6}$/i),
          opacity: z.number().positive().max(1),
          roughness: z.number().min(0).max(1),
          curveStrength: z.number().min(0).max(1),
          headlight: z.strictObject({
            color: z.string().regex(/^#[0-9a-f]{6}$/i),
            intensity: z.number().nonnegative().max(20),
            distanceRadiusMultiplier: z.number().positive().max(100),
          }),
          fog: z.strictObject({
            color: z.string().regex(/^#[0-9a-f]{6}$/i),
            nearRadiusMultiplier: z.number().nonnegative().max(100),
            farRadiusMultiplier: z.number().positive().max(200),
          }),
          lookAround: z.strictObject({
            enabled: z.boolean(),
            degreesPerPixel: z.number().positive().max(5),
            maxYawDegrees: z.number().positive().max(90),
            maxPitchDegrees: z.number().positive().max(90),
            keyboardStepDegrees: z.number().positive().max(30).default(4),
          }),
          zoom: z
            .strictObject({
              enabled: z.boolean(),
              minFovDegrees: z.number().positive().max(120),
              maxFovDegrees: z.number().positive().max(120),
              step: z.number().positive().max(30),
            })
            .refine(({ minFovDegrees, maxFovDegrees }) => minFovDegrees < maxFovDegrees, {
              path: ['maxFovDegrees'],
              message: 'Maximum anatomy FOV must be greater than the minimum.',
            })
            .default({
              enabled: false,
              minFovDegrees: 28,
              maxFovDegrees: 64,
              step: 4,
            }),
          cues: z
            .strictObject({
              enabled: z.boolean(),
              depthTintColor: z.string().regex(/^#[0-9a-f]{6}$/i),
              depthTintStrength: z.number().min(0).max(1),
              branchRims: z.boolean(),
              branchRimColor: z.string().regex(/^#[0-9a-f]{6}$/i),
              branchRimOpacity: z.number().positive().max(1),
              branchRimTubeRadiusRatio: z.number().positive().max(0.25),
            })
            .default({
              enabled: false,
              depthTintColor: '#7f3b46',
              depthTintStrength: 0.22,
              branchRims: true,
              branchRimColor: '#e4a197',
              branchRimOpacity: 0.48,
              branchRimTubeRadiusRatio: 0.04,
            }),
          rings: z.strictObject({
            color: z.string().regex(/^#[0-9a-f]{6}$/i),
            opacity: z.number().positive().max(1),
            tubeRadiusRatio: z.number().positive().max(0.5),
            radialSegments: z.number().int().min(3).max(32),
            tubularSegments: z.number().int().min(3).max(64),
          }),
        }),
      })
      .default({
        pixelRatioCap: 1.5,
        maxTriangleCountWarning: 150_000,
        cameraAnimationDurationMs: 650,
        viewEventDebounceMs: 250,
        tapMaxMovementPx: 8,
        flyThroughEasing: 'ease_in_out',
        backgroundColor: '#050709',
        highlightColor: '#f6c453',
        highlightOpacity: 1,
        markerColor: '#f97316',
        comparisonStyles: {
          guess: { color: '#38bdf8', opacity: 0.78 },
          actual: { color: '#f6c453', opacity: 0.86 },
        },
        volumeStyles: {
          color: '#38bdf8',
          opacity: 0.28,
          highlightColor: '#f6c453',
          highlightOpacity: 0.72,
          contextOpacity: 0.16,
          emissiveIntensity: 0.08,
          highlightEmissiveIntensity: 0.18,
          roughness: 0.62,
          metalness: 0,
          widthSegments: 24,
          heightSegments: 16,
        },
        volumeValidation: {
          ancestorFitTolerance: 0.05,
          sameLevelOverlapTolerance: 0.2,
        },
        findingStyles: {
          lumen_narrowing: {
            color: '#f59e0b',
            opacity: 0.9,
            maxRadiusReduction: 0.65,
            axialLengthRadiusMultiplier: 1.8,
          },
          lumen_occlusion: {
            color: '#d6b36a',
            opacity: 0.92,
            blobCount: 7,
            blobRadiusRatio: 0.42,
            spreadRadiusRatio: 0.28,
          },
          wall_thickening: {
            color: '#ef4444',
            opacity: 0.72,
            thicknessRadiusRatio: 0.18,
            axialLengthRadiusMultiplier: 1.5,
          },
          region: {
            color: '#f97316',
            opacity: 0.3,
            scale: 1.01,
          },
          pickRadiusRatio: 0.45,
        },
        lumen: {
          defaultRadius: 0.06,
          radialSegments: 20,
          tubularSegmentsPerConnection: 12,
          color: '#b7675c',
          opacity: 1,
          roughness: 0.8,
          curveStrength: 0.35,
          headlight: {
            color: '#fff4e8',
            intensity: 3,
            distanceRadiusMultiplier: 12,
          },
          fog: {
            color: '#3a1118',
            nearRadiusMultiplier: 3,
            farRadiusMultiplier: 18,
          },
          lookAround: {
            enabled: true,
            degreesPerPixel: 0.12,
            maxYawDegrees: 24,
            maxPitchDegrees: 16,
            keyboardStepDegrees: 4,
          },
          zoom: {
            enabled: false,
            minFovDegrees: 28,
            maxFovDegrees: 64,
            step: 4,
          },
          cues: {
            enabled: false,
            depthTintColor: '#7f3b46',
            depthTintStrength: 0.22,
            branchRims: true,
            branchRimColor: '#e4a197',
            branchRimOpacity: 0.48,
            branchRimTubeRadiusRatio: 0.04,
          },
          rings: {
            color: '#d68b7f',
            opacity: 0.45,
            tubeRadiusRatio: 0.06,
            radialSegments: 8,
            tubularSegments: 24,
          },
        },
      }),
    offline: z.strictObject({
      downloadConcurrency: z.number().int().positive().max(8),
      quotaSafetyMarginRatio: z.number().min(0).max(0.5),
      requestPersistentStorage: z.boolean(),
      installPrompt: z.strictObject({
        minCompletedLessons: z.number().int().nonnegative(),
        dismissCooldownDays: z.number().int().nonnegative(),
      }),
    }),
    presentation: z
      .strictObject({
        haptics: z.strictObject({
          correctAnswer: z.array(z.number().int().positive().max(1000)).max(5),
          badgeUnlocked: z.array(z.number().int().positive().max(1000)).max(5),
          challengeCompleted: z.array(z.number().int().positive().max(1000)).max(5),
          gameRoundCorrect: z.array(z.number().int().positive().max(1000)).max(5).default([15]),
        }),
        confetti: z.strictObject({
          moments: z
            .array(
              z.enum([
                'three_star_lesson',
                'challenge_complete',
                'badge',
                'level_up',
                'game_complete',
              ]),
            )
            .max(5),
          particleCount: z.number().int().min(0).max(200),
          gameCompleteMinScoreRatio: z.number().min(0).max(1).default(0.75),
        }),
        xpCountUp: z.strictObject({
          minimumAmount: z.number().int().nonnegative(),
          maxDurationMs: z.number().int().positive().max(3000),
        }),
      })
      .default({
        haptics: {
          correctAnswer: [15],
          badgeUnlocked: [25, 40, 25],
          challengeCompleted: [30, 50, 30],
          gameRoundCorrect: [15],
        },
        confetti: {
          moments: ['three_star_lesson', 'challenge_complete'],
          particleCount: 80,
          gameCompleteMinScoreRatio: 0.75,
        },
        xpCountUp: {
          minimumAmount: 10,
          maxDurationMs: 900,
        },
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
  caseLab: caseLabConfigSchema.optional(),
  concepts: z.array(conceptSchema).default([]),
  pathways: z.array(pathwaySchema).default([]),
  badges: z.array(badgeSchema).default([]),
  challenges: z.array(challengeSchema).default([]),
  games: gameConfigSchema.optional(),
  leaderboard: z.strictObject({
    scope: z.string().min(1),
    period: z.enum(['weekly', 'monthly', 'all_time']).default('weekly'),
    simulated: z.boolean().default(false),
    entries: z.array(leaderboardEntrySchema).default([]),
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
  activityKind: z.enum(['lesson', 'challenge', 'case']),
  activityId: idSchema,
  sourceEventId: z.string().min(1).optional(),
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
  caseRewards: z.record(
    idSchema,
    z.object({
      completionAwarded: z.boolean(),
      perfectAwarded: z.boolean(),
      rewardedAttemptIds: z.array(z.string().min(1)),
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
    caseCompletions: z.record(idSchema, z.number().int().nonnegative()),
    caseCompletionsByTier: z.record(caseTierSchema, z.number().int().nonnegative()),
  }),
  activeRun: z
    .object({
      activityKind: z.enum(['lesson', 'challenge', 'case']),
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

export const caseProgressStateSchema = z.object({
  completions: z.number().int().nonnegative(),
  bestTotal: z.number().min(0).max(100).nullable(),
  lastCompletedAt: isoDateSchema.nullable(),
})

const caseAttemptRecordBaseSchema = z.strictObject({
  attemptId: z.string().min(1),
  tier: caseTierSchema,
  total: z.number().min(0).max(100),
  anatomy: z.number().min(0).max(1),
  diagnosis: z.number().min(0).max(1),
  speed: z.number().min(0).max(1),
  durationSeconds: z.number().nonnegative(),
  openedClueIds: z.array(idSchema),
  stepResults: z.array(
    z.strictObject({
      primitiveId: idSchema,
      firstAttemptScore: z.number().min(0).max(1),
      elapsedMs: z.number().nonnegative().optional(),
      timedOut: z.boolean(),
      response: z.unknown(),
    }),
  ),
  completedAt: isoDateSchema,
})

const legacyCaseAttemptRecordSchema = caseAttemptRecordBaseSchema.extend({
  resultVersion: z.literal(5),
})

const resultV6CaseAttemptRecordSchema = caseAttemptRecordBaseSchema.extend({
  resultVersion: z.literal(6),
  perStepSpeed: z.number().min(0).max(1),
  caseSpeed: z.number().min(0).max(1),
  clueCostPoints: z.number().min(0).max(100),
  speedScored: z.boolean(),
  timingMode: z.enum(['none', 'stopwatch', 'countdown']),
  weights: z.strictObject({
    anatomy: z.number().min(0).max(1),
    diagnosis: z.number().min(0).max(1),
    speed: z.number().min(0).max(1),
  }),
  actualAwardedXp: z.number().int().nonnegative().nullable(),
  actualAwardedXpSource: z.literal('gamification_activity_result').nullable(),
})

const caseEvidenceSchema = z.strictObject({
  pinned: z.array(
    z.strictObject({
      kind: z.enum(['clue', 'finding']),
      id: idSchema,
    }),
  ),
  inspectedFindingIds: z.array(idSchema).optional(),
  currentLocation: z
    .strictObject({
      kind: z.enum(['waypoint', 'structure']),
      id: idSchema,
    })
    .optional(),
})

const resultV7CaseAttemptRecordSchema = resultV6CaseAttemptRecordSchema
  .omit({ resultVersion: true })
  .extend({
    resultVersion: z.literal(7),
    speedModel: z.literal('time_eligible'),
    speedEligibility: z
      .strictObject({
        minStepScore: z.number().min(0).max(1),
        eligibleSteps: z.number().int().nonnegative(),
        totalScoredSteps: z.number().int().nonnegative(),
      })
      .refine(({ eligibleSteps, totalScoredSteps }) => eligibleSteps <= totalScoredSteps, {
        message: 'Eligible speed steps cannot exceed total scored steps.',
      }),
    reviewedClueIds: z.array(idSchema),
    evidence: caseEvidenceSchema,
    differential: z.record(idSchema, z.enum(['unlikely', 'possible', 'likely'])),
    timeoutCreditApplied: z.boolean(),
  })

const currentCaseAttemptRecordSchema = resultV7CaseAttemptRecordSchema
  .omit({ resultVersion: true })
  .extend({
    resultVersion: z.literal(8),
    differentialCheckpoints: z.record(
      idSchema,
      z.record(idSchema, z.enum(['unlikely', 'possible', 'likely'])),
    ),
  })

export const caseAttemptRecordSchema = z.discriminatedUnion('resultVersion', [
  legacyCaseAttemptRecordSchema,
  resultV6CaseAttemptRecordSchema,
  resultV7CaseAttemptRecordSchema,
  currentCaseAttemptRecordSchema,
])

export const gameRunRecordSchema = z.strictObject({
  resultVersion: z.literal(1),
  runId: z.string().min(1),
  difficulty: idSchema,
  seed: z.number().int().nonnegative(),
  mode: z.enum(['standard', 'daily', 'challenge', 'expert']),
  total: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  roundResults: z.array(
    z.strictObject({
      slotId: idSchema,
      roundId: idSchema,
      mechanic: z.enum(['spatial_look', 'spatial_explore', 'spot_finding', 'clinical_call']),
      accuracy: z.number().min(0).max(1),
      correct: z.boolean(),
      points: z.number().int().nonnegative(),
      basePoints: z.number().int().nonnegative(),
      speedBonus: z.number().int().nonnegative(),
      clueCost: z.number().int().nonnegative(),
      elapsedMs: z.number().nonnegative(),
      timedOut: z.boolean(),
    }),
  ),
  challengeToken: z.string().min(1).optional(),
  completedAt: isoDateSchema,
})

export const gameProgressStateSchema = z.strictObject({
  plays: z.number().int().nonnegative(),
  bestTotal: z.number().int().nonnegative().nullable(),
  bestByDifficulty: z.record(idSchema, z.number().int().nonnegative()),
  lastPlayedAt: isoDateSchema.nullable(),
  history: z.array(gameRunRecordSchema),
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
  caseProgress: z.record(idSchema, caseProgressStateSchema),
  caseAttempts: z.record(idSchema, z.array(caseAttemptRecordSchema)),
  games: z.record(idSchema, gameProgressStateSchema).default({}),
  gameDaily: z
    .strictObject({
      lastPlayedDate: z.iso.date().nullable(),
      streakDays: z.number().int().nonnegative(),
    })
    .default({ lastPlayedDate: null, streakDays: 0 }),
  player: z
    .strictObject({
      displayName: z.string().trim().min(1).nullable(),
    })
    .default({ displayName: null }),
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
    casesCompleted: z.number().int().nonnegative(),
    questionsAnswered: z.number().int().nonnegative(),
    correctAnswers: z.number().int().nonnegative(),
  }),
  onboarding: z.object({
    viewed: z.boolean(),
  }),
  caseLab: z.object({
    walkthroughSeen: z.boolean(),
    anatomyHintSeen: z.boolean().default(false),
  }),
})

const dicomSeriesMetadataSchema = z.strictObject({
  sliceCount: z.number().int().positive(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  pixelSpacingMm: z.tuple([z.number().positive(), z.number().positive()]),
  sliceThicknessMm: z.number().positive(),
  calibrated: z.boolean(),
})

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const provenanceSchema = z.strictObject({
  sourceUrl: z.url(),
  licence: z.string().trim().min(1),
  author: z.string().trim().min(1),
})
const boundsSchema = z
  .strictObject({
    min: z.tuple([z.number(), z.number(), z.number()]),
    max: z.tuple([z.number(), z.number(), z.number()]),
  })
  .refine(
    ({ min, max }) => min.every((minimum, index) => minimum <= (max[index] ?? minimum)),
    'Model bounds minimums must not exceed maximums.',
  )
const assetBaseShape = {
  assetId: idSchema,
  path: pathSchema,
  offlineRequired: z.boolean(),
  offlineAvailable: z.boolean(),
  sizeBytes: z.number().int().nonnegative(),
  provenance: provenanceSchema.optional(),
}

const standardAssetSchema = z.strictObject({
  ...assetBaseShape,
  type: z.enum(['image', 'video', 'audio', 'document', 'text']),
  sha256: sha256Schema,
  mimeType: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  series: z.never().optional(),
})

const dicomAssetSchema = z.strictObject({
  ...assetBaseShape,
  type: z.literal('dicom'),
  series: dicomSeriesMetadataSchema,
  sha256: z.never().optional(),
  width: z.never().optional(),
  height: z.never().optional(),
})

const modelAssetSchema = z.strictObject({
  ...assetBaseShape,
  type: z.literal('model'),
  mimeType: z.literal('model/gltf-binary'),
  offlineRequired: z.literal(false),
  sha256: sha256Schema,
  meshNames: z
    .array(z.string().trim().min(1))
    .min(1)
    .refine((names) => new Set(names).size === names.length, 'Model mesh names must be unique.'),
  triangleCount: z.number().int().positive(),
  bounds: boundsSchema,
  series: z.never().optional(),
  width: z.never().optional(),
  height: z.never().optional(),
})

const assetSchema = z.discriminatedUnion('type', [
  standardAssetSchema,
  dicomAssetSchema,
  modelAssetSchema,
])

export const assetManifestSchema = z.object({
  schemaVersion: z.literal('0.2'),
  assets: z.array(assetSchema),
})

export const contentManifestSchema = z
  .object({
    schemaVersion: z.literal('0.1'),
    appConfig: pathSchema,
    courses: z.array(pathSchema).default([]),
    cases: z.array(pathSchema).default([]),
    anatomyMaps: z.array(pathSchema).default([]),
    rounds: z.array(pathSchema).default([]),
    games: z.array(pathSchema).default([]),
    seeds: z.object({
      advanced: pathSchema.optional(),
      fresh: pathSchema.optional(),
    }),
    defaultSeed: z.enum(['advanced', 'fresh']),
    assetManifest: pathSchema,
  })
  .superRefine((manifest, context) => {
    if (manifest.seeds[manifest.defaultSeed]) return
    context.addIssue({
      code: 'custom',
      path: ['seeds', manifest.defaultSeed],
      message: `The default seed "${manifest.defaultSeed}" must have a configured path.`,
    })
  })

export type Course = z.infer<typeof courseSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type AppConfig = z.infer<typeof appConfigSchema>
export type RecordedOpponent = z.infer<typeof recordedOpponentSchema>
export type LearnerSeed = z.infer<typeof learnerSeedSchema>
export type CaseAttemptRecord = z.infer<typeof caseAttemptRecordSchema>
export type GameRunRecord = z.infer<typeof gameRunRecordSchema>
export type ContentManifest = z.infer<typeof contentManifestSchema>
export type AssetManifest = z.infer<typeof assetManifestSchema>
