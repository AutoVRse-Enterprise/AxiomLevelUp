import { ImageOff, Maximize2, Tags } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button, LoadingState } from '@/components/ui'
import type { ImagePrimitive as ImagePrimitiveConfig } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { ArtifactOverlay } from '@/primitives/shared/ArtifactOverlay'
import { PanZoomImage } from '@/primitives/shared/PanZoomImage'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function ImagePrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<ImagePrimitiveConfig>) {
  const asset = useAsset(primitive.content.assetId)
  const [expanded, setExpanded] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'error'>(
    asset ? 'loading' : 'error',
  )

  useEffect(onComplete, [onComplete])

  const annotations = showAnnotations ? (
    <>
      {primitive.content.annotations?.map((annotation) => (
        <span
          key={annotation.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950/85 px-2 py-1 text-caption font-semibold text-white"
          style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }}
        >
          {annotation.label}
        </span>
      ))}
    </>
  ) : null

  return (
    <figure className="space-y-3">
      <div
        className="relative overflow-hidden rounded-xl bg-neutral-100"
        style={
          asset?.width && asset.height
            ? { aspectRatio: `${asset.width} / ${asset.height}` }
            : undefined
        }
      >
        {asset && mediaState !== 'error' ? (
          <>
          <img
            className={`mx-auto max-h-[60dvh] w-full object-contain transition-opacity duration-250 ${
              mediaState === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
            key={loadAttempt}
            src={asset.path}
            alt={primitive.content.alt}
            onError={() => setMediaState('error')}
            onLoad={() => setMediaState('ready')}
          />
          {mediaState === 'loading' ? (
            <LoadingState
              className="absolute inset-0 rounded-none border-0 shadow-none"
              message="Optimizing the image for this screen."
              title="Loading image"
            />
          ) : null}
          </>
        ) : (
          <div className="grid min-h-64 place-items-center gap-3 p-6 text-center text-neutral-600" role="alert">
            <ImageOff aria-hidden="true" size={28} />
            <p>Image unavailable</p>
            {asset ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setLoadAttempt((attempt) => attempt + 1)
                  setMediaState('loading')
                }}
              >
                Retry image
              </Button>
            ) : null}
          </div>
        )}
        {annotations}
      </div>
      {asset ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Maximize2 aria-hidden="true" />}
            onClick={() => setExpanded(true)}
          >
            Expand image
          </Button>
          {primitive.content.annotations?.length ? (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Tags aria-hidden="true" />}
              aria-pressed={showAnnotations}
              onClick={() => setShowAnnotations((visible) => !visible)}
            >
              {showAnnotations ? 'Hide annotations' : 'Show annotations'}
            </Button>
          ) : null}
        </div>
      ) : null}
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
      {asset ? (
        <ArtifactOverlay
          open={expanded}
          onOpenChange={setExpanded}
          title={primitive.content.caption ?? primitive.content.alt}
          description="Pan and zoom image"
        >
          <PanZoomImage
            className="h-full rounded-none"
            src={asset.path}
            alt={primitive.content.alt}
            width={asset.width}
            height={asset.height}
            maxZoom={4}
            overlay={annotations}
            dark
          />
        </ArtifactOverlay>
      ) : null}
    </figure>
  )
}
