import { useState } from 'react'

import type {
  DicomIdentifyRegionPrimitive as DicomIdentifyRegionPrimitiveContent,
  NormalizedPoint,
} from '@/content/schema/primitives'
import { Button } from '@/components/ui'
import type { DicomRegionResponse } from '@/imaging/evaluation'
import { isSliceInRange } from '@/imaging/geometry'
import { DicomViewer } from '@/imaging/viewer/DicomViewer'
import { defaultDicomTools, useDicomPrimitiveContext } from '@/primitives/components/dicomUtils'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function DicomIdentifyRegionPrimitive({
  primitive,
  draft,
  disabled,
  mode,
  review,
  onDraftChange,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<DicomIdentifyRegionPrimitiveContent>) {
  const { appConfig, asset } = useDicomPrimitiveContext(primitive)
  const saved = parseResponse(mode === 'review' ? review?.response : draft)
  const [slice, setSlice] = useState(
    mode === 'review' && review?.revealAnswer
      ? primitive.content.target.referenceSlice
      : (saved?.slice ?? primitive.content.initialSlice ?? 1),
  )
  const [selection, setSelection] = useState<DicomRegionResponse | null>(saved)
  const revealTarget =
    Boolean(review?.revealAnswer) && isSliceInRange(slice, primitive.content.target.sliceRange)
      ? primitive.content.target.region
      : undefined

  const panel = (
    <div className="space-y-4 text-small">
      <p>Select the target on the slice where it is best demonstrated.</p>
      {selection ? (
        <p>
          Marker placed on slice <strong>{selection.slice}</strong>. You may reposition it before
          submitting.
        </p>
      ) : (
        <p>No marker placed yet.</p>
      )}
      {!disabled ? (
        <Button disabled={!selection} onClick={() => onSubmit(selection)}>
          Check location
        </Button>
      ) : null}
    </div>
  )

  return (
    <DicomViewer
      asset={asset}
      config={appConfig.product.dicom}
      initialPresetId={primitive.content.initialPresetId}
      initialSlice={slice}
      marker={selection?.slice === slice ? selection.point : undefined}
      panel={panel}
      pointSelection={!disabled}
      presets={primitive.content.presets}
      prompt={primitive.content.prompt}
      revealRegion={revealTarget}
      tools={primitive.content.tools ?? defaultDicomTools}
      onFailed={(reason) => onInteract({ name: 'dicom_viewer_failed', reason })}
      onLoaded={(firstImageMs, sliceCount) =>
        onInteract({ name: 'dicom_viewer_loaded', firstImageMs, sliceCount })
      }
      onPointSelected={(selectedSlice, point) => {
        const response = { slice: selectedSlice, point }
        setSelection(response)
        onDraftChange(response)
        onInteract({
          name: 'dicom_region',
          slice: selectedSlice,
          x: point.x,
          y: point.y,
        })
      }}
      onPreset={(preset) =>
        onInteract({
          name: 'dicom_window',
          presetId: preset.id,
          center: preset.center,
          width: preset.width,
        })
      }
      onSkip={() => onSubmit(undefined)}
      onSlice={(nextSlice) => {
        setSlice(nextSlice)
        onInteract({ name: 'dicom_slice', slice: nextSlice })
      }}
      onTool={(tool) => onInteract({ name: 'dicom_tool', tool })}
      onWindow={(center, width) => onInteract({ name: 'dicom_window', center, width })}
    />
  )
}

function parseResponse(value: unknown): DicomRegionResponse | null {
  if (!value || typeof value !== 'object') return null
  const response = value as Partial<DicomRegionResponse>
  const point = response.point as Partial<NormalizedPoint> | undefined
  return Number.isInteger(response.slice) &&
    typeof point?.x === 'number' &&
    typeof point.y === 'number'
    ? (response as DicomRegionResponse)
    : null
}
