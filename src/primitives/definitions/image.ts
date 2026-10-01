import type { ImagePrimitive } from '@/content/schema/primitives'
import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import { definePrimitive } from '@/primitives/definitions/types'

export const imageDefinition = definePrimitive<ImagePrimitive>({
  type: 'image',
  family: 'content',
  label: 'Image',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('image'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.caption ?? primitive.content.alt,
  explorableKeys: (primitive) => primitive.content.annotations?.map(({ id }) => id) ?? [],
})
