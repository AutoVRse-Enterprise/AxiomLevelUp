import { z } from 'zod'

import { primitiveTypeSet } from '../primitiveTypes'

const idSchema = z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9_-]*$/)
const versionSchema = z.string().trim().min(1)
const pathSchema = z.string().trim().min(1)
const isoDateSchema = z.string().datetime({ offset: true })

export const rewardSchema = z.object({
  type: z.enum(['badge', 'certificate', 'points', 'recognition']),
  id: idSchema,
})

export const sourceSchema = z.object({
  title: z.string().min(1),
  section: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional(),
  url: z.url().optional(),
  artifactRef: z.string().optional(),
})

const timerSchema = z.object({
  durationSeconds: z.number().int().positive(),
  mode: z.enum(['countdown', 'elapsed']).default('countdown'),
})

const knownCompletionSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('viewed') }),
  z.object({ mode: z.literal('answer') }),
  z.object({
    mode: z.literal('minimum_interactions'),
    count: z.number().int().positive(),
  }),
  z.object({ mode: z.literal('measurement') }),
  z.object({ mode: z.literal('outcome') }),
  z.object({ mode: z.literal('interacted') }),
  z.object({ mode: z.literal('correct_order') }),
])

export const completionSchema = z
  .union([knownCompletionSchema, z.looseObject({ mode: z.string().min(1) })])
  .default({ mode: 'viewed' })

export const scoringSchema = z
  .looseObject({
    xp: z.number().int().nonnegative().optional(),
    difficulty: z.enum(['foundation', 'intermediate', 'advanced']).optional(),
    weight: z.number().positive().default(1),
  })
  .default({ weight: 1 })

export const feedbackSchema = z
  .looseObject({
    retry: z.boolean().optional(),
    maxAttempts: z.number().int().positive().optional(),
    correct: z.string().min(1).optional(),
    incorrect: z.string().min(1).optional(),
    hint: z.string().min(1).optional(),
  })
  .default({})

export const primitiveBaseSchema = z.object({
  id: idSchema,
  type: z.string().min(1),
  conceptIds: z.array(idSchema).default([]),
  content: z.record(z.string(), z.unknown()),
  assets: z.array(idSchema).default([]),
  completion: completionSchema,
  scoring: scoringSchema,
  feedback: feedbackSchema,
  reward: rewardSchema.optional(),
  source: sourceSchema.optional(),
  timer: timerSchema.optional(),
})

export const richTextPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('rich_text'),
  content: z.object({
    heading: z.string().optional(),
    body: z.string().min(1),
    emphasis: z.array(z.string()).optional(),
    bullets: z.array(z.string()).optional(),
    imageAssetId: idSchema.optional(),
    keyTakeaway: z.string().optional(),
  }),
})

export const imagePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('image'),
  content: z.object({
    assetId: idSchema,
    alt: z.string().min(1),
    caption: z.string().optional(),
    annotations: z
      .array(
        z.object({
          id: idSchema,
          label: z.string().min(1),
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
        }),
      )
      .optional(),
  }),
})

export const multipleChoicePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('multiple_choice'),
  content: z
    .object({
      prompt: z.string().min(1),
      options: z
        .array(z.object({ id: idSchema, label: z.string().min(1) }))
        .min(2),
      correctOptionId: idSchema,
      explanation: z.string().min(1),
    })
    .refine(
      (value) => value.options.some((option) => option.id === value.correctOptionId),
      'correctOptionId must reference one of the options',
    ),
})

const typedPrimitiveSchemas = {
  rich_text: richTextPrimitiveSchema,
  image: imagePrimitiveSchema,
  multiple_choice: multipleChoicePrimitiveSchema,
} as const

export type Primitive = z.infer<typeof primitiveBaseSchema>
export type RichTextPrimitive = z.infer<typeof richTextPrimitiveSchema>
export type ImagePrimitive = z.infer<typeof imagePrimitiveSchema>
export type MultipleChoicePrimitive = z.infer<typeof multipleChoicePrimitiveSchema>
export type Source = z.infer<typeof sourceSchema>

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

  if (type in typedPrimitiveSchemas) {
    const schema = typedPrimitiveSchemas[type as keyof typeof typedPrimitiveSchemas]
    const typedResult = schema.safeParse(input)
    if (!typedResult.success) {
      return { warnings: [], issues: typedResult.error.issues }
    }
    return { primitive: typedResult.data, warnings: [], issues: [] }
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
  xpReward: z.number().int().nonnegative(),
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
})

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
    }),
  }),
  gamification: z.object({
    xp: z.record(z.string(), z.number().int().nonnegative()),
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
    mastery: z.object({
      gain: z.number().positive(),
      loss: z.number().positive(),
      difficultyWeights: z.record(z.string(), z.number().positive()),
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
      progress: z.number().min(0).max(100),
    }),
  ),
  mastery: z.record(idSchema, masteryStateSchema),
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

export const assetManifestSchema = z.object({
  schemaVersion: z.literal('0.1'),
  assets: z.array(
    z.object({
      assetId: idSchema,
      path: pathSchema,
      type: z.enum(['image', 'video', 'audio', 'dicom', 'document']),
      offlineRequired: z.boolean(),
      sizeBytes: z.number().int().nonnegative().optional(),
    }),
  ),
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
