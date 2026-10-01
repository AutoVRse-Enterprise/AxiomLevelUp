import { useEffect, useRef, useState } from 'react'

import type { ImageComparePrimitive as ImageComparePrimitiveConfig } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function ImageComparePrimitive({
  primitive,
  onComplete,
  onInteract,
}: PrimitiveComponentProps<ImageComparePrimitiveConfig>) {
  const beforeAsset = useAsset(primitive.content.before.assetId)
  const afterAsset = useAsset(primitive.content.after.assetId)
  const [position, setPosition] = useState(primitive.content.initialPosition)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const draggingDivider = useRef(false)

  useEffect(onComplete, [onComplete])

  const updatePosition = (nextPosition: number) => {
    setPosition(Math.min(1, Math.max(0, nextPosition)))
    onInteract({ name: 'image_comparison_adjusted' })
  }

  const updatePositionFromPointer = (clientX: number) => {
    const bounds = comparisonRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return
    updatePosition((clientX - bounds.left) / bounds.width)
  }

  if (!beforeAsset || !afterAsset) {
    return (
      <div
        className="grid min-h-64 place-items-center rounded-xl bg-neutral-100 p-6 text-neutral-600"
        role="status"
      >
        Comparison image unavailable
      </div>
    )
  }

  const aspectStyle =
    beforeAsset.width && beforeAsset.height
      ? { aspectRatio: `${beforeAsset.width} / ${beforeAsset.height}` }
      : undefined

  return (
    <figure className="space-y-4">
      {primitive.content.mode === 'side_by_side' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: 'before', config: primitive.content.before, asset: beforeAsset },
            { key: 'after', config: primitive.content.after, asset: afterAsset },
          ].map(({ key, config, asset }) => (
            <section key={key} className="space-y-2">
              <h3 className="font-semibold text-neutral-950">{config.label}</h3>
              <div className="overflow-hidden rounded-xl bg-neutral-100" style={aspectStyle}>
                <img className="size-full object-cover" src={asset.path} alt={config.alt} />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <div
            className="relative isolate overflow-hidden rounded-xl bg-neutral-100"
            ref={comparisonRef}
            style={aspectStyle}
          >
            <img
              className="block size-full object-cover"
              src={beforeAsset.path}
              alt={primitive.content.before.alt}
            />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${position * 100}%` }}
              aria-hidden="true"
            >
              <img
                className="h-full max-w-none object-cover"
                style={{ width: `${100 / Math.max(position, 0.001)}%` }}
                src={afterAsset.path}
                alt=""
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none"
              data-image-compare-divider=""
              onPointerCancel={(event) => {
                draggingDivider.current = false
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
              }}
              onPointerDown={(event) => {
                event.preventDefault()
                draggingDivider.current = true
                event.currentTarget.setPointerCapture(event.pointerId)
                updatePositionFromPointer(event.clientX)
              }}
              onPointerMove={(event) => {
                if (!draggingDivider.current) return
                event.preventDefault()
                updatePositionFromPointer(event.clientX)
              }}
              onPointerUp={(event) => {
                if (!draggingDivider.current) return
                draggingDivider.current = false
                updatePositionFromPointer(event.clientX)
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
              }}
              style={{ left: `${position * 100}%` }}
            >
              <span className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]">
                <span className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-700 shadow" />
              </span>
            </div>
            <span className="absolute bottom-3 left-3 rounded bg-neutral-950/80 px-2 py-1 text-caption font-semibold text-white">
              {primitive.content.after.label}
            </span>
            <span className="absolute bottom-3 right-3 rounded bg-neutral-950/80 px-2 py-1 text-caption font-semibold text-white">
              {primitive.content.before.label}
            </span>
          </div>
          <label className="block font-medium text-neutral-800">
            Comparison position
            <input
              className="mt-2 block w-full accent-brand-700"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(position * 100)}
              aria-valuetext={`${Math.round(position * 100)}% ${primitive.content.after.label}`}
              onChange={(event) => {
                updatePosition(event.currentTarget.valueAsNumber / 100)
              }}
            />
          </label>
        </>
      )}
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
    </figure>
  )
}
