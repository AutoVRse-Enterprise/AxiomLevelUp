import type { RichTextPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const richTextDefinition = definePrimitive<RichTextPrimitive>({
  type: 'rich_text',
  family: 'content',
  label: 'Reading',
  layout: 'stacked',
  timerCompatible: false,
  scored: () => false,
  reviewPrompt: (primitive) =>
    primitive.content.heading ?? primitive.content.keyTakeaway ?? 'Reading',
})
