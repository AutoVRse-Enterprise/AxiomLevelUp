import { z } from 'zod'

import { contentPrimitiveTypes } from '../primitiveTypes'
import { idSchema, primitiveBaseSchema } from './primitiveBase'

const versionSchema = z.string().trim().min(1)
const nonEmptyStringSchema = z.string().trim().min(1)

export const caseTierSchema = z.enum(['foundation', 'intermediate', 'advanced'])
export const caseStageKindSchema = z.enum(['orient', 'observe', 'interpret', 'diagnose'])
export const caseStageComponentSchema = z.enum(['anatomy', 'diagnosis', 'none'])
export const caseFindingKindSchema = z.enum([
  'lumen_narrowing',
  'lumen_occlusion',
  'wall_thickening',
  'region',
])

export const caseFindingAnchorSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('waypoint'),
    waypoint: idSchema,
    toWaypoint: idSchema,
    t: z.number().min(0).max(1),
  }),
  z.strictObject({
    type: z.literal('structure'),
    structure: idSchema,
  }),
])

export const caseFindingSchema = z.strictObject({
  id: idSchema,
  label: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  significance: nonEmptyStringSchema.optional(),
  kind: caseFindingKindSchema,
  anchor: caseFindingAnchorSchema,
  severity: z.number().positive().max(1),
  clueIds: z.array(idSchema).default([]),
})

export const caseStepSchema = primitiveBaseSchema

export const caseCluePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.enum(contentPrimitiveTypes),
})

export const caseClueSchema = z.strictObject({
  id: idSchema,
  category: idSchema,
  title: nonEmptyStringSchema,
  essential: z.boolean(),
  primitive: caseCluePrimitiveSchema,
})

export const caseDifferentialItemSchema = z.strictObject({
  id: idSchema,
  label: nonEmptyStringSchema,
  description: nonEmptyStringSchema.optional(),
})

export const caseEvidenceRefSchema = z.strictObject({
  kind: z.enum(['clue', 'finding']),
  id: idSchema,
})

export const caseExpertPathItemSchema = z.strictObject({
  label: nonEmptyStringSchema,
  detail: nonEmptyStringSchema,
})

export const caseEvidenceWeightSchema = z.strictObject({
  ref: caseEvidenceRefSchema,
  weight: z.enum(['decisive', 'supporting', 'context']),
  note: nonEmptyStringSchema,
})

export const caseKeyEvidenceSchema = z.strictObject({
  ref: caseEvidenceRefSchema,
  stepIds: z.array(idSchema),
  why: nonEmptyStringSchema,
})

export const caseStageSchema = z.strictObject({
  id: idSchema,
  kind: caseStageKindSchema,
  component: caseStageComponentSchema,
  title: nonEmptyStringSchema,
  purpose: nonEmptyStringSchema,
  intro: nonEmptyStringSchema.optional(),
  update: z
    .strictObject({
      timeLabel: nonEmptyStringSchema,
      narrative: nonEmptyStringSchema,
    })
    .optional(),
  clueIds: z.array(idSchema).default([]),
  steps: z.array(caseStepSchema).min(1),
})

export const caseEntrySchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('overview_marker'),
    markerStructureId: idSchema,
  }),
  z.strictObject({
    mode: z.literal('clue_first'),
    clueId: idSchema,
  }),
  z.strictObject({
    mode: z.literal('endoscopic'),
    waypointId: idSchema,
  }),
  z.strictObject({
    mode: z.literal('unknown_waypoint'),
    candidateWaypointIds: z.array(idSchema).min(2),
    neutralLabels: z.literal(true),
  }),
])

export const caseTimingSchema = z
  .strictObject({
    caseTargetSeconds: z.number().int().positive(),
    caseMaxSeconds: z.number().int().positive(),
  })
  .refine(({ caseMaxSeconds, caseTargetSeconds }) => caseMaxSeconds > caseTargetSeconds, {
    path: ['caseMaxSeconds'],
    message: 'caseMaxSeconds must be greater than caseTargetSeconds',
  })

