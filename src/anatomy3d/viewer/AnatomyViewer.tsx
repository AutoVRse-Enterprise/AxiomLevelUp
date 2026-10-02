import { Expand, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { AppConfig } from '@/content/schema'
import { Button } from '@/components/ui'
import { useResolvedMotion } from '@/design/motion/useResolvedMotion'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type {
  AnatomyLoadResult,
  AnatomyStartView,
  AnatomyViewState,
} from '@/anatomy3d/viewer/controller'
import { useAnatomyViewer } from '@/anatomy3d/viewer/useAnatomyViewer'
import { cn } from '@/lib/cn'

export interface AnatomyViewerProps {
  modelUrl: string
  map: AnatomyMap
  config: AppConfig['product']['anatomy3d']
  prompt?: string
  navigation?: 'orbit' | 'flythrough' | 'both'
  disabled?: boolean
  startView?: AnatomyStartView
  selectedStructureIds?: readonly string[]
  markerStructureId?: string | null
  onStructureSelected?: (structureId: string) => void
  onWaypointReached?: (waypointId: string) => void
  onViewChanged?: (view: AnatomyViewState) => void
  onLoaded?: (result: AnatomyLoadResult, loadMs: number) => void
  onFailed?: (reason: string) => void
}

export function AnatomyViewer({
  modelUrl,
  map,
  config,
  prompt = 'Explore the configured anatomy model.',
  navigation = 'both',
  disabled = false,
  startView,
  selectedStructureIds,
  markerStructureId,
  onStructureSelected,
  onWaypointReached,
  onViewChanged,
  onLoaded,
  onFailed,
}: AnatomyViewerProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [localSelection, setLocalSelection] = useState<readonly string[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [currentWaypointId, setCurrentWaypointId] = useState<string | null>(
    startView && 'waypointId' in startView ? startView.waypointId : null,
  )
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const structureButtons = useRef(new Map<string, HTMLButtonElement>())
  const motion = useResolvedMotion()
  const { ref: rootRef, immersive, toggle } = useImmersiveArtifact<HTMLDivElement>()
  const selection = selectedStructureIds ?? localSelection
  const reportViewChanged = useCallback(
    (view: AnatomyViewState) => {
      setCurrentWaypointId(view.waypointId)
      onViewChanged?.(view)
    },
    [onViewChanged],
  )
  const { state, controller, retry } = useAnatomyViewer({
    element,
    modelUrl,
    map,
    config,
    startView,
    onViewChanged: reportViewChanged,
    onLoaded,
    onFailed,
  })

  useEffect(() => {
    controller?.highlight(selection, {
      color: config.highlightColor,
      opacity: config.highlightOpacity,
    })
  }, [config.highlightColor, config.highlightOpacity, controller, selection])

  useEffect(() => {
    controller?.setMarker(markerStructureId ?? null)
  }, [controller, markerStructureId])

  const selectStructure = useCallback(
    (structureId: string, focusListAlternative = false) => {
      if (disabled) return
      if (!selectedStructureIds) setLocalSelection([structureId])
      const structure = map.structures.find(({ id }) => id === structureId)
      setAnnouncement(`${structure?.label ?? structureId} selected`)
      onStructureSelected?.(structureId)
      if (focusListAlternative) structureButtons.current.get(structureId)?.focus()
    },
    [disabled, map.structures, onStructureSelected, selectedStructureIds],
  )

  const flyTo = (waypointId: string) => {
    if (disabled) return
    controller?.flyTo(waypointId, { animate: motion === 'full' })
    setCurrentWaypointId(waypointId)
    setAnnouncement(
      `${map.waypoints.find(({ id }) => id === waypointId)?.label ?? waypointId} reached`,
    )
    onWaypointReached?.(waypointId)
  }

  const branches = navigation === 'orbit' ? [] : (controller?.availableBranches() ?? [])
  const failed = state.status === 'error'

  return (
    <div
      data-anatomy-viewer=""
      ref={rootRef}
      className={cn(
        'overflow-hidden rounded-xl border border-clinical-700 bg-clinical-950 text-white shadow-card',
        immersive &&
          'fixed inset-0 z-50 flex h-dvh w-screen flex-col rounded-none border-0 pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-clinical-700 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="font-semibold">Interactive anatomy</p>
          <p className="mt-1 text-small text-neutral-300">{prompt}</p>
        </div>
        <Button
          aria-label={immersive ? 'Exit fullscreen anatomy viewer' : 'Expand anatomy viewer'}
          disabled={disabled}
          leadingIcon={<Expand aria-hidden="true" size={16} />}
          size="sm"
          variant="secondary"
          onClick={() => void toggle()}
        >
          {immersive ? 'Exit' : 'Expand'}
        </Button>
      </header>

      <div className={cn('grid min-h-0 md:grid-cols-[minmax(0,1fr)_18rem]', immersive && 'flex-1')}>
        <div
          aria-label="Interactive 3D anatomy viewport"
          className={cn(
            'relative h-[52dvh] min-h-72 w-full touch-none overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
            immersive && 'min-h-0 flex-1 md:h-full',
            (disabled || navigation === 'flythrough') && 'pointer-events-none',
          )}
          ref={setElement}
          role="img"
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => {
            pointerStart.current = null
          }}
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current
            pointerStart.current = null
            if (
              !start ||
              Math.hypot(event.clientX - start.x, event.clientY - start.y) > config.tapMaxMovementPx
            ) {
              return
            }
            const structureId = controller?.pick(event.clientX, event.clientY)
            if (structureId) selectStructure(structureId, true)
          }}
        >
          {state.status !== 'ready' ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-clinical-950/95 p-6 text-center">
              <div className="max-w-md">
                <p className="font-semibold">
                  {failed ? '3D anatomy unavailable' : 'Preparing interactive anatomy'}
                </p>
                <p className="mt-2 text-small text-neutral-300">{state.message}</p>
                {failed ? (
                  <Button className="mt-5" onClick={retry}>
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="max-h-[42dvh] overflow-y-auto border-t border-clinical-700 bg-clinical-900 p-4 md:max-h-none md:border-l md:border-t-0">
          <h2 className="font-bold">Select a structure</h2>
          <p className="mt-1 text-small text-neutral-300">
            This list provides the same selection without using the 3D canvas.
          </p>
          <div className="mt-4 space-y-4">
            {map.levels.map((level) => {
              const structures = map.structures.filter(({ levelId }) => levelId === level.id)
              if (structures.length === 0) return null
              return (
                <section aria-labelledby={`anatomy-level-${level.id}`} key={level.id}>
                  <h3 className="text-small font-semibold" id={`anatomy-level-${level.id}`}>
                    {level.label}
                  </h3>
                  <ul className="mt-2 grid gap-2">
                    {structures.map((structure) => (
                      <li key={structure.id}>
                        <button
                          aria-pressed={selection.includes(structure.id)}
                          className="w-full rounded-lg border border-clinical-600 px-3 py-2 text-left text-small hover:bg-clinical-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 aria-pressed:border-brand-400 aria-pressed:bg-clinical-800"
                          disabled={disabled}
                          ref={(button) => {
                            if (button) structureButtons.current.set(structure.id, button)
                            else structureButtons.current.delete(structure.id)
                          }}
                          type="button"
                          onClick={() => selectStructure(structure.id)}
                        >
                          {structure.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </aside>
      </div>

      <footer className="space-y-3 border-t border-clinical-700 p-3 sm:p-4">
        {state.warning ? (
          <p className="text-small text-warning-200" role="status">
            {state.warning}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled}
            leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
            size="sm"
            variant="secondary"
            onClick={() => {
              controller?.resetView()
              setCurrentWaypointId(null)
            }}
          >
            Reset
          </Button>
          {currentWaypointId ? (
            <Button
              disabled={disabled}
              size="sm"
              variant="secondary"
              onClick={() => controller?.enterEndoscopic(currentWaypointId)}
            >
              Endoscopic view
            </Button>
          ) : null}
          {branches.map((branchId) => (
            <Button
              disabled={disabled}
              key={branchId}
              size="sm"
              variant="secondary"
              onClick={() => flyTo(branchId)}
            >
              {map.waypoints.find(({ id }) => id === branchId)?.label ?? branchId}
            </Button>
          ))}
        </div>
      </footer>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
