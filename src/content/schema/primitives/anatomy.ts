import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const anatomyStartViewSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('overview') }),
  z.strictObject({ mode: z.literal('marker'), structureId: idSchema }),
  z.strictObject({ mode: z.literal('waypoint'), waypointId: idSchema }),
])

export const anatomyNavigationSchema = z.enum(['orbit', 'flythrough', 'both'])

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

export type AnatomyExplorePrimitive = z.infer<typeof anatomyExplorePrimitiveSchema>
export type AnatomyNavigation = z.infer<typeof anatomyNavigationSchema>
export type AnatomyStartViewContent = z.infer<typeof anatomyStartViewSchema>

export const anatomyExploreContentSchema = {
  schema: anatomyExplorePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<AnatomyExplorePrimitive>