export const caseDocumentSchema = z.strictObject({
  schemaVersion: z.literal('0.2'),
  caseVersion: versionSchema,
  id: idSchema,
  title: nonEmptyStringSchema,
  summary: nonEmptyStringSchema,
  mission: z.strictObject({
    role: nonEmptyStringSchema,
    objective: nonEmptyStringSchema,
    deliverables: z.array(nonEmptyStringSchema).min(2).max(4),
  }),
  tier: caseTierSchema,
  organSystem: idSchema,
  estimatedMinutes: z.number().int().positive(),
  conceptIds: z.array(idSchema).min(1),
  patient: z.strictObject({
    label: nonEmptyStringSchema,
    age: z.number().int().nonnegative().optional(),
    sex: nonEmptyStringSchema.optional(),
    presentingComplaint: nonEmptyStringSchema,
    history: z.array(nonEmptyStringSchema).default([]),
    imageAssetId: idSchema.optional(),
  }),
  anatomyMapId: idSchema,
  entry: caseEntrySchema,
  findings: z.array(caseFindingSchema).optional(),
  differential: z.array(caseDifferentialItemSchema).min(2).optional(),
  clues: z.array(caseClueSchema).min(1),
  stages: z.array(caseStageSchema).min(1).max(4),
  timing: caseTimingSchema.optional(),
  expertBenchmark: z.strictObject({
    kind: z.literal('model_answer'),
    name: nonEmptyStringSchema,
    durationSeconds: z.number().int().positive(),
    openedClueIds: z.array(idSchema),
    responses: z.record(idSchema, z.unknown()),
    rationales: z.record(idSchema, nonEmptyStringSchema),
    stepTimings: z.record(
      idSchema,
      z.strictObject({
        elapsedMs: z.number().nonnegative(),
        timedOut: z.boolean(),
      }),
    ),
    path: z.array(caseExpertPathItemSchema).min(1),
    evidenceWeights: z.array(caseEvidenceWeightSchema).min(1),
    diagnosisRationale: nonEmptyStringSchema,
    breakdown: z.strictObject({
      anatomy: z.number().min(0).max(1),
      diagnosis: z.number().min(0).max(1),
      speed: z.number().min(0).max(1),
    }),
  }),
  debrief: z.strictObject({
    summary: nonEmptyStringSchema,
    keyEvidence: z.array(caseKeyEvidenceSchema).min(1),
  }),
})

const normalizedWeightsSchema = z
  .strictObject({
    anatomy: z.number().min(0).max(1),
    diagnosis: z.number().min(0).max(1),
    speed: z.number().min(0).max(1),
  })
  .refine(({ anatomy, diagnosis, speed }) => Math.abs(anatomy + diagnosis + speed - 1) < 0.000001, {
    message: 'Case scoring weights must sum to 1',
  })

const speedBlendSchema = z
  .strictObject({
    perStep: z.number().min(0).max(1),
    perCase: z.number().min(0).max(1),
  })
  .refine(({ perCase, perStep }) => Math.abs(perStep + perCase - 1) < 0.000001, {
    message: 'Case speed blend weights must sum to 1',
  })

const caseTierPresetSchema = z.strictObject({
  label: nonEmptyStringSchema,
  timing: z.enum(['none', 'stopwatch', 'countdown']),
  hints: z.enum(['full', 'reduced']),
  labelEssentialClues: z.boolean(),
})

const caseHowItWorksStepSchema = z.strictObject({
  id: z.enum(['first_attempt', 'optional_clues', 'timing', 'hints']),
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
})

export const caseLabConfigSchema = z
  .strictObject({
    title: nonEmptyStringSchema,
    featuredCaseId: idSchema,
    caseIds: z.array(idSchema).min(1),
    dailyQuickCaseId: idSchema,
    howItWorks: z
      .array(caseHowItWorksStepSchema)
      .length(4)
      .refine((steps) => new Set(steps.map(({ id }) => id)).size === steps.length, {
        message: 'How this case works steps must have unique IDs',
      }),
    organSystems: z.record(idSchema, nonEmptyStringSchema),
    clueCategories: z
      .array(
        z.strictObject({
          id: idSchema,
          label: nonEmptyStringSchema,
        }),
      )
      .min(1),
    clueReview: z.strictObject({
      minVisibleMs: z.number().int().positive(),
      mediaProgressThreshold: z.number().positive().max(1),
    }),
    tiers: z.strictObject({
      foundation: caseTierPresetSchema,
      intermediate: caseTierPresetSchema,
      advanced: caseTierPresetSchema,
    }),
    scoring: z.strictObject({
      weights: normalizedWeightsSchema,
      speedBlend: speedBlendSchema,
      speedEligibility: z
        .strictObject({
          minStepScore: z.number().min(0).max(1),
        })
        .default({ minStepScore: 0.5 }),
      defaultStepTargetSeconds: z.number().int().positive(),
      defaultStepMaxSeconds: z.number().int().positive(),
      cluePenalty: z.strictObject({
        perOptionalClue: z.number().nonnegative(),
        cap: z.number().min(0).max(100),
      }),
    }),
    xp: z.strictObject({
      caseComplete: z.number().int().nonnegative(),
      perfectCaseBonus: z.number().int().nonnegative(),
    }),
    historyLimit: z.number().int().positive(),
  })
  .refine(({ scoring }) => scoring.defaultStepMaxSeconds > scoring.defaultStepTargetSeconds, {
    path: ['scoring', 'defaultStepMaxSeconds'],
    message: 'defaultStepMaxSeconds must be greater than defaultStepTargetSeconds',
  })

export type CaseDocument = z.infer<typeof caseDocumentSchema>
export type CaseFinding = z.infer<typeof caseFindingSchema>
export type CaseFindingAnchor = z.infer<typeof caseFindingAnchorSchema>
export type CaseDifferentialItem = z.infer<typeof caseDifferentialItemSchema>
export type CaseStep = z.infer<typeof caseStepSchema>
export type CaseClue = z.infer<typeof caseClueSchema>
export type CaseStage = z.infer<typeof caseStageSchema>
export type CaseLabConfig = z.infer<typeof caseLabConfigSchema>
