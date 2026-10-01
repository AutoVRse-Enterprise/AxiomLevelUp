import { CheckCircle2, Circle } from 'lucide-react'
import { useRef, useState } from 'react'

import type { DicomExplorePrimitive as DicomExplorePrimitiveContent } from '@/content/schema/primitives'
import { DicomViewer } from '@/imaging/viewer/DicomViewer'
import type { DicomMeasurement } from '@/imaging/viewer/controller'
import {
  exploreRequirementKeys,
  satisfiedExploreRequirements,
  type DicomObservation,
} from '@/imaging/requirements'
import { defaultDicomTools, useDicomPrimitiveContext } from '@/primitives/components/dicomUtils'
import type { PrimitiveComponentProps, PrimitiveInteraction } from '@/primitives/types'

const initialObservation: DicomObservation = {
  slice: 1,
  presetId: null,
  activeTool: 'scroll',
  interactionCount: 0,
  acknowledgedStepIds: new Set(),
}

export function DicomExplorePrimitive({
  primitive,
  draft,
  disabled,
  onComplete,
  onDraftChange,
  onInteract,
}: PrimitiveComponentProps<DicomExplorePrimitiveContent>) {
  const { appConfig, asset } = useDicomPrimitiveContext(primitive)
  const initialDraft =
    draft && typeof draft === 'object' ? (draft as Partial<DicomObservation>) : undefined
  const [observation, setObservation] = useState<DicomObservation>({
    ...initialObservation,
    slice: initialDraft?.slice ?? primitive.content.initialSlice ?? 1,
    presetId: initialDraft?.presetId ?? primitive.content.initialPresetId ?? null,
    activeTool: initialDraft?.activeTool ?? 'scroll',
    interactionCount: initialDraft?.interactionCount ?? 0,
  })
  const observationRef = useRef(observation)
  const reportedRequirements = useRef(new Set<string>())

  const record = (patch: Partial<DicomObservation>, interaction: PrimitiveInteraction) => {
    if (disabled) return
    const next = {
      ...observationRef.current,
      ...patch,
      interactionCount: observationRef.current.interactionCount + 1,
    }
    observationRef.current = next
    setObservation(next)
    onInteract(interaction)
    onInteract({ name: 'dicom_requirement', key: `interaction:${next.interactionCount}` })
    for (const key of satisfiedExploreRequirements(primitive, next)) {
      if (!reportedRequirements.current.has(key)) {
        reportedRequirements.current.add(key)
        onInteract({ name: 'dicom_requirement', key })
      }
    }
    onDraftChange({
      slice: next.slice,
      presetId: next.presetId,
      activeTool: next.activeTool,
      interactionCount: next.interactionCount,
    })
  }

  const expectedKeys = exploreRequirementKeys(primitive)
  const satisfiedKeys = new Set(satisfiedExploreRequirements(primitive, observation))

  return (
    <DicomViewer
      asset={asset}
      config={appConfig.product.dicom}
      initialPresetId={observation.presetId ?? undefined}
      initialSlice={observation.slice}
      marker={undefined}
      panel={
        expectedKeys.length ? (
          <ul className="space-y-3">
            {expectedKeys.map((key) => {
              const complete = satisfiedKeys.has(key)
              return (
                <li className="flex gap-2 text-small" key={key}>
                  {complete ? (
                    <CheckCircle2 aria-hidden="true" className="text-success-600" size={18} />
                  ) : (
                    <Circle aria-hidden="true" className="text-neutral-400" size={18} />
                  )}
                  {requirementLabel(key, primitive)}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-small">Explore the study, then continue when you are ready.</p>
        )
      }
      presets={primitive.content.presets}
      prompt={primitive.content.prompt}
      tools={primitive.content.tools ?? defaultDicomTools}
      onFailed={(reason) => onInteract({ name: 'dicom_viewer_failed', reason })}
      onLoaded={(firstImageMs, sliceCount) => {
        onInteract({ name: 'dicom_viewer_loaded', firstImageMs, sliceCount })
        if (primitive.completion.mode === 'viewed') onComplete()
      }}
      onMeasurement={(measurement: DicomMeasurement) =>
        record(
          {},
          {
            name: 'dicom_measurement',
            slice: measurement.slice,
            value: measurement.value,
            unit: measurement.unit,
          },
        )
      }
      onPreset={(preset) =>
        record(
          { presetId: preset.id },
          {
            name: 'dicom_window',
            presetId: preset.id,
            center: preset.center,
            width: preset.width,
          },
        )
      }
      onSkip={onComplete}
      onSlice={(slice) => record({ slice }, { name: 'dicom_slice', slice })}
      onTool={(tool) => record({ activeTool: tool }, { name: 'dicom_tool', tool })}
      onWindow={(center, width) =>
        record({ presetId: null }, { name: 'dicom_window', center, width })
      }
    />
  )
}

function requirementLabel(key: string, primitive: DicomExplorePrimitiveContent): string {
  if (key === 'interactions') {
    return `Use at least ${primitive.content.requirements?.minimumInteractions} viewer controls`
  }
  if (key === 'slice_range') {
    const range = primitive.content.requirements?.visitSliceRange
    return `Visit slices ${range?.from}–${range?.to}`
  }
  const id = key.replace('preset:', '')
  return `Select ${primitive.content.presets.find((preset) => preset.id === id)?.label ?? id}`
}
