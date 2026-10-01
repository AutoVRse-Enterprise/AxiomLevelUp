import type { Primitive } from '../primitiveBase'
import type { AudioPrimitive } from './audio'
import { audioContentSchema } from './audio'
import type { CarouselPrimitive } from './carousel'
import { carouselContentSchema } from './carousel'
import type { ChartPrimitive } from './chart'
import { chartContentSchema } from './chart'
import type { ClassificationPrimitive } from './classification'
import { classificationContentSchema } from './classification'
import type { DataTablePrimitive } from './dataTable'
import { dataTableContentSchema } from './dataTable'
import type { FillBlankPrimitive } from './fillBlank'
import { fillBlankContentSchema } from './fillBlank'
import type { FormulaPrimitive } from './formula'
import { formulaContentSchema } from './formula'
import type { ImagePrimitive } from './image'
import { imageContentSchema } from './image'
import type { ImageComparePrimitive } from './imageCompare'
import { imageCompareContentSchema } from './imageCompare'
import type { ImageHotspotPrimitive } from './imageHotspot'
import { imageHotspotContentSchema } from './imageHotspot'
import type { MatchPairsPrimitive } from './matchPairs'
import { matchPairsContentSchema } from './matchPairs'
import type { MultipleChoicePrimitive } from './multipleChoice'
import { multipleChoiceContentSchema } from './multipleChoice'
import type { MultipleSelectPrimitive } from './multipleSelect'
import { multipleSelectContentSchema } from './multipleSelect'
import type { NumericPrimitive } from './numeric'
import { numericContentSchema } from './numeric'
import type { OrderingPrimitive } from './ordering'
import { orderingContentSchema } from './ordering'
import type { PdfReferencePrimitive } from './pdfReference'
import { pdfReferenceContentSchema } from './pdfReference'
import type { RichTextPrimitive } from './richText'
import { richTextContentSchema } from './richText'
import type { ScenarioPrimitive } from './scenario'
import { scenarioContentSchema } from './scenario'
import type { TrueFalsePrimitive } from './trueFalse'
import { trueFalseContentSchema } from './trueFalse'
import type { PrimitiveAssetRef } from './types'
import type { VideoPrimitive } from './video'
import { videoContentSchema } from './video'
import type { ZoomableImagePrimitive } from './zoomableImage'
import { zoomableImageContentSchema } from './zoomableImage'

export { audioPrimitiveSchema, type AudioPrimitive } from './audio'
export { carouselPrimitiveSchema, type CarouselPrimitive } from './carousel'
export { classificationPrimitiveSchema, type ClassificationPrimitive } from './classification'
export { chartPrimitiveSchema, type ChartPrimitive } from './chart'
export { dataTablePrimitiveSchema, type DataTablePrimitive } from './dataTable'
export { fillBlankPrimitiveSchema, type FillBlankPrimitive } from './fillBlank'
export { formulaPrimitiveSchema, type FormulaPrimitive } from './formula'
export { imagePrimitiveSchema, type ImagePrimitive } from './image'
export { imageComparePrimitiveSchema, type ImageComparePrimitive } from './imageCompare'
export { imageHotspotPrimitiveSchema, type ImageHotspotPrimitive } from './imageHotspot'
export {
  imageRegionSchema,
  normalizedPointSchema,
  type ImageRegion,
  type NormalizedPoint,
} from './imageRegions'
export { matchPairsPrimitiveSchema, type MatchPairsPrimitive } from './matchPairs'
export { multipleChoicePrimitiveSchema, type MultipleChoicePrimitive } from './multipleChoice'
export { multipleSelectPrimitiveSchema, type MultipleSelectPrimitive } from './multipleSelect'
export { numericPrimitiveSchema, type NumericPrimitive } from './numeric'
export { orderingPrimitiveSchema, type OrderingPrimitive } from './ordering'
export { pdfReferencePrimitiveSchema, type PdfReferencePrimitive } from './pdfReference'
export { richTextPrimitiveSchema, type RichTextPrimitive } from './richText'
export {
  scenarioChoiceSchema,
  scenarioContextNodeSchema,
  scenarioDecisionNodeSchema,
  scenarioNodeSchema,
  scenarioOutcomeNodeSchema,
  scenarioPrimitiveSchema,
  validateScenarioGraph,
  type ScenarioChoice,
  type ScenarioContent,
  type ScenarioContextNode,
  type ScenarioDecisionNode,
  type ScenarioGraphIssue,
  type ScenarioGraphValidation,
  type ScenarioNode,
  type ScenarioOutcomeNode,
  type ScenarioPrimitive,
} from './scenario'
export { trueFalsePrimitiveSchema, type TrueFalsePrimitive } from './trueFalse'
export { videoPrimitiveSchema, type VideoPrimitive } from './video'
export { zoomableImagePrimitiveSchema, type ZoomableImagePrimitive } from './zoomableImage'
export type { PrimitiveAssetRef, PrimitiveAssetType, PrimitiveContentSchema } from './types'

export const primitiveContentSchemas = {
  rich_text: richTextContentSchema,
  image: imageContentSchema,
  zoomable_image: zoomableImageContentSchema,
  image_hotspot: imageHotspotContentSchema,
  image_compare: imageCompareContentSchema,
  video: videoContentSchema,
  audio: audioContentSchema,
  carousel: carouselContentSchema,
  data_table: dataTableContentSchema,
  chart: chartContentSchema,
  formula: formulaContentSchema,
  pdf_reference: pdfReferenceContentSchema,
  multiple_choice: multipleChoiceContentSchema,
  multiple_select: multipleSelectContentSchema,
  true_false: trueFalseContentSchema,
  classification: classificationContentSchema,
  match_pairs: matchPairsContentSchema,
  ordering: orderingContentSchema,
  fill_blank: fillBlankContentSchema,
  numeric: numericContentSchema,
  scenario: scenarioContentSchema,
} as const

export type TypedPrimitive =
  | RichTextPrimitive
  | ImagePrimitive
  | ZoomableImagePrimitive
  | ImageHotspotPrimitive
  | ImageComparePrimitive
  | VideoPrimitive
  | AudioPrimitive
  | CarouselPrimitive
  | DataTablePrimitive
  | ChartPrimitive
  | FormulaPrimitive
  | PdfReferencePrimitive
  | MultipleChoicePrimitive
  | MultipleSelectPrimitive
  | TrueFalsePrimitive
  | ClassificationPrimitive
  | MatchPairsPrimitive
  | OrderingPrimitive
  | FillBlankPrimitive
  | NumericPrimitive
  | ScenarioPrimitive

export type TypedPrimitiveType = TypedPrimitive['type']

export function getPrimitiveAssetRefs(primitive: Primitive): PrimitiveAssetRef[] {
  if (!(primitive.type in primitiveContentSchemas)) return []

  const contentSchema =
    primitiveContentSchemas[primitive.type as keyof typeof primitiveContentSchemas]
  const parsed = contentSchema.schema.safeParse(primitive)
  if (!parsed.success) return []

  return (contentSchema.assetRefs as (value: TypedPrimitive) => PrimitiveAssetRef[])(
    parsed.data as TypedPrimitive,
  )
}
