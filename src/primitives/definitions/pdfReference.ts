import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { PdfReferencePrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const pdfReferenceDefinition = definePrimitive<PdfReferencePrimitive>({
  type: 'pdf_reference',
  family: 'content',
  label: 'Reference',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('pdf_reference'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.citation,
})
