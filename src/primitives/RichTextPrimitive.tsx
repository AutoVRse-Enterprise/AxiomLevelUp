import { useEffect } from 'react'

import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function RichTextPrimitive({ primitive, onComplete }: PrimitiveComponentProps) {
  const heading = typeof primitive.content.heading === 'string' ? primitive.content.heading : null
  const body = typeof primitive.content.body === 'string' ? primitive.content.body : ''
  const bullets = Array.isArray(primitive.content.bullets)
    ? primitive.content.bullets.filter((item): item is string => typeof item === 'string')
    : []
  const takeaway =
    typeof primitive.content.keyTakeaway === 'string' ? primitive.content.keyTakeaway : null
  const imageAssetId =
    typeof primitive.content.imageAssetId === 'string'
      ? primitive.content.imageAssetId
      : undefined
  const imageUrl = useAssetUrl(imageAssetId)

  useEffect(onComplete, [onComplete])

  return (
    <article className="space-y-5">
      {heading ? <h2 className="text-title font-bold text-neutral-950">{heading}</h2> : null}
      {imageUrl ? (
        <img className="max-h-72 w-full rounded-lg object-cover" src={imageUrl} alt="" />
      ) : null}
      <p className="text-body text-neutral-700">{body}</p>
      {bullets.length ? (
        <ul className="list-disc space-y-2 pl-6 text-neutral-700">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {takeaway ? (
        <aside className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-small font-semibold text-brand-900">Key takeaway</p>
          <p className="mt-1 text-neutral-800">{takeaway}</p>
        </aside>
      ) : null}
    </article>
  )
}
