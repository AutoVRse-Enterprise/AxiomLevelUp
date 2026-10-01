import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import { imageRegionSchema, normalizedPointSchema } from './imageRegions'
import type { PrimitiveContentSchema } from './types'

export const dicomPresetSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  center: z.number().finite(),
  width: z.number().positive(),
})

export const dicomSliceRangeSchema = z
  .strictObject({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
  })
  .refine(({ from, to }) => from <= to, {
    message: 'Slice range must start at or before its end.',
  })

export const dicomToolSchema = z.enum(['scroll', 'window', 'zoom', 'pan', 'measure'])

const commonContent = {
  seriesAssetId: idSchema,
  prompt: z.string().min(1),
  presets: z.array(dicomPresetSchema).min(1),
  initialSlice: z.number().int().positive().optional(),
  initialPresetId: idSchema.optional(),
  tools: z.array(dicomToolSchema).min(1).optional(),
  educationalUseOnly: z.literal(true),
}

const exploreRequirementsSchema = z
  .strictObject({
    minimumInteractions: z.number().int().positive().optional(),
    visitSliceRange: dicomSliceRangeSchema.optional(),
    presetIds: z.array(idSchema).min(1).optional(),
  })
  .refine(
    (value) =>
      value.minimumInteractions !== undefined ||
      value.visitSliceRange !== undefined ||
      value.presetIds !== undefined,
    { message: 'Explore requirements must declare at least one condition.' },
  )

export const dicomExplorePrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('dicom_explore'),
    content: z.strictObject({
      ...commonContent,
      requirements: exploreRequirementsSchema.optional(),
    }),
  })
  .superRefine((primitive, context) => {
    validateCommon(primitive.content, context)
    const configured = new Set(primitive.content.presets.map(({ id }) => id))
    primitive.content.requirements?.presetIds?.forEach((id, index) => {
      if (!configured.has(id)) {
        context.addIssue({
          code: 'custom',
          path: ['content', 'requirements', 'presetIds', index],
          message: 'Required preset must reference a configured preset.',
        })
      }
    })
    if (!['viewed', 'minimum_interactions', 'explored'].includes(primitive.completion.mode)) {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'DICOM exploration requires viewed, minimum_interactions or explored completion.',
      })
    }
  })

const guidedConditionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('slice_range'), range: dicomSliceRangeSchema }),
  z.strictObject({ type: z.literal('preset'), presetId: idSchema }),
  z.strictObject({ type: z.literal('tool'), tool: dicomToolSchema }),
  z.strictObject({ type: z.literal('interaction'), count: z.number().int().positive().default(1) }),
  z.strictObject({ type: z.literal('acknowledge') }),
])

const checkpointSchema = z
  .strictObject({
    prompt: z.string().min(1),
    options: z.array(z.strictObject({ id: idSchema, label: z.string().min(1) })).min(2),
    correctOptionId: idSchema,
    explanation: z.string().min(1),
  })
  .superRefine((checkpoint, context) => {
    const ids = checkpoint.options.map(({ id }) => id)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', path: ['options'], message: 'Option IDs must be unique.' })
    }
    if (!ids.includes(checkpoint.correctOptionId)) {
      context.addIssue({
        code: 'custom',
        path: ['correctOptionId'],
        message: 'The correct option must reference a configured option.',
      })
    }
  })

export const dicomGuidedPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('dicom_guided'),
    content: z.strictObject({
      ...commonContent,
      steps: z
        .array(
          z.strictObject({
            id: idSchema,
            instruction: z.string().min(1),
            condition: guidedConditionSchema,
          }),
        )
        .min(1),
      checkpoint: checkpointSchema.optional(),
    }),
  })
  .superRefine((primitive, context) => {
    validateCommon(primitive.content, context)
    const ids = primitive.content.steps.map(({ id }) => id)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'steps'],
        message: 'Guided step IDs must be unique.',
      })
    }
    const configured = new Set(primitive.content.presets.map(({ id }) => id))
    primitive.content.steps.forEach((step, index) => {
      if (step.condition.type === 'preset' && !configured.has(step.condition.presetId)) {
        context.addIssue({
          code: 'custom',
          path: ['content', 'steps', index, 'condition', 'presetId'],
          message: 'Guided preset condition must reference a configured preset.',
        })
      }
      if (
        step.condition.type === 'tool' &&
        primitive.content.tools &&
        !primitive.content.tools.includes(step.condition.tool)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['content', 'steps', index, 'condition', 'tool'],
          message: 'Guided tool condition must reference an enabled tool.',
        })
      }
    })
    if (
      primitive.content.checkpoint
        ? primitive.completion.mode !== 'answer'
        : !['explored', 'viewed'].includes(primitive.completion.mode)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: primitive.content.checkpoint
          ? 'Guided activities with a checkpoint must use answer completion.'
          : 'Guided activities without a checkpoint must use explored or viewed completion.',
      })
    }
  })

export const dicomIdentifyRegionPrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('dicom_identify_region'),
    content: z.strictObject({
      ...commonContent,
      target: z.strictObject({
        sliceRange: dicomSliceRangeSchema,
        referenceSlice: z.number().int().positive(),
        region: imageRegionSchema,
      }),
      explanation: z.string().min(1),
      sliceFeedback: z.string().min(1).optional(),
      locationFeedback: z.string().min(1).optional(),
    }),
  })
  .superRefine((primitive, context) => {
    validateCommon(primitive.content, context)
    if (primitive.completion.mode !== 'answer') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'DICOM region identification must use answer completion.',
      })
    }
    const { referenceSlice, sliceRange } = primitive.content.target
    if (referenceSlice < sliceRange.from || referenceSlice > sliceRange.to) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'target', 'referenceSlice'],
        message: 'Reference slice must be inside the target slice range.',
      })
    }
  })

const measurementToleranceSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('percent'), value: z.number().positive().max(100) }),
  z.strictObject({ mode: z.literal('absolute_mm'), value: z.number().positive() }),
])

export const dicomMeasurePrimitiveSchema = primitiveBaseSchema
  .extend({
    type: z.literal('dicom_measure'),
    content: z.strictObject({
      ...commonContent,
      target: z.strictObject({
        sliceRange: dicomSliceRangeSchema,
        expected: z.strictObject({
          valueMm: z.number().positive(),
          tolerance: measurementToleranceSchema,
        }),
        referenceLine: z
          .strictObject({
            slice: z.number().int().positive(),
            start: normalizedPointSchema,
            end: normalizedPointSchema,
          })
          .optional(),
      }),
      explanation: z.string().min(1),
    }),
  })
  .superRefine((primitive, context) => {
    validateCommon(primitive.content, context)
    if (primitive.completion.mode !== 'answer') {
      context.addIssue({
        code: 'custom',
        path: ['completion'],
        message: 'DICOM measurement must use answer completion.',
      })
    }
    const { referenceLine, sliceRange } = primitive.content.target
    if (
      referenceLine &&
      (referenceLine.slice < sliceRange.from || referenceLine.slice > sliceRange.to)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['content', 'target', 'referenceLine', 'slice'],
        message: 'Reference line slice must be inside the target slice range.',
      })
    }
  })

function validateCommon(
  content: {
    presets: Array<z.infer<typeof dicomPresetSchema>>
    initialPresetId?: string
    tools?: Array<z.infer<typeof dicomToolSchema>>
  },
  context: z.RefinementCtx,
) {
  const presetIds = content.presets.map(({ id }) => id)
  if (new Set(presetIds).size !== presetIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['content', 'presets'],
      message: 'DICOM preset IDs must be unique.',
    })
  }
  if (content.initialPresetId && !presetIds.includes(content.initialPresetId)) {
    context.addIssue({
      code: 'custom',
      path: ['content', 'initialPresetId'],
      message: 'Initial preset must reference a configured preset.',
    })
  }
  if (content.tools && new Set(content.tools).size !== content.tools.length) {
    context.addIssue({
      code: 'custom',
      path: ['content', 'tools'],
      message: 'DICOM tools must be unique.',
    })
  }
}

export type DicomExplorePrimitive = z.infer<typeof dicomExplorePrimitiveSchema>
export type DicomPresetContent = z.infer<typeof dicomPresetSchema>
export type DicomTool = z.infer<typeof dicomToolSchema>
export type DicomGuidedPrimitive = z.infer<typeof dicomGuidedPrimitiveSchema>
export type DicomIdentifyRegionPrimitive = z.infer<typeof dicomIdentifyRegionPrimitiveSchema>
export type DicomMeasurePrimitive = z.infer<typeof dicomMeasurePrimitiveSchema>
export type DicomPrimitive =
  | DicomExplorePrimitive
  | DicomGuidedPrimitive
  | DicomIdentifyRegionPrimitive
  | DicomMeasurePrimitive

function dicomAssetRef(primitive: DicomPrimitive) {
  return [
    {
      assetId: primitive.content.seriesAssetId,
      type: 'dicom' as const,
      path: 'content.seriesAssetId',
    },
  ]
}

export const dicomExploreContentSchema = {
  schema: dicomExplorePrimitiveSchema,
  assetRefs: dicomAssetRef,
} satisfies PrimitiveContentSchema<DicomExplorePrimitive>

export const dicomGuidedContentSchema = {
  schema: dicomGuidedPrimitiveSchema,
  assetRefs: dicomAssetRef,
} satisfies PrimitiveContentSchema<DicomGuidedPrimitive>

export const dicomIdentifyRegionContentSchema = {
  schema: dicomIdentifyRegionPrimitiveSchema,
  assetRefs: dicomAssetRef,
} satisfies PrimitiveContentSchema<DicomIdentifyRegionPrimitive>

export const dicomMeasureContentSchema = {
  schema: dicomMeasurePrimitiveSchema,
  assetRefs: dicomAssetRef,
} satisfies PrimitiveContentSchema<DicomMeasurePrimitive>
