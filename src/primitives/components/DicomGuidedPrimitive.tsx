import { CheckCircle2, Circle } from 'lucide-react'
import { useRef, useState } from 'react'

import type { DicomGuidedPrimitive as DicomGuidedPrimitiveContent } from '@/content/schema/primitives'
import { Button } from '@/components/ui'
import { guidedStepSatisfied, type DicomObservation } from '@/imaging/requirements'
import { DicomViewer } from '@/imaging/viewer/DicomViewer'
import type { DicomMeasurement } from '@/imaging/viewer/controller'
import { defaultDicomTools, useDicomPrimitiveContext } from '@/primitives/components/dicomUtils'
import type { PrimitiveComponentProps, PrimitiveInteraction } from '@/primitives/types'

interface GuidedDraft {
  slice: number
  presetId: string | null
  activeTool: DicomObservation['activeTool']
  interactionCount: number
  completedStepIds: string[]
  selectedOptionId?: string
}

export function DicomGuidedPrimitive({
  primitive,
  draft,
  disabled,
  mode,
  review,
  onComplete,
  onDraftChange,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<DicomGuidedPrimitiveContent>) {
  const { appConfig, asset } = useDicomPrimitiveContext(primitive)
  const saved = draft && typeof draft === 'object' ? (draft as Partial<GuidedDraft>) : undefined
  const [completedStepIds, setCompletedStepIds] = useState(saved?.completedStepIds ?? [])
  const completedRef = useRef(new Set(saved?.completedStepIds ?? []))
  const [selectedOptionId, setSelectedOptionId] = useState(
    mode === 'review' && typeof review?.response === 'string'
      ? review.response
      : saved?.selectedOptionId,
  )
  const [observation, setObservation] = useState<DicomObservation>({
    slice: saved?.slice ?? primitive.content.initialSlice ?? 1,
    presetId: saved?.presetId ?? primitive.content.initialPresetId ?? null,
    activeTool: saved?.activeTool ?? 'scroll',
    interactionCount: saved?.interactionCount ?? 0,
    acknowledgedStepIds: new Set(),
  })
  const observationRef = useRef(observation)

  const persist = (
    next: DicomObservation,
    completed: ReadonlySet<string>,
    option = selectedOptionId,
  ) => {
    onDraftChange({
      slice: next.slice,
      presetId: next.presetId,
      activeTool: next.activeTool,
      interactionCount: next.interactionCount,
      completedStepIds: [...completed],
      selectedOptionId: option,
    } satisfies GuidedDraft)
  }

  const advance = (next: DicomObservation) => {
    const step = primitive.content.steps.find(({ id }) => !completedRef.current.has(id))
    if (!step || !guidedStepSatisfied(step, next)) return
    completedRef.current.add(step.id)
    const completed = [...completedRef.current]
    setCompletedStepIds(completed)
    onInteract({ name: 'dicom_requirement', key: step.id })
    persist(next, completedRef.current)
    if (completed.length === primitive.content.steps.length && !primitive.content.checkpoint) {
      onComplete()
    }
  }

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
    advance(next)
    persist(next, completedRef.current)
  }

  const completedSet = new Set(completedStepIds)
  const currentStep = primitive.content.steps.find(({ id }) => !completedSet.has(id))
  const stepsComplete = completedStepIds.length === primitive.content.steps.length
  const checkpoint = primitive.content.checkpoint

  const panel = (
    <div className="space-y-5">
      <ol className="space-y-3">
        {primitive.content.steps.map((step) => {
          const complete = completedSet.has(step.id)
          return (
            <li className="flex gap-2 text-small" key={step.id}>
              {complete ? (
                <CheckCircle2 aria-hidden="true" className="shrink-0 text-success-600" size={18} />
              ) : (
                <Circle aria-hidden="true" className="shrink-0 text-neutral-400" size={18} />
              )}
              <span className={currentStep?.id === step.id ? 'font-semibold' : undefined}>
                {step.instruction}
              </span>
            </li>
          )
        })}
      </ol>
      {currentStep?.condition.type === 'acknowledge' && !disabled ? (
        <Button
          onClick={() => {
            const acknowledged = new Set(observationRef.current.acknowledgedStepIds)
            acknowledged.add(currentStep.id)
            record(
              { acknowledgedStepIds: acknowledged },
              { name: 'dicom_requirement', key: currentStep.id },
            )
          }}
        >
          Done
        </Button>
      ) : null}
      {stepsComplete && checkpoint ? (
        <fieldset className="space-y-3">
          <legend className="font-semibold">{checkpoint.prompt}</legend>
          {checkpoint.options.map((option) => (
            <label className="flex gap-3 rounded-lg border border-neutral-200 p-3" key={option.id}>
              <input
                checked={selectedOptionId === option.id}
                disabled={disabled}
                name={`${primitive.id}-checkpoint`}
                type="radio"
                value={option.id}
                onChange={() => {
                  setSelectedOptionId(option.id)
                  persist(observationRef.current, completedRef.current, option.id)
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
          {!disabled ? (
            <Button disabled={!selectedOptionId} onClick={() => onSubmit(selectedOptionId)}>
              Check answer
            </Button>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  )

  return (
    <DicomViewer
      asset={asset}
      config={appConfig.product.dicom}
      initialPresetId={observation.presetId ?? undefined}
      initialSlice={observation.slice}
      panel={panel}
      presets={primitive.content.presets}
      prompt={currentStep?.instruction ?? checkpoint?.prompt ?? primitive.content.prompt}
      tools={primitive.content.tools ?? defaultDicomTools}
      onFailed={(reason) => onInteract({ name: 'dicom_viewer_failed', reason })}
      onLoaded={(firstImageMs, sliceCount) =>
        onInteract({ name: 'dicom_viewer_loaded', firstImageMs, sliceCount })
      }
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
      onSkip={() => (checkpoint ? onSubmit(undefined) : onComplete())}
      onSlice={(slice) => record({ slice }, { name: 'dicom_slice', slice })}
      onTool={(tool) => record({ activeTool: tool }, { name: 'dicom_tool', tool })}
      onWindow={(center, width) =>
        record({ presetId: null }, { name: 'dicom_window', center, width })
      }
    />
  )
}
