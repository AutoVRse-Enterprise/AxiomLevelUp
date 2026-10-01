import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { FormulaPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const formulaDefinition = definePrimitive<FormulaPrimitive>({
  type: 'formula',
  family: 'content',
  label: 'Formula',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('formula'),
  scored: () => false,
  reviewPrompt: (primitive) =>
    primitive.content.title ?? primitive.content.expressions[0]?.ariaLabel ?? 'Scientific formula',
})
