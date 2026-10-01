import { Maximize2, Tags } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui'
import type { ZoomableImagePrimitive as ZoomableImagePrimitiveConfig } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { ArtifactOverlay } from '@/primitives/shared/ArtifactOverlay'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { PanZoomImage } from '@/primitives/shared/PanZoomImage'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function ZoomableImagePrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<ZoomableImagePrimitiveConfig>) {
  const asset = useAsset(primitive.content.assetId)
  const [expanded, setExpanded] = useState(false)
  const [showRegions, setShowRegions] = useState(true)
  const visibleRegionIds = useMemo(
    () => new Set(showRegions ? primitive.content.regions.map(({ id }) => id) : []),
    [primitive.content.regions, showRegions],
  )
  const regionOverlay = (
    <ImageRegionOverlay regions={primitive.content.regions} visibleRegionIds={visibleRegionIds} />
  )

  useEffect(onComplete, [onComplete])

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

  return (
    <figure className="space-y-3">
      <PanZoomImage
        className="aspect-[4/3] max-h-[60dvh]"
        src={asset.path}
        alt={primitive.content.alt}
        width={asset.width}
        height={asset.height}
        maxZoom={primitive.content.maxZoom}
        overlay={regionOverlay}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Maximize2 aria-hidden="true" />}
          onClick={() => setExpanded(true)}
        >
          Expand image
        </Button>
        {primitive.content.regions.length ? (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Tags aria-hidden="true" />}
            aria-pressed={showRegions}
            onClick={() => setShowRegions((visible) => !visible)}
          >
            {showRegions ? 'Hide labelled regions' : 'Show labelled regions'}
          </Button>
        ) : null}
      </div>
      {showRegions && primitive.content.regions.length ? (
        <ul className="space-y-1 text-small text-neutral-700" aria-label="Labelled image regions">
          {primitive.content.regions.map((region) => (
            <li key={region.id}>
              <strong>{region.label}</strong>
              {region.description ? ` — ${region.description}` : null}
            </li>
          ))}
        </ul>
      ) : null}
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
      <ArtifactOverlay
        open={expanded}
        onOpenChange={setExpanded}
        title={primitive.content.caption ?? primitive.content.alt}
        description={`Zoom up to ${primitive.content.maxZoom}×`}
      >
        <PanZoomImage
          className="h-full rounded-none"
          src={asset.path}
          alt={primitive.content.alt}
          width={asset.width}
          height={asset.height}
          maxZoom={primitive.content.maxZoom}
          overlay={regionOverlay}
          dark
        />
      </ArtifactOverlay>
    </figure>
  )
}
