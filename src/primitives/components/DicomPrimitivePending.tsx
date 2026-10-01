import type { DicomPrimitive } from '@/content/schema/primitives'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function DicomPrimitivePending({ primitive }: PrimitiveComponentProps<DicomPrimitive>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6" role="status">
      <p className="font-semibold">{primitive.content.prompt}</p>
      <p className="mt-2 text-small text-neutral-600">Preparing the DICOM learning viewer.</p>
    </div>
  )
}
