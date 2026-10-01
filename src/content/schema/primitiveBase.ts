import { z } from 'zod'

export const idSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9_-]*$/)

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

export type Primitive = z.infer<typeof primitiveBaseSchema>
export type Source = z.infer<typeof sourceSchema>
