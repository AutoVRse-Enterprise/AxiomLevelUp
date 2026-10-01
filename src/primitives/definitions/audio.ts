import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { AudioPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const audioDefinition = definePrimitive<AudioPrimitive>({
  type: 'audio',
  family: 'content',
  label: 'Audio',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('audio'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.title,
})
