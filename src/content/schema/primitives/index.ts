import type { Primitive } from '../primitiveBase'
import type { ImagePrimitive } from './image'
import { imageContentSchema } from './image'
import type { MultipleChoicePrimitive } from './multipleChoice'
import { multipleChoiceContentSchema } from './multipleChoice'
import type { MultipleSelectPrimitive } from './multipleSelect'
import { multipleSelectContentSchema } from './multipleSelect'
import type { RichTextPrimitive } from './richText'
import { richTextContentSchema } from './richText'
import type { TrueFalsePrimitive } from './trueFalse'
import { trueFalseContentSchema } from './trueFalse'
import type { PrimitiveAssetRef } from './types'

export { imagePrimitiveSchema, type ImagePrimitive } from './image'
export { multipleChoicePrimitiveSchema, type MultipleChoicePrimitive } from './multipleChoice'
export { multipleSelectPrimitiveSchema, type MultipleSelectPrimitive } from './multipleSelect'
export { richTextPrimitiveSchema, type RichTextPrimitive } from './richText'
export { trueFalsePrimitiveSchema, type TrueFalsePrimitive } from './trueFalse'
export type { PrimitiveAssetRef, PrimitiveAssetType, PrimitiveContentSchema } from './types'

export const primitiveContentSchemas = {
  rich_text: richTextContentSchema,
  image: imageContentSchema,
  multiple_choice: multipleChoiceContentSchema,
  multiple_select: multipleSelectContentSchema,
  true_false: trueFalseContentSchema,
} as const

export type TypedPrimitive =
  | RichTextPrimitive
  | ImagePrimitive
  | MultipleChoicePrimitive
  | MultipleSelectPrimitive
  | TrueFalsePrimitive

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
