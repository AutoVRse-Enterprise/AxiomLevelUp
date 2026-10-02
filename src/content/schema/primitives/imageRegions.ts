import { z } from 'zod'

import { idSchema } from '../primitiveBase'

export const normalizedPointSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

const regionDetailsSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  clueIds: z.array(idSchema).min(1).optional(),
})

const circleRegionSchema = regionDetailsSchema
  .extend({
    shape: z.literal('circle'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    radius: z.number().positive().max(1),
  })
  .refine(
    ({ x, y, radius }) => x - radius >= 0 && x + radius <= 1 && y - radius >= 0 && y + radius <= 1,
    { message: 'Circle regions must fit inside the normalized image bounds.' },
  )

const rectRegionSchema = regionDetailsSchema
  .extend({
    shape: z.literal('rect'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine(({ x, y, width, height }) => x + width <= 1 && y + height <= 1, {
    message: 'Rectangle regions must fit inside the normalized image bounds.',
  })

const polygonRegionSchema = regionDetailsSchema
  .extend({
    shape: z.literal('polygon'),
    points: z.array(normalizedPointSchema).min(3),
  })
  .refine(({ points }) => new Set(points.map(({ x, y }) => `${x}:${y}`)).size === points.length, {
    message: 'Polygon vertices must be unique.',
    path: ['points'],
  })

export const imageRegionSchema = z.discriminatedUnion('shape', [
  circleRegionSchema,
  rectRegionSchema,
  polygonRegionSchema,
])

export type ImageRegion = z.infer<typeof imageRegionSchema>
export type NormalizedPoint = z.infer<typeof normalizedPointSchema>

export function hasUniqueRegionIds(regions: readonly ImageRegion[]): boolean {
  return new Set(regions.map(({ id }) => id)).size === regions.length
}
