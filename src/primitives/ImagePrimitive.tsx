import { useEffect } from 'react'

import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

interface Annotation {
  id: string
  label: string
  x: number
  y: number
}

function isAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    typeof item.x === 'number' &&
    typeof item.y === 'number'
  )
}

export function ImagePrimitive({ primitive, onComplete }: PrimitiveComponentProps) {
  const assetId =
    typeof primitive.content.assetId === 'string' ? primitive.content.assetId : undefined
  const src = useAssetUrl(assetId)
  const alt = typeof primitive.content.alt === 'string' ? primitive.content.alt : ''
  const caption =
    typeof primitive.content.caption === 'string' ? primitive.content.caption : null
  const annotations = Array.isArray(primitive.content.annotations)
    ? primitive.content.annotations.filter(isAnnotation)
    : []

  useEffect(onComplete, [onComplete])

  return (
    <figure className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-neutral-100">
        {src ? (
          <img className="mx-auto max-h-[60dvh] w-full object-contain" src={src} alt={alt} />
        ) : (
          <div className="grid min-h-64 place-items-center p-6 text-neutral-600" role="status">
            Image unavailable
          </div>
        )}
        {annotations.map((annotation) => (
          <span
            key={annotation.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950/85 px-2 py-1 text-caption font-semibold text-white"
            style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }}
          >
            {annotation.label}
          </span>
        ))}
      </div>
      {caption ? <figcaption className="text-small text-neutral-600">{caption}</figcaption> : null}
    </figure>
  )
}
