import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ZoomableImagePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const zoomableImageDefinition = definePrimitive<ZoomableImagePrimitive>({
  type: 'zoomable_image',
  family: 'content',
  label: 'Zoomable image',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('zoomable_image'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.caption ?? primitive.content.alt,
})
