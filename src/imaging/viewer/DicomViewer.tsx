import {
  Expand,
  Info,
  Maximize2,
  Move,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  ZoomIn,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import type {
  DicomPresetContent,
  DicomTool,
  ImageRegion,
  NormalizedPoint,
} from '@/content/schema/primitives'
import type { AppConfig } from '@/content/schema'
import { Button, Chip, ProgressBar, Sheet } from '@/components/ui'
import type { DicomLine } from '@/imaging/geometry'
import type { DicomAsset } from '@/imaging/series'
import { AnnotationOverlay } from '@/imaging/viewer/AnnotationOverlay'
import type { DicomMeasurement } from '@/imaging/viewer/controller'
import { useDicomViewer } from '@/imaging/viewer/useDicomViewer'
import { cn } from '@/lib/cn'

const toolDetails: Record<DicomTool, { label: string; icon: typeof Move }> = {
  scroll: { label: 'Scroll', icon: Expand },
  window: { label: 'Window', icon: SlidersHorizontal },
  zoom: { label: 'Zoom', icon: ZoomIn },
  pan: { label: 'Pan', icon: Move },
  measure: { label: 'Measure', icon: Ruler },
}

export interface DicomViewerProps {
  asset: DicomAsset
  prompt: string
  presets: DicomPresetContent[]
  tools: DicomTool[]
  config: AppConfig['product']['dicom']
  initialSlice?: number
  initialPresetId?: string
  panel?: ReactNode
  marker?: NormalizedPoint
  revealRegion?: ImageRegion
  revealLine?: DicomLine
  pointSelection?: boolean
  onPointSelected?: (slice: number, point: NormalizedPoint) => void
  onSlice?: (slice: number) => void
  onPreset?: (preset: DicomPresetContent) => void
  onTool?: (tool: DicomTool) => void
  onWindow?: (center: number, width: number) => void
  onMeasurement?: (measurement: DicomMeasurement) => void
  onLoaded?: (firstImageMs: number, sliceCount: number) => void
  onFailed?: (reason: string) => void
  onSkip?: () => void
}

export function DicomViewer({
  asset,
  prompt,
  presets,
  tools,
  config,
  initialSlice,
  initialPresetId,
  panel,
  marker,
  revealRegion,
  revealLine,
  pointSelection = false,
  onPointSelected,
  onSlice,
  onPreset,
  onTool,
  onWindow,
  onMeasurement,
  onLoaded,
  onFailed,
  onSkip,
}: DicomViewerProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [immersive, setImmersive] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const sliceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedReported = useRef(false)
  const failureReported = useRef<string | null>(null)
  const initialPreset = presets.find(({ id }) => id === initialPresetId)

  const reportSlice = useCallback(
    (slice: number) => {
      if (sliceTimer.current) clearTimeout(sliceTimer.current)
      sliceTimer.current = setTimeout(() => onSlice?.(slice), config.sliceEventDebounceMs)
    },
    [config.sliceEventDebounceMs, onSlice],
  )
  const reportWindow = useCallback(
    (center: number, width: number) => onWindow?.(center, width),
    [onWindow],
  )
  const reportMeasurement = useCallback(
    (measurement: DicomMeasurement) => onMeasurement?.(measurement),
    [onMeasurement],
  )
  const { state, controller, retry } = useDicomViewer({
    element,
    asset,
    initialSlice,
    initialPreset,
    config,
    onSlice: reportSlice,
    onWindow: reportWindow,
    onMeasurement: reportMeasurement,
  })

  useEffect(
    () => () => {
      if (sliceTimer.current) clearTimeout(sliceTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (state.status === 'ready' && state.firstImageMs !== null && !loadedReported.current) {
      loadedReported.current = true
      onLoaded?.(state.firstImageMs, state.total)
    }
    if (
      (state.status === 'error' || state.status === 'unavailable') &&
      failureReported.current !== state.message
    ) {
      failureReported.current = state.message
      onFailed?.(state.message)
    }
  }, [onFailed, onLoaded, state])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setImmersive(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  async function toggleImmersive() {
    if (immersive) {
      if (document.fullscreenElement) await document.exitFullscreen()
      setImmersive(false)
      return
    }
    setImmersive(true)
    try {
      await rootRef.current?.requestFullscreen?.()
    } catch {
      // The fixed overlay remains the iOS/non-Fullscreen fallback.
    }
  }

  const selectTool = (tool: DicomTool) => {
    controller?.activateTool(tool)
    onTool?.(tool)
  }
  const selectPreset = (preset: DicomPresetContent) => {
    controller?.applyPreset(preset)
    onPreset?.(preset)
  }

  const failed = state.status === 'error' || state.status === 'unavailable'

  return (
    <div
      data-dicom-viewer=""
      ref={rootRef}
      className={cn(
        'overflow-hidden rounded-xl border border-clinical-700 bg-clinical-950 text-white shadow-card',
        immersive &&
          'fixed inset-0 z-50 flex h-dvh w-screen flex-col rounded-none border-0 pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-clinical-700 p-3 sm:p-4">
        <div className="min-w-0">
          <Chip>DICOM · Educational use</Chip>
          <p className="mt-2 text-small text-neutral-200">{prompt}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {panel ? (
            <Button
              aria-label="Open activity instructions"
              className={cn(!immersive && 'lg:hidden')}
              size="sm"
              variant="secondary"
              onClick={() => setInstructionsOpen(true)}
            >
              <Info aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Instructions</span>
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => void toggleImmersive()}>
            {immersive ? 'Exit' : 'Expand'}
          </Button>
        </div>
      </header>

      <div className={cn(panel && !immersive && 'lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]')}>
        <div
          aria-label="DICOM image viewport"
          className={cn(
            'dicom-viewport relative h-[55dvh] min-h-80 w-full touch-none bg-black outline-none',
            immersive && 'min-h-0 flex-1',
          )}
          onContextMenu={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
              event.preventDefault()
              void controller?.setSlice(state.slice + 1)
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
              event.preventDefault()
              void controller?.setSlice(state.slice - 1)
            }
          }}
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current
            pointerStart.current = null
            if (!pointSelection || !start) return
            if (
              Math.hypot(event.clientX - start.x, event.clientY - start.y) > config.tapMaxMovementPx
            ) {
              return
            }
            const point = controller?.clientPointToImage(event.clientX, event.clientY)
            if (point) onPointSelected?.(state.slice, point)
          }}
          ref={setElement}
          aria-valuemax={Math.max(1, state.total)}
          aria-valuemin={1}
          aria-valuenow={state.slice}
          role="slider"
          tabIndex={0}
        >
          <AnnotationOverlay
            controller={controller}
            marker={marker}
            region={revealRegion}
            line={revealLine}
            currentSlice={state.slice}
          />
          {state.status !== 'ready' ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-clinical-950/95 p-6 text-center">
              <div className="w-full max-w-md">
                <p className="font-semibold">
                  {failed ? 'Imaging study unavailable' : 'Preparing imaging study'}
                </p>
                <p className="mt-2 text-small text-neutral-300">{state.message}</p>
                {state.total > 0 && !failed ? (
                  <ProgressBar
                    className="mt-5 [&_span]:text-neutral-200"
                    label={`Loading ${state.loaded} / ${state.total} slices`}
                    max={state.total}
                    value={state.loaded}
                  />
                ) : null}
                {failed ? (
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => {
                        loadedReported.current = false
                        failureReported.current = null
                        retry()
                      }}
                    >
                      Retry
                    </Button>
                    {onSkip ? (
                      <Button variant="secondary" onClick={onSkip}>
                        Skip activity
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        {panel && !immersive ? (
          <aside className="hidden overflow-y-auto border-l border-clinical-700 bg-clinical-900 p-5 lg:block">
            <h2 className="font-bold">Activity instructions</h2>
            <p className="mt-2 text-small text-neutral-300">{prompt}</p>
            <div className="mt-5">{panel}</div>
          </aside>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-clinical-700 p-3 sm:p-4">
        <div aria-label="Viewer tools" className="flex flex-wrap gap-2" role="group">
          {tools.map((tool) => {
            const { label, icon: Icon } = toolDetails[tool]
            return (
              <Button
                aria-pressed={state.activeTool === tool}
                key={tool}
                leadingIcon={<Icon aria-hidden="true" size={16} />}
                size="sm"
                variant={state.activeTool === tool ? 'primary' : 'secondary'}
                onClick={() => selectTool(tool)}
              >
                {label}
              </Button>
            )
          })}
          <Button size="sm" variant="secondary" onClick={() => controller?.fit()}>
            <Maximize2 aria-hidden="true" size={16} />
            Fit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => controller?.reset()}>
            <RotateCcw aria-hidden="true" size={16} />
            Reset
          </Button>
        </div>

        <div aria-label="Window presets" className="flex flex-wrap gap-2" role="group">
          {presets.map((preset) => (
            <Button
              aria-pressed={state.presetId === preset.id}
              key={preset.id}
              size="sm"
              variant={state.presetId === preset.id ? 'primary' : 'secondary'}
              onClick={() => selectPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <label className="grid gap-1 text-small text-neutral-200">
          <span className="flex justify-between">
            <span>Slice</span>
            <span className="tabular-nums">
              {state.slice} / {state.total || '—'}
            </span>
          </span>
          <input
            aria-label="Current DICOM slice"
            className="accent-brand-500"
            disabled={state.status !== 'ready'}
            max={Math.max(1, state.total)}
            min={1}
            type="range"
            value={state.slice}
            onChange={(event) => void controller?.setSlice(Number(event.target.value))}
          />
        </label>
      </div>

      {panel ? (
        <Sheet
          open={instructionsOpen}
          title="Activity instructions"
          description={prompt}
          onOpenChange={setInstructionsOpen}
        >
          {panel}
        </Sheet>
      ) : null}
    </div>
  )
}
