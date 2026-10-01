import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const numericAxisSchema = z.strictObject({
  label: z.string().trim().min(1),
  unit: z.string().trim().min(1).optional(),
  scale: z.enum(['linear', 'log']),
})

const categoryAxisSchema = z.strictObject({
  label: z.string().trim().min(1),
  unit: z.string().trim().min(1).optional(),
  scale: z.literal('category'),
})

const numericPointSchema = z.strictObject({
  id: idSchema,
  x: z.number(),
  y: z.number(),
  label: z.string().trim().min(1).optional(),
})

const positivePointSchema = numericPointSchema.extend({
  x: z.number().positive(),
})

const numericSeriesSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  points: z.array(numericPointSchema).min(1),
})

const doseSeriesSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  points: z.array(positivePointSchema).min(1),
})

const barSeriesSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  values: z
    .array(
      z.strictObject({
        id: idSchema,
        category: z.string().trim().min(1),
        value: z.number(),
        label: z.string().trim().min(1).optional(),
      }),
    )
    .min(1),
})

const fourParameterLogisticSchema = z.strictObject({
  bottom: z.number(),
  top: z.number(),
  ec50: z.number().positive(),
  hill: z.number().refine((value) => value !== 0, 'hill must not be zero'),
  showEc50Marker: z.boolean().default(true),
})

const sharedChartContent = {
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1),
}

const lineOrScatterContentSchema = z.strictObject({
  ...sharedChartContent,
  chartType: z.enum(['line', 'scatter']),
  axes: z.strictObject({
    x: numericAxisSchema,
    y: numericAxisSchema,
  }),
  series: z.array(numericSeriesSchema).min(1),
})

const barContentSchema = z.strictObject({
  ...sharedChartContent,
  chartType: z.literal('bar'),
  axes: z.strictObject({
    x: categoryAxisSchema,
    y: numericAxisSchema,
  }),
  series: z.array(barSeriesSchema).min(1),
})

const doseResponseContentSchema = z.strictObject({
  ...sharedChartContent,
  chartType: z.literal('dose_response'),
  axes: z.strictObject({
    x: numericAxisSchema.extend({ scale: z.literal('log') }),
    y: numericAxisSchema,
  }),
  series: z.array(doseSeriesSchema).min(1),
  fourParameterLogistic: fourParameterLogisticSchema.optional(),
})

const chartContentContractSchema = z
  .discriminatedUnion('chartType', [
    lineOrScatterContentSchema,
    barContentSchema,
    doseResponseContentSchema,
  ])
  .superRefine((content, context) => {
    const seriesIds = content.series.map((series) => series.id)
    if (new Set(seriesIds).size !== seriesIds.length) {
      context.addIssue({ code: 'custom', path: ['series'], message: 'series IDs must be unique' })
    }
    content.series.forEach((series, seriesIndex) => {
      const pointIds =
        'points' in series
          ? series.points.map((point) => point.id)
          : series.values.map((value) => value.id)
      if (new Set(pointIds).size !== pointIds.length) {
        context.addIssue({
          code: 'custom',
          path: ['series', seriesIndex],
          message: 'data point IDs must be unique within a series',
        })
      }
    })

    const yValues = content.series.flatMap((series) =>
      'points' in series
        ? series.points.map((point) => point.y)
        : series.values.map((value) => value.value),
    )
    if (content.axes.y.scale === 'log' && yValues.some((value) => value <= 0)) {
      context.addIssue({
        code: 'custom',
        path: ['series'],
        message: 'logarithmic y axes require positive values',
      })
    }
    if (
      content.chartType !== 'bar' &&
      content.axes.x.scale === 'log' &&
      content.series.some((series) => series.points.some((point) => point.x <= 0))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['series'],
        message: 'logarithmic x axes require positive values',
      })
    }
    if (
      content.chartType === 'dose_response' &&
      content.axes.y.scale === 'log' &&
      content.fourParameterLogistic &&
      (content.fourParameterLogistic.bottom <= 0 || content.fourParameterLogistic.top <= 0)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['fourParameterLogistic'],
        message: 'logarithmic y axes require positive 4PL asymptotes',
      })
    }
  })

export const chartPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('chart'),
  content: chartContentContractSchema,
})

export type ChartPrimitive = z.infer<typeof chartPrimitiveSchema>
export type NumericChartPrimitive = Extract<
  ChartPrimitive,
  { content: { chartType: 'line' | 'scatter' | 'dose_response' } }
>

export const chartContentSchema = {
  schema: chartPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<ChartPrimitive>
