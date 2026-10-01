import type { Primitive } from '../primitiveBase'
import type { ClassificationPrimitive } from './classification'
import { classificationContentSchema } from './classification'
import type { ImagePrimitive } from './image'
import { imageContentSchema } from './image'
import type { MatchPairsPrimitive } from './matchPairs'
import { matchPairsContentSchema } from './matchPairs'
import type { MultipleChoicePrimitive } from './multipleChoice'
import { multipleChoiceContentSchema } from './multipleChoice'
import type { MultipleSelectPrimitive } from './multipleSelect'
import { multipleSelectContentSchema } from './multipleSelect'
import type { OrderingPrimitive } from './ordering'
import { orderingContentSchema } from './ordering'
import type { RichTextPrimitive } from './richText'
import { richTextContentSchema } from './richText'
import type { TrueFalsePrimitive } from './trueFalse'
import { trueFalseContentSchema } from './trueFalse'
import type { PrimitiveAssetRef } from './types'

export { classificationPrimitiveSchema, type ClassificationPrimitive } from './classification'
export { imagePrimitiveSchema, type ImagePrimitive } from './image'
export { matchPairsPrimitiveSchema, type MatchPairsPrimitive } from './matchPairs'
export { multipleChoicePrimitiveSchema, type MultipleChoicePrimitive } from './multipleChoice'
export { multipleSelectPrimitiveSchema, type MultipleSelectPrimitive } from './multipleSelect'
export { orderingPrimitiveSchema, type OrderingPrimitive } from './ordering'
export { richTextPrimitiveSchema, type RichTextPrimitive } from './richText'
export { trueFalsePrimitiveSchema, type TrueFalsePrimitive } from './trueFalse'
export type { PrimitiveAssetRef, PrimitiveAssetType, PrimitiveContentSchema } from './types'

export const primitiveContentSchemas = {
  rich_text: richTextContentSchema,
  image: imageContentSchema,
  multiple_choice: multipleChoiceContentSchema,
  multiple_select: multipleSelectContentSchema,
  true_false: trueFalseContentSchema,
  classification: classificationContentSchema,
  match_pairs: matchPairsContentSchema,
  ordering: orderingContentSchema,
} as const

export type TypedPrimitive =
  | RichTextPrimitive
  | ImagePrimitive
  | MultipleChoicePrimitive
  | MultipleSelectPrimitive
  | TrueFalsePrimitive
  | ClassificationPrimitive
  | MatchPairsPrimitive
  | OrderingPrimitive

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
