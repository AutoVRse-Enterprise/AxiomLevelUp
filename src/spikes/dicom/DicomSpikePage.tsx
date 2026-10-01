import { Expand, Maximize2, Move, RotateCcw, Ruler, SlidersHorizontal, ZoomIn } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button, Card, Chip, ProgressBar } from '@/components/ui'
import type { DicomTool } from '@/spikes/dicom/types'
import { useStackLoader } from '@/spikes/dicom/useStackLoader'

const tools: Array<{ id: DicomTool; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'scroll', label: 'Scroll', icon: Expand },
  { id: 'window', label: 'Window', icon: SlidersHorizontal },
  { id: 'zoom', label: 'Zoom', icon: ZoomIn },
  { id: 'pan', label: 'Pan', icon: Move },
  { id: 'measure', label: 'Measure', icon: Ruler },
]

export function DicomSpikePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const { elementRef, manifest, state, activeTool, activateTool, applyPreset, reset } =
    useStackLoader()

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setExpanded(true)
    } else {
      await document.exitFullscreen()
      setExpanded(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-6" ref={containerRef}>
      <Card className="overflow-hidden border-clinical-700 bg-clinical-950 p-0 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-clinical-700 p-4">
          <div>
            <Chip>Technical spike</Chip>
            <h1 className="mt-3 text-heading font-bold">Educational CT stack</h1>
            <p className="mt-1 text-small text-neutral-300">
              {manifest?.description ?? state.message}
            </p>
          </div>
          <Button
            leadingIcon={<Maximize2 aria-hidden="true" size={17} />}
            size="sm"
            variant="secondary"
            onClick={() => void toggleFullscreen()}
          >
            {expanded ? 'Exit full screen' : 'Full screen'}
          </Button>
        </div>

        <div
          aria-label="DICOM image viewport"
          className="relative h-[58dvh] min-h-80 w-full touch-none bg-black"
          onContextMenu={(event) => event.preventDefault()}
          ref={elementRef}
        >
          {state.status !== 'ready' ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-clinical-950 p-6 text-center">
              <div className="max-w-md">
                <p className="font-semibold">{state.message}</p>
                {state.total > 0 ? (
                  <ProgressBar
                    className="mt-5"
                    label={`Loading ${state.loaded} / ${state.total} slices`}
                    max={state.total}
                    value={state.loaded}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-clinical-700 p-4">
          <div className="flex flex-wrap gap-2" aria-label="Viewer tools">
            {tools.map(({ id, label, icon: Icon }) => (
              <Button
                aria-pressed={activeTool === id}
                key={id}
                leadingIcon={<Icon aria-hidden="true" size={16} />}
                size="sm"
                variant={activeTool === id ? 'primary' : 'secondary'}
                onClick={() => activateTool(id)}
              >
                {label}
              </Button>
            ))}
            <Button
              leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
              size="sm"
              variant="ghost"
              onClick={reset}
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {manifest?.presets.map((preset) => (
              <Button key={preset.id} size="sm" variant="ghost" onClick={() => applyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-3 text-small text-neutral-300">
            <span>
              Slice {state.slice || '—'} / {state.total || '—'}
            </span>
            <span>Loaded {state.loaded} / {state.total || '—'}</span>
            <span>Measurement: {state.measurement ?? 'draw a line'}</span>
            <span>
              First image: {state.firstImageMs ? `${state.firstImageMs} ms` : '—'} · Full cache:{' '}
              {state.fullLoadMs ? `${state.fullLoadMs} ms` : 'loading'}
            </span>
          </div>
          <p className="text-caption text-neutral-400">
            Mouse: wheel scrolls, right-drag zooms, middle-drag pans. Choose a tool for primary
            drag or one-finger touch; pinch zoom is always active.
          </p>
        </div>
      </Card>
    </div>
  )
}
