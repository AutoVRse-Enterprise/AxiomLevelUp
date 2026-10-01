import { useEffect } from 'react'

import type { RichTextPrimitive as RichTextPrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function RichTextPrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<RichTextPrimitiveConfig>) {
  const imageUrl = useAssetUrl(primitive.content.imageAssetId)

  useEffect(onComplete, [onComplete])

  return (
    <article className="space-y-5">
      {primitive.content.heading ? (
        <h2 className="text-title font-bold text-neutral-950">{primitive.content.heading}</h2>
      ) : null}
      {imageUrl ? (
        <img className="max-h-72 w-full rounded-lg object-cover" src={imageUrl} alt="" />
      ) : null}
      <p className="text-body text-neutral-700">{primitive.content.body}</p>
      {primitive.content.bullets?.length ? (
        <ul className="list-disc space-y-2 pl-6 text-neutral-700">
          {primitive.content.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {primitive.content.keyTakeaway ? (
        <aside className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-small font-semibold text-brand-900">Key takeaway</p>
          <p className="mt-1 text-neutral-800">{primitive.content.keyTakeaway}</p>
        </aside>
      ) : null}
    </article>
  )
}
