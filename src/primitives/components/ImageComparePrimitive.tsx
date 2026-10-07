import { Maximize2 } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui'
import type { ImageComparePrimitive as ImageComparePrimitiveConfig } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { cn } from '@/lib/cn'
import { ImageComparePresentation } from '@/primitives/shared/ImageComparePresentation'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function ImageComparePrimitive({
  primitive,
  onComplete,
  onInteract,
}: PrimitiveComponentProps<ImageComparePrimitiveConfig>) {
  const beforeAsset = useAsset(primitive.content.before.assetId)
  const afterAsset = useAsset(primitive.content.after.assetId)
  const {
    ref: immersiveRef,
    immersive,
    toggle: toggleImmersive,
  } = useImmersiveArtifact<HTMLElement>()

  useEffect(onComplete, [onComplete])

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

  return (
    <figure
      className={cn(
        'space-y-4',
        immersive && 'fixed inset-0 z-overlay h-dvh overflow-y-auto bg-neutral-950 p-4 text-white',
      )}
      ref={immersiveRef}
    >
      <div className="flex justify-end">
        <Button
          leadingIcon={<Maximize2 aria-hidden="true" size={16} />}
          onClick={() => void toggleImmersive()}
          size="sm"
          variant="secondary"
        >
          {immersive ? 'Exit' : 'Expand'}
        </Button>
      </div>
      <ImageComparePresentation
        after={{
          ...primitive.content.after,
          src: afterAsset.path,
          width: afterAsset.width,
          height: afterAsset.height,
        }}
        before={{
          ...primitive.content.before,
          src: beforeAsset.path,
          width: beforeAsset.width,
          height: beforeAsset.height,
        }}
        initialPosition={primitive.content.initialPosition}
        mode={primitive.content.mode}
        onAdjust={() => onInteract({ name: 'image_comparison_adjusted' })}
      />
      {primitive.content.caption ? (
        <figcaption className="text-small text-neutral-600">{primitive.content.caption}</figcaption>
      ) : null}
    </figure>
  )
}
