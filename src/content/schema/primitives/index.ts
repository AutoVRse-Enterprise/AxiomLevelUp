import type { ImagePrimitive } from './image'
import { imageContentSchema } from './image'
import type { MultipleChoicePrimitive } from './multipleChoice'
import { multipleChoiceContentSchema } from './multipleChoice'
import type { RichTextPrimitive } from './richText'
import { richTextContentSchema } from './richText'

export { imagePrimitiveSchema, type ImagePrimitive } from './image'
export { multipleChoicePrimitiveSchema, type MultipleChoicePrimitive } from './multipleChoice'
export { richTextPrimitiveSchema, type RichTextPrimitive } from './richText'
export type { PrimitiveAssetRef, PrimitiveAssetType, PrimitiveContentSchema } from './types'

export const primitiveContentSchemas = {
  rich_text: richTextContentSchema,
  image: imageContentSchema,
  multiple_choice: multipleChoiceContentSchema,
} as const

export type TypedPrimitive = RichTextPrimitive | ImagePrimitive | MultipleChoicePrimitive

export type TypedPrimitiveType = TypedPrimitive['type']
