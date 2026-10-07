import { useRef, useState } from 'react'

export interface ComparisonImage {
  src: string
  alt: string
  label: string
  width?: number
  height?: number
}

export function ImageComparePresentation({
  mode,
  before,
  after,
  initialPosition = 0.5,
  onAdjust,
}: {
  mode: 'slider' | 'side_by_side'
  before: ComparisonImage
  after: ComparisonImage
  initialPosition?: number
  onAdjust?: () => void
}) {
  const [position, setPosition] = useState(initialPosition)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const draggingDivider = useRef(false)
  const aspectStyle =
    before.width && before.height
      ? { aspectRatio: `${before.width} / ${before.height}` }
      : undefined

  const updatePosition = (nextPosition: number) => {
    setPosition(Math.min(1, Math.max(0, nextPosition)))
    onAdjust?.()
  }
  const updatePositionFromPointer = (clientX: number) => {
    const bounds = comparisonRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return
    updatePosition((clientX - bounds.left) / bounds.width)
  }

  if (mode === 'side_by_side') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[before, after].map((image) => (
          <section key={image.label} className="space-y-2">
            <h3 className="font-semibold text-neutral-950">{image.label}</h3>
            <div className="overflow-hidden rounded-xl bg-neutral-100" style={aspectStyle}>
              <img className="size-full object-cover" src={image.src} alt={image.alt} />
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <>
      <div
        className="relative isolate overflow-hidden rounded-xl bg-neutral-100"
        ref={comparisonRef}
        style={aspectStyle}
      >
        <img className="block size-full object-cover" src={before.src} alt={before.alt} />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${position * 100}%` }}
          aria-hidden="true"
        >
          <img
            className="h-full max-w-none object-cover"
            style={{ width: `${100 / Math.max(position, 0.001)}%` }}
            src={after.src}
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
          {after.label}
        </span>
        <span className="absolute bottom-3 right-3 rounded bg-neutral-950/80 px-2 py-1 text-caption font-semibold text-white">
          {before.label}
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
          aria-valuetext={`${Math.round(position * 100)}% ${after.label}`}
          onChange={(event) => updatePosition(event.currentTarget.valueAsNumber / 100)}
        />
      </label>
    </>
  )
}
