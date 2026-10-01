import type { Primitive } from '../primitiveBase'
import type { ClassificationPrimitive } from './classification'
import { classificationContentSchema } from './classification'
import type { FillBlankPrimitive } from './fillBlank'
import { fillBlankContentSchema } from './fillBlank'
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
import type { RichTextPrimitive } from './richText'
import { richTextContentSchema } from './richText'
import type { TrueFalsePrimitive } from './trueFalse'
import { trueFalseContentSchema } from './trueFalse'
import type { PrimitiveAssetRef } from './types'
import type { ZoomableImagePrimitive } from './zoomableImage'
import { zoomableImageContentSchema } from './zoomableImage'

export { classificationPrimitiveSchema, type ClassificationPrimitive } from './classification'
export { fillBlankPrimitiveSchema, type FillBlankPrimitive } from './fillBlank'
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
export { richTextPrimitiveSchema, type RichTextPrimitive } from './richText'
export { trueFalsePrimitiveSchema, type TrueFalsePrimitive } from './trueFalse'
export { zoomableImagePrimitiveSchema, type ZoomableImagePrimitive } from './zoomableImage'
export type { PrimitiveAssetRef, PrimitiveAssetType, PrimitiveContentSchema } from './types'

export const primitiveContentSchemas = {
  rich_text: richTextContentSchema,
  image: imageContentSchema,
  zoomable_image: zoomableImageContentSchema,
  image_hotspot: imageHotspotContentSchema,
  image_compare: imageCompareContentSchema,
  multiple_choice: multipleChoiceContentSchema,
  multiple_select: multipleSelectContentSchema,
  true_false: trueFalseContentSchema,
  classification: classificationContentSchema,
  match_pairs: matchPairsContentSchema,
  ordering: orderingContentSchema,
  fill_blank: fillBlankContentSchema,
  numeric: numericContentSchema,
} as const

export type TypedPrimitive =
  | RichTextPrimitive
  | ImagePrimitive
  | ZoomableImagePrimitive
  | ImageHotspotPrimitive
  | ImageComparePrimitive
  | MultipleChoicePrimitive
  | MultipleSelectPrimitive
  | TrueFalsePrimitive
  | ClassificationPrimitive
  | MatchPairsPrimitive
  | OrderingPrimitive
  | FillBlankPrimitive
  | NumericPrimitive

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
