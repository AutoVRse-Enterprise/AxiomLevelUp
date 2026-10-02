import { z } from 'zod'

import { idSchema } from './primitiveBase'

const vector3Schema = z.tuple([z.number(), z.number(), z.number()])

const anatomyLevelSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
})

const anatomyStructureSchema = z.strictObject({
  id: idSchema,
  levelId: idSchema,
  parentId: idSchema.optional(),
  label: z.string().trim().min(1),
  meshNames: z.array(z.string().trim().min(1)).min(1),
})

const anatomyWaypointSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  position: vector3Schema,
  lookAt: vector3Schema,
  next: z.array(idSchema),
  radius: z.number().positive().optional(),
})

export const anatomyMapSchema = z.strictObject({
  schemaVersion: z.literal('0.1'),
  id: idSchema,
  modelAssetId: idSchema,
  levels: z.array(anatomyLevelSchema).min(1),
  structures: z.array(anatomyStructureSchema).min(1),
  waypoints: z.array(anatomyWaypointSchema).min(1),
})

export type AnatomyMap = z.infer<typeof anatomyMapSchema>
