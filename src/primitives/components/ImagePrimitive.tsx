import { useEffect } from 'react'

import type { ImagePrimitive as ImagePrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function ImagePrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<ImagePrimitiveConfig>) {
  const src = useAssetUrl(primitive.content.assetId)

  useEffect(onComplete, [onComplete])

  return (
    <figure className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-neutral-100">
        {src ? (
          <img
            className="mx-auto max-h-[60dvh] w-full object-contain"
            src={src}
            alt={primitive.content.alt}
          />
        ) : (
          <div className="grid min-h-64 place-items-center p-6 text-neutral-600" role="status">
            Image unavailable
          </div>
        )}
        {primitive.content.annotations?.map((annotation) => (
          <span
            key={annotation.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950/85 px-2 py-1 text-caption font-semibold text-white"
            style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }}
          >
            {annotation.label}
          </span>
        ))}
      </div>
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
    </figure>
  )
}
