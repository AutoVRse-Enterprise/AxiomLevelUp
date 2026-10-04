import { Maximize2 } from 'lucide-react'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'

import { Button } from '@/components/ui'
import type {
  ImageHotspotPrimitive as ImageHotspotPrimitiveConfig,
  NormalizedPoint,
} from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { StepActionSlot } from '@/player/StepActionSlot'
import { isNormalizedPoint } from '@/primitives/definitions/imageHitTesting'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { regionCenter } from '@/primitives/shared/imageRegionMath'
import { clamp, screenToNormalized } from '@/primitives/shared/panZoomMath'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { cn } from '@/lib/cn'

function LocationMarker({
  point,
  label,
  status,
}: {
  point: NormalizedPoint
  label: string
  status?: 'correct' | 'incorrect'
}) {
  return (
    <span
      aria-label={label}
      className={`pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-2 ${
        status === 'correct'
          ? 'bg-success-600 ring-success-700'
          : status === 'incorrect'
            ? 'bg-danger-600 ring-danger-700'
            : 'bg-brand-700 ring-brand-800'
      }`}
      role="img"
      style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
    />
  )
}

export function ImageHotspotPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<ImageHotspotPrimitiveConfig>) {
  const asset = useAsset(primitive.content.assetId)
  const [explored, setExplored] = useState(() => new Set<string>())
  const [selectedPoint, setSelectedPoint] = useState<NormalizedPoint | null>(
    isNormalizedPoint(draft) ? draft : null,
  )
  const {
    ref: immersiveRef,
    immersive,
    toggle: toggleImmersive,
  } = useImmersiveArtifact<HTMLElement>()
  const responsePoint =
    mode === 'review' && isNormalizedPoint(review?.response) ? review.response : selectedPoint
  const readOnly = disabled || mode === 'review'

  const updatePoint = (point: NormalizedPoint) => {
    if (readOnly || primitive.content.mode !== 'assess') return
    setSelectedPoint(point)
    onDraftChange(point)
    onInteract({ name: 'hotspot_location_placed' })
  }

  const handleAssessmentClick = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    updatePoint(
      screenToNormalized(
        { x: event.clientX, y: event.clientY },
        { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height },
      ),
    )
  }

  const handleAssessmentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || primitive.content.mode !== 'assess') return
    if (event.key === 'Enter') {
      if (selectedPoint) onSubmit(selectedPoint)
      event.preventDefault()
      return
    }

    const step = event.shiftKey ? 0.1 : 0.02
    const current = selectedPoint ?? { x: 0.5, y: 0.5 }
    const next = { ...current }
    switch (event.key) {
      case 'ArrowLeft':
        next.x = clamp(current.x - step, 0, 1)
        break
      case 'ArrowRight':
        next.x = clamp(current.x + step, 0, 1)
        break
      case 'ArrowUp':
        next.y = clamp(current.y - step, 0, 1)
        break
      case 'ArrowDown':
        next.y = clamp(current.y + step, 0, 1)
        break
      default:
        return
    }
    updatePoint(next)
    event.preventDefault()
  }

  if (!asset) {
    return (
      <div
        className="grid min-h-64 place-items-center rounded-xl bg-neutral-100 p-6 text-neutral-600"
        role="status"
      >
        Image unavailable
      </div>
    )
  }

  const assessMode = primitive.content.mode === 'assess'
  const assessmentContent = primitive.content.mode === 'assess' ? primitive.content : null
  const targetIds =
    assessmentContent && mode === 'review' && review?.revealAnswer
      ? new Set(assessmentContent.targetRegionIds)
      : new Set<string>()
  const markerStatus =
    mode === 'review'
      ? review?.evaluation.items?.location === 'correct'
        ? 'correct'
        : 'incorrect'
      : undefined

  return (
    <figure
      className={cn(
        'space-y-3',
        immersive && 'fixed inset-0 z-overlay flex h-dvh flex-col bg-neutral-950 p-4 text-white',
      )}
      ref={immersiveRef}
    >
      <div className="flex items-start justify-between gap-3">
        {primitive.content.prompt ? (
          <p className={cn('text-lg font-semibold text-neutral-950', immersive && 'text-white')}>
            {primitive.content.prompt}
          </p>
        ) : (
          <span />
        )}
        <Button
          leadingIcon={<Maximize2 aria-hidden="true" size={16} />}
          onClick={() => void toggleImmersive()}
          size="sm"
          variant="secondary"
        >
          {immersive ? 'Exit' : 'Expand'}
        </Button>
      </div>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-neutral-100',
          assessMode &&
            !readOnly &&
            'cursor-crosshair focus-visible:outline-2 focus-visible:outline-offset-2',
          immersive && 'min-h-0 flex-1',
        )}
        style={
          asset.width && asset.height
            ? { aspectRatio: `${asset.width} / ${asset.height}` }
            : undefined
        }
        role={assessMode ? 'button' : 'group'}
        aria-label={
          assessMode
            ? 'Image location selector. Use arrow keys to move the marker, Shift plus arrow for larger steps, and Enter to submit.'
            : 'Image hotspots'
        }
        tabIndex={assessMode && !readOnly ? 0 : undefined}
        onClick={assessMode ? handleAssessmentClick : undefined}
        onKeyDown={assessMode ? handleAssessmentKeyDown : undefined}
      >
        <img
          className="block w-full"
          src={asset.path}
          alt={primitive.content.alt}
          draggable={false}
        />
        {targetIds.size ? (
          <ImageRegionOverlay regions={primitive.content.regions} visibleRegionIds={targetIds} />
        ) : null}
        {!assessMode
          ? primitive.content.regions.map((region) => {
              const center = regionCenter(region)
              const isExplored = explored.has(region.id)
              return (
                <button
                  key={region.id}
                  type="button"
                  disabled={readOnly}
                  className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-brand-700 font-bold text-white shadow focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
                  aria-label={`Explore ${region.label}`}
                  aria-pressed={isExplored}
                  onClick={() => {
                    if (readOnly || isExplored) return
                    setExplored((current) => new Set(current).add(region.id))
                    onInteract({ name: 'hotspot_revealed', key: region.id })
                  }}
                >
                  {isExplored ? '✓' : '+'}
                </button>
              )
            })
          : null}
        {responsePoint ? (
          <LocationMarker point={responsePoint} label="Selected location" status={markerStatus} />
        ) : null}
      </div>
      {!assessMode && explored.size ? (
        <div className="space-y-2" aria-live="polite">
          {primitive.content.regions
            .filter(({ id }) => explored.has(id))
            .map((region) => (
              <section key={region.id} className="rounded-lg border border-neutral-200 p-3">
                <h3 className="font-semibold text-neutral-950">{region.label}</h3>
                {region.description ? (
                  <p className="mt-1 text-small text-neutral-700">{region.description}</p>
                ) : null}
              </section>
            ))}
        </div>
      ) : null}
      {assessMode && mode === 'interactive' ? (
        <StepActionSlot>
          <Button
            disabled={!selectedPoint || disabled}
            onClick={() => {
              if (selectedPoint) onSubmit(selectedPoint)
            }}
          >
            Check location
          </Button>
        </StepActionSlot>
      ) : null}
      {assessMode && mode === 'review' && review?.revealAnswer ? (
        <p className="text-small font-medium text-neutral-700">
          {review.evaluation.correct
            ? 'Your marker is inside the target region.'
            : 'The highlighted region shows the target.'}
        </p>
      ) : null}
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
    </figure>
  )
}
