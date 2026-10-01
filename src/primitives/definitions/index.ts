import type { ZodType } from 'zod'

import type { Primitive } from '@/content/schema'
import {
  primitiveContentSchemas,
  type TypedPrimitive,
} from '@/content/schema/primitives'
import { audioDefinition } from '@/primitives/definitions/audio'
import { carouselDefinition } from '@/primitives/definitions/carousel'
import { chartDefinition } from '@/primitives/definitions/chart'
import { classificationDefinition } from '@/primitives/definitions/classification'
import { dataTableDefinition } from '@/primitives/definitions/dataTable'
import { fillBlankDefinition } from '@/primitives/definitions/fillBlank'
import { formulaDefinition } from '@/primitives/definitions/formula'
import { imageDefinition } from '@/primitives/definitions/image'
import { imageCompareDefinition } from '@/primitives/definitions/imageCompare'
import { imageHotspotDefinition } from '@/primitives/definitions/imageHotspot'
import { matchPairsDefinition } from '@/primitives/definitions/matchPairs'
import { multipleChoiceDefinition } from '@/primitives/definitions/multipleChoice'
import { multipleSelectDefinition } from '@/primitives/definitions/multipleSelect'
import { numericDefinition } from '@/primitives/definitions/numeric'
import { orderingDefinition } from '@/primitives/definitions/ordering'
import { pdfReferenceDefinition } from '@/primitives/definitions/pdfReference'
import { richTextDefinition } from '@/primitives/definitions/richText'
import { scenarioDefinition } from '@/primitives/definitions/scenario'
import { trueFalseDefinition } from '@/primitives/definitions/trueFalse'
import type { PrimitiveDefinition, PrimitiveDefinitionMap } from '@/primitives/definitions/types'
import { videoDefinition } from '@/primitives/definitions/video'
import { zoomableImageDefinition } from '@/primitives/definitions/zoomableImage'
import type { EvaluationResult } from '@/primitives/types'

export * from '@/primitives/definitions/types'

export const primitiveDefinitions = {
  rich_text: richTextDefinition,
  image: imageDefinition,
  zoomable_image: zoomableImageDefinition,
  image_hotspot: imageHotspotDefinition,
  image_compare: imageCompareDefinition,
  video: videoDefinition,
  audio: audioDefinition,
  carousel: carouselDefinition,
  data_table: dataTableDefinition,
  chart: chartDefinition,
  formula: formulaDefinition,
  pdf_reference: pdfReferenceDefinition,
  multiple_choice: multipleChoiceDefinition,
  multiple_select: multipleSelectDefinition,
  true_false: trueFalseDefinition,
  classification: classificationDefinition,
  match_pairs: matchPairsDefinition,
  ordering: orderingDefinition,
  fill_blank: fillBlankDefinition,
  numeric: numericDefinition,
  scenario: scenarioDefinition,
} satisfies PrimitiveDefinitionMap

type SupportedPrimitiveType = keyof typeof primitiveDefinitions
type SupportedPrimitive = Extract<TypedPrimitive, { type: SupportedPrimitiveType }>

export function isSupportedPrimitiveType(type: string): type is SupportedPrimitiveType {
  return type in primitiveDefinitions
}

export interface ResolvedPrimitiveDefinition {
  primitive: SupportedPrimitive
  definition: PrimitiveDefinition<SupportedPrimitive>
}

export function resolvePrimitiveDefinition(
  primitive: Primitive,
): ResolvedPrimitiveDefinition | null {
  if (!isSupportedPrimitiveType(primitive.type)) return null

  const schema = primitiveContentSchemas[primitive.type].schema as ZodType<SupportedPrimitive>
  const parsed = schema.safeParse(primitive)
  if (!parsed.success) return null

  return {
    primitive: parsed.data,
    definition: primitiveDefinitions[primitive.type] as PrimitiveDefinition<SupportedPrimitive>,
  }
}

export function evaluatePrimitive(primitive: Primitive, response: unknown): EvaluationResult {
  const resolved = resolvePrimitiveDefinition(primitive)
  const evaluation = resolved?.definition.evaluate?.(resolved.primitive, response)
  const score =
    evaluation && Number.isFinite(evaluation.score) ? Math.min(1, Math.max(0, evaluation.score)) : 0

  return {
    ...evaluation,
    score,
    correct: score === 1,
    explanation: evaluation?.explanation ?? null,
  }
}
