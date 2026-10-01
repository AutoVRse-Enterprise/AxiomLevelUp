import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ChartPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const chartDefinition = definePrimitive<ChartPrimitive>({
  type: 'chart',
  family: 'content',
  label: 'Chart',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('chart'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.summary,
})
