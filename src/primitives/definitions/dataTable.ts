import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { DataTablePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const dataTableDefinition = definePrimitive<DataTablePrimitive>({
  type: 'data_table',
  family: 'content',
  label: 'Data table',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('data_table'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.caption,
})
