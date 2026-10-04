import { useState } from 'react'

import type { DicomMeasurePrimitive as DicomMeasurePrimitiveContent } from '@/content/schema/primitives'
import { Button } from '@/components/ui'
import type { DicomMeasurementResponse } from '@/imaging/evaluation'
import { DicomViewer } from '@/imaging/viewer/DicomViewer'
import type { DicomMeasurement } from '@/imaging/viewer/controller'
import { StepActionSlot } from '@/player/StepActionSlot'
import { useDicomPrimitiveContext } from '@/primitives/components/dicomUtils'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function DicomMeasurePrimitive({
  primitive,
  draft,
  disabled,
  mode,
  review,
  onDraftChange,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<DicomMeasurePrimitiveContent>) {
  const { appConfig, asset } = useDicomPrimitiveContext(primitive)
  const saved = parseResponse(mode === 'review' ? review?.response : draft)
  const [slice, setSlice] = useState(
    mode === 'review' && review?.revealAnswer
      ? (primitive.content.target.referenceLine?.slice ?? primitive.content.target.sliceRange.from)
      : (saved?.slice ?? primitive.content.initialSlice ?? 1),
  )
  const [measurement, setMeasurement] = useState<DicomMeasurementResponse | null>(saved)
  const calibrated = measurement?.unit.toLowerCase() === 'mm'
  const referenceLine =
    review?.revealAnswer && primitive.content.target.referenceLine
      ? primitive.content.target.referenceLine
      : undefined

  const panel = (
    <div className="space-y-4 text-small">
      <p>Choose Measure, then drag across the target's maximum transverse inner diameter.</p>
      {measurement ? (
        <p aria-live="polite">
          Current measurement:{' '}
          <strong>
            {measurement.value.toFixed(1)} {measurement.unit}
          </strong>{' '}
          on slice {measurement.slice}.
        </p>
      ) : (
        <p aria-live="polite">No measurement recorded yet.</p>
      )}
      {measurement && !calibrated ? (
        <p className="text-danger-700" role="alert">
          This measurement has no calibrated millimetre unit and cannot be graded.
        </p>
      ) : null}
      {!disabled ? (
        <StepActionSlot>
          <Button disabled={!measurement || !calibrated} onClick={() => onSubmit(measurement)}>
            Check measurement
          </Button>
        </StepActionSlot>
      ) : null}
      {review?.revealAnswer ? (
        <p>
          Expected: {primitive.content.target.expected.valueMm.toFixed(1)} mm on slices{' '}
          {primitive.content.target.sliceRange.from}–{primitive.content.target.sliceRange.to}.
        </p>
      ) : null}
    </div>
  )

  return (
    <DicomViewer
      asset={asset}
      config={appConfig.product.dicom}
      initialPresetId={primitive.content.initialPresetId}
      initialSlice={slice}
      panel={panel}
      presets={primitive.content.presets}
      prompt={primitive.content.prompt}
      revealLine={referenceLine}
      tools={primitive.content.tools ?? ['scroll', 'zoom', 'pan', 'measure']}
      onFailed={(reason) => onInteract({ name: 'dicom_viewer_failed', reason })}
      onLoaded={(firstImageMs, sliceCount) =>
        onInteract({ name: 'dicom_viewer_loaded', firstImageMs, sliceCount })
      }
      onMeasurement={(next: DicomMeasurement) => {
        const response: DicomMeasurementResponse = next
        setMeasurement(response)
        onDraftChange(response)
        onInteract({
          name: 'dicom_measurement',
          slice: response.slice,
          value: response.value,
          unit: response.unit,
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

function parseResponse(value: unknown): DicomMeasurementResponse | null {
  if (!value || typeof value !== 'object') return null
  const response = value as Partial<DicomMeasurementResponse>
  return Number.isInteger(response.slice) &&
    typeof response.value === 'number' &&
    typeof response.unit === 'string'
    ? (response as DicomMeasurementResponse)
    : null
}
