import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ImageComparePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const imageCompareDefinition = definePrimitive<ImageComparePrimitive>({
  type: 'image_compare',
  family: 'content',
  label: 'Image comparison',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('image_compare'),
  scored: () => false,
  reviewPrompt: (primitive) =>
    primitive.content.caption ??
    `${primitive.content.before.label} compared with ${primitive.content.after.label}`,
})
