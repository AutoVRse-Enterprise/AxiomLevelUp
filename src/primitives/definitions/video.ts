import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { VideoPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const videoDefinition = definePrimitive<VideoPrimitive>({
  type: 'video',
  family: 'content',
  label: 'Video',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('video'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.title,
})
