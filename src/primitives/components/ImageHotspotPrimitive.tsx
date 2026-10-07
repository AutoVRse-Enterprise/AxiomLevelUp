import { Maximize2 } from 'lucide-react'
import { lazy, Suspense, useState, type KeyboardEvent, type MouseEvent } from 'react'

import { Button } from '@/components/ui'
import type {
  ImageHotspotPrimitive as ImageHotspotPrimitiveConfig,
  NormalizedPoint,
} from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { StepActionSlot } from '@/player/StepActionSlot'
import { isNormalizedPoint } from '@/primitives/definitions/imageHitTesting'
import { ImageComparePresentation } from '@/primitives/shared/ImageComparePresentation'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { LocationMarker } from '@/primitives/shared/LocationMarker'
import { PanZoomImage } from '@/primitives/shared/PanZoomImage'
import { regionCenter } from '@/primitives/shared/imageRegionMath'
import { clamp, screenToNormalized } from '@/primitives/shared/panZoomMath'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
import { cn } from '@/lib/cn'

const RegionDebugOverlay = import.meta.env.DEV
  ? lazy(() =>
      import('@/primitives/shared/RegionDebugOverlay').then((module) => ({
        default: module.RegionDebugOverlay,
      })),
    )
  : null

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
  const { labels } = usePresentation()
  const asset = useAsset(primitive.content.assetId)
  const compareAsset = useAsset(
    primitive.content.mode === 'assess' ? primitive.content.compare?.assetId : undefined,
  )
  const [explored, setExplored] = useState(() => new Set<string>())
  const [showCompare, setShowCompare] = useState(false)
  const [debugPoint, setDebugPoint] = useState<NormalizedPoint | null>(null)
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
  const regionDebugEnabled =
    RegionDebugOverlay !== null &&
    new URLSearchParams(window.location.search).get('regionDebug') === '1'

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

  const handleAssessmentKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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
  const zoomEnabled = assessmentContent?.zoom?.enabled === true
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
        <div className="flex flex-wrap justify-end gap-2">
          {assessmentContent?.compare && compareAsset ? (
            <Button
              onClick={() => {
                setShowCompare((current) => !current)
                onInteract({ name: 'hotspot_compare_toggled' })
              }}
              size="sm"
              variant="secondary"
            >
              {showCompare ? labels.returnToFinding : labels.compareReference}
            </Button>
          ) : null}
          <Button
            leadingIcon={<Maximize2 aria-hidden="true" size={16} />}
            onClick={() => void toggleImmersive()}
            size="sm"
            variant="secondary"
          >
            {immersive ? 'Exit' : 'Expand'}
          </Button>
        </div>
      </div>
      {showCompare && assessmentContent?.compare && compareAsset ? (
        <ImageComparePresentation
          after={{
            src: compareAsset.path,
            alt: assessmentContent.compare.alt,
            label: assessmentContent.compare.label,
            width: compareAsset.width,
            height: compareAsset.height,
          }}
          before={{
            src: asset.path,
            alt: primitive.content.alt,
            label: assessmentContent.answerLabel ?? 'Finding',
            width: asset.width,
            height: asset.height,
          }}
          mode="side_by_side"
        />
      ) : (
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
          role={assessMode && !zoomEnabled ? 'button' : 'group'}
          aria-label={
            assessMode
              ? 'Image location selector. Use arrow keys to move the marker, Shift plus arrow for larger steps, and Enter to submit.'
              : 'Image hotspots'
          }
          tabIndex={assessMode && !zoomEnabled && !readOnly ? 0 : undefined}
          onClick={assessMode && !zoomEnabled ? handleAssessmentClick : undefined}
          onKeyDown={assessMode && !zoomEnabled ? handleAssessmentKeyDown : undefined}
          onPointerMove={
            !zoomEnabled && regionDebugEnabled
              ? (event) => {
                  const bounds = event.currentTarget.getBoundingClientRect()
                  setDebugPoint(
                    screenToNormalized(
                      { x: event.clientX, y: event.clientY },
                      {
                        left: bounds.left,
                        top: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                      },
                    ),
                  )
                }
              : undefined
          }
        >
          {zoomEnabled ? (
            <PanZoomImage
              alt={primitive.content.alt}
              className="h-full min-h-64 rounded-none"
              focusPoint={responsePoint}
              height={asset.height}
              keyboardMode="external"
              maxZoom={assessmentContent.zoom?.maxScale ?? 4}
              onKeyDown={handleAssessmentKeyDown}
              onPointerPosition={regionDebugEnabled ? setDebugPoint : undefined}
              onTap={readOnly ? undefined : updatePoint}
              overlay={
                <>
                  {targetIds.size ? (
                    <ImageRegionOverlay
                      regions={primitive.content.regions}
                      visibleRegionIds={targetIds}
                    />
                  ) : null}
                  {responsePoint ? (
                    <LocationMarker
                      point={responsePoint}
                      label="Selected location"
                      status={markerStatus}
                    />
                  ) : null}
                  {regionDebugEnabled && RegionDebugOverlay ? (
                    <Suspense fallback={null}>
                      <RegionDebugOverlay point={debugPoint} regions={primitive.content.regions} />
                    </Suspense>
                  ) : null}
                </>
              }
              src={asset.path}
              width={asset.width}
            />
          ) : (
            <>
              <img
                className="block w-full"
                src={asset.path}
                alt={primitive.content.alt}
                draggable={false}
              />
              {targetIds.size ? (
                <ImageRegionOverlay
                  regions={primitive.content.regions}
                  visibleRegionIds={targetIds}
                />
              ) : null}
            </>
          )}
          {!zoomEnabled && regionDebugEnabled && RegionDebugOverlay ? (
            <Suspense fallback={null}>
              <RegionDebugOverlay point={debugPoint} regions={primitive.content.regions} />
            </Suspense>
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
          {responsePoint && !zoomEnabled ? (
            <LocationMarker point={responsePoint} label="Selected location" status={markerStatus} />
          ) : null}
        </div>
      )}
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
            {labels.checkLocation}
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
