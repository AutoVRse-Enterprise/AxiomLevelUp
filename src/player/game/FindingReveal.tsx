import type { GameConfig } from '@/content/schema/game'
import type { ImageHotspotPrimitive } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import type { PlannedRound } from '@/engines/games/plan'
import { isNormalizedPoint } from '@/primitives/definitions/imageHitTesting'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { LocationMarker } from '@/primitives/shared/LocationMarker'
import { PanZoomImage } from '@/primitives/shared/PanZoomImage'

export function FindingReveal({
  plannedRound,
  response,
  correct,
  copy,
}: {
  plannedRound: PlannedRound
  response: unknown
  correct: boolean
  copy: NonNullable<GameConfig['copy']>
}) {
  const primitive =
    plannedRound.primitive.type === 'image_hotspot'
      ? (plannedRound.primitive as ImageHotspotPrimitive)
      : null
  const asset = useAsset(primitive?.content.assetId)
  if (!asset || !primitive || primitive.content.mode !== 'assess') return null
  const point = isNormalizedPoint(response) ? response : null
  const targetIds = new Set(primitive.content.targetRegionIds)

  return (
    <div className="mt-5 space-y-3">
      <p className="text-small text-neutral-700">{copy.findingRevealPrompt}</p>
      <div className="flex flex-wrap gap-4 text-small">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-danger-600" />
          {copy.findingMarkerLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded border-2 border-brand-700 bg-brand-100"
          />
          {copy.findingTargetLabel}
        </span>
      </div>
      <PanZoomImage
        alt={primitive.content.alt}
        height={asset.height}
        maxZoom={primitive.content.zoom?.maxScale ?? 4}
        overlay={
          <>
            <ImageRegionOverlay regions={primitive.content.regions} visibleRegionIds={targetIds} />
            {point ? (
              <LocationMarker
                label={copy.findingMarkerLabel}
                point={point}
                status={correct ? 'correct' : 'incorrect'}
              />
            ) : null}
          </>
        }
        src={asset.path}
        width={asset.width}
      />
    </div>
  )
}
