import { lazy } from 'react'

const RichTextPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/RichTextPrimitive')
  return { default: module.RichTextPrimitive }
})

const ImagePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ImagePrimitive')
  return { default: module.ImagePrimitive }
})

const MultipleChoicePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MultipleChoicePrimitive')
  return { default: module.MultipleChoicePrimitive }
})

export const primitiveComponents = {
  rich_text: RichTextPrimitive,
  image: ImagePrimitive,
  multiple_choice: MultipleChoicePrimitive,
} as const
