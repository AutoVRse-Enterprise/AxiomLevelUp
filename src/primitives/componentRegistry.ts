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

const MultipleSelectPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MultipleSelectPrimitive')
  return { default: module.MultipleSelectPrimitive }
})

const TrueFalsePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/TrueFalsePrimitive')
  return { default: module.TrueFalsePrimitive }
})

const ClassificationPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ClassificationPrimitive')
  return { default: module.ClassificationPrimitive }
})

const MatchPairsPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MatchPairsPrimitive')
  return { default: module.MatchPairsPrimitive }
})

const OrderingPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/OrderingPrimitive')
  return { default: module.OrderingPrimitive }
})

export const primitiveComponents = {
  rich_text: RichTextPrimitive,
  image: ImagePrimitive,
  multiple_choice: MultipleChoicePrimitive,
  multiple_select: MultipleSelectPrimitive,
  true_false: TrueFalsePrimitive,
  classification: ClassificationPrimitive,
  match_pairs: MatchPairsPrimitive,
  ordering: OrderingPrimitive,
} as const
