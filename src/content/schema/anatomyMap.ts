import { z } from 'zod'

import { idSchema } from './primitiveBase'

const identifiedPlaceholderSchema = z.looseObject({
  id: idSchema,
})

/**
 * P10-T02 only needs an addressable document that the loader can carry and
 * case-entry references can inspect. P10-T03 owns the strict hierarchy,
 * waypoint graph, model metadata, and mesh-binding contract.
 */
export const anatomyMapSchema = z.looseObject({
  schemaVersion: z.literal('0.1'),
  id: idSchema,
  modelAssetId: idSchema.optional(),
  structures: z.array(identifiedPlaceholderSchema).optional(),
  waypoints: z.array(identifiedPlaceholderSchema).optional(),
})

export type AnatomyMap = z.infer<typeof anatomyMapSchema>
