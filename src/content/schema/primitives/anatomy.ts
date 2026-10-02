import { z } from 'zod'

import { clueIdsSchema, idSchema, primitiveBaseSchema } from '../primitiveBase'
import { hasUniqueRegionIds, imageRegionSchema } from './imageRegions'
import type { PrimitiveContentSchema } from './types'

export const anatomyStartViewSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('overview') }),
  z.strictObject({ mode: z.literal('marker'), structureId: idSchema }),
  z.strictObject({ mode: z.literal('waypoint'), waypointId: idSchema }),
])

export const anatomyNavigationSchema = z.enum(['orbit', 'flythrough', 'both'])

const anatomyLocateLevelBase = {
  levelId: idSchema,
  weight: z.number().positive().optional(),
  clueIds: clueIdsSchema.optional(),
}

const anatomyLocateModelLevelSchema = z.strictObject({
  ...anatomyLocateLevelBase,
  input: z.literal('model'),
  targetStructureId: idSchema,
})

const anatomyLocateImageLevelSchema = z
  .strictObject({
    ...anatomyLocateLevelBase,
    input: z.literal('image'),
    assetId: idSchema,
    alt: z.string().trim().min(1),
    caption: z.string().trim().min(1).optional(),
    regions: z.array(imageRegionSchema).min(2),
    targetRegionId: idSchema,
  })
  .refine(({ regions }) => hasUniqueRegionIds(regions), {
    path: ['regions'],
    message: 'Anatomy image region IDs must be unique.',
  })
  .refine(({ regions, targetRegionId }) => regions.some(({ id }) => id === targetRegionId), {
    path: ['targetRegionId'],
    message: 'targetRegionId must reference one of the configured regions.',
  })

export const anatomyLocateChoiceOptionSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  clueIds: clueIdsSchema.optional(),
})

const anatomyLocateChoiceLevelSchema = z
  .strictObject({
    ...anatomyLocateLevelBase,
    input: z.literal('choice'),
    options: z.array(anatomyLocateChoiceOptionSchema).min(2),
    correctOptionId: idSchema,
  })
  .refine(({ options }) => new Set(options.map(({ id }) => id)).size === options.length, {
    path: ['options'],
    message: 'Anatomy choice option IDs must be unique.',
  })
  .refine(({ correctOptionId, options }) => options.some(({ id }) => id === correctOptionId), {
    path: ['correctOptionId'],
    message: 'correctOptionId must reference one of the configured options.',
  })

export const anatomyLocateLevelSchema = z.discriminatedUnion('input', [
  anatomyLocateModelLevelSchema,
  anatomyLocateImageLevelSchema,
  anatomyLocateChoiceLevelSchema,
])

export const anatomyExplorePrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('anatomy_explore'),
    content: z.strictObject({
      anatomyMapId: idSchema,
      prompt: z.string().trim().min(1),
      startView: anatomyStartViewSchema.default({ mode: 'overview' }),
      navigation: anatomyNavigationSchema.default('both'),
      requiredWaypointIds: z.array(idSchema).min(1).optional(),
      requiredStructureIds: z.array(idSchema).min(1).optional(),
    }),
  })
  .superRefine((primitive, context) => {
    if (!['viewed', 'explored', 'minimum_interactions'].includes(primitive.completion.mode)) {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message:
          'Anatomy exploration requires viewed, explored or minimum_interactions completion.',
      })
    }

    for (const [field, ids] of [
      ['requiredWaypointIds', primitive.content.requiredWaypointIds],
      ['requiredStructureIds', primitive.content.requiredStructureIds],
    ] as const) {
      if (ids && new Set(ids).size !== ids.length) {
        context.addIssue({
          code: 'custom',
          path: ['content', field],
          message: 'Required anatomy IDs must be unique.',
        })
      }
    }

    const requiredCount =
      (primitive.content.requiredWaypointIds?.length ?? 0) +
      (primitive.content.requiredStructureIds?.length ?? 0)
    if (primitive.completion.mode === 'explored') {
      if (requiredCount === 0) {
        context.addIssue({
          code: 'custom',
          path: ['content'],
          message: 'Explored anatomy completion requires at least one configured target.',
        })
      }
      if (
        'count' in primitive.completion &&
        typeof primitive.completion.count === 'number' &&
        primitive.completion.count > requiredCount
      ) {
        context.addIssue({
          code: 'custom',
          path: ['completion', 'count'],
          message:
            'Explored completion count cannot exceed the number of required anatomy targets.',
        })
      }
    }

    if (primitive.content.navigation === 'orbit' && primitive.content.requiredWaypointIds?.length) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'requiredWaypointIds'],
        message: 'Required waypoints need flythrough navigation.',
      })
    }
  })

export const anatomyLocatePrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('anatomy_locate'),
    content: z
      .strictObject({
        anatomyMapId: idSchema,
        prompt: z.string().trim().min(1),
        startView: anatomyStartViewSchema.default({ mode: 'overview' }),
        levels: z.array(anatomyLocateLevelSchema).min(1),
        explanation: z.string().trim().min(1).optional(),
      })
      .refine(
        ({ levels }) => new Set(levels.map(({ levelId }) => levelId)).size === levels.length,
        {
          path: ['levels'],
          message: 'Anatomy locate level IDs must be unique.',
        },
      ),
  })
  .superRefine((primitive, context) => {
    if (primitive.completion.mode !== 'answer') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'Anatomy localisation requires answer completion.',
      })
    }
  })

export type AnatomyExplorePrimitive = z.infer<typeof anatomyExplorePrimitiveSchema>
export type AnatomyLocatePrimitive = z.infer<typeof anatomyLocatePrimitiveSchema>
export type AnatomyLocateLevel = z.infer<typeof anatomyLocateLevelSchema>
export type AnatomyLocateChoiceOption = z.infer<typeof anatomyLocateChoiceOptionSchema>
export type AnatomyNavigation = z.infer<typeof anatomyNavigationSchema>
export type AnatomyStartViewContent = z.infer<typeof anatomyStartViewSchema>

export const anatomyExploreContentSchema = {
  schema: anatomyExplorePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<AnatomyExplorePrimitive>

export const anatomyLocateContentSchema = {
  schema: anatomyLocatePrimitiveSchema,
  assetRefs: (primitive) =>
    primitive.content.levels.flatMap((level, index) =>
      level.input === 'image'
        ? [
            {
              assetId: level.assetId,
              type: 'image' as const,
              path: `content.levels.${index}.assetId`,
            },
          ]
        : [],
    ),
} satisfies PrimitiveContentSchema<AnatomyLocatePrimitive>
