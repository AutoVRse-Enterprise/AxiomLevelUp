import { z } from 'zod'

import { clueIdsSchema, idSchema } from './primitiveBase'

const vector3Schema = z.tuple([z.number(), z.number(), z.number()])

const anatomyLevelSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  clueIds: clueIdsSchema.optional(),
})

const anatomyStructureBase = {
  id: idSchema,
  levelId: idSchema,
  parentId: idSchema.optional(),
  label: z.string().trim().min(1),
  clueIds: clueIdsSchema.optional(),
}

const meshAnatomyStructureSchema = z.strictObject({
  ...anatomyStructureBase,
  meshNames: z.array(z.string().trim().min(1)).min(1),
})

const volumeAnatomyStructureSchema = z.strictObject({
  ...anatomyStructureBase,
  volume: z.strictObject({
    shape: z.literal('ellipsoid'),
    center: vector3Schema,
    radii: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]),
    rotation: vector3Schema.optional(),
  }),
})

const anatomyStructureSchema = z.union([meshAnatomyStructureSchema, volumeAnatomyStructureSchema])

const anatomyWaypointSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  position: vector3Schema,
  lookAt: vector3Schema,
  next: z.array(idSchema),
  radius: z.number().positive().optional(),
  lumen: z
    .strictObject({
      ringCount: z.number().int().nonnegative().max(64).default(0),
    })
    .optional(),
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
export type AnatomyStructure = AnatomyMap['structures'][number]
export type AnatomyVolumeStructure = Extract<AnatomyStructure, { volume: unknown }>

export function isVolumeStructure(
  structure: AnatomyStructure,
): structure is AnatomyVolumeStructure {
  return 'volume' in structure
}
