import { Expand, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { AppConfig, CaseFinding } from '@/content/schema'
import { Button } from '@/components/ui'
import { useResolvedMotion } from '@/design/motion/useResolvedMotion'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type {
  AnatomyLoadResult,
  AnatomyPerformanceSnapshot,
  AnatomyRendererDiagnostics,
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
  selectableLevelIds?: readonly string[]
  markerStructureId?: string | null
  findings?: readonly CaseFinding[]
  onStructureSelected?: (structureId: string) => void
  onFindingInspected?: (findingId: string) => void
  onWaypointReached?: (waypointId: string) => void
  onViewChanged?: (view: AnatomyViewState) => void
  onLoaded?: (result: AnatomyLoadResult, loadMs: number) => void
  onFailed?: (reason: string) => void
}

function formatAuthoringVector(vector: readonly [number, number, number]) {
  return vector.map((value) => Number(value.toFixed(2))).join(', ')
}

export function AnatomyViewer({
  modelUrl,
  map,
  config,
  prompt = 'Explore the interactive anatomy model.',
  navigation = 'both',
  disabled = false,
  startView,
  selectedStructureIds,
  selectableLevelIds,
  markerStructureId,
  findings = [],
  onStructureSelected,
  onFindingInspected,
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
  const [endoscopic, setEndoscopic] = useState(startView?.mode === 'endoscopic')
  const [listOpen, setListOpen] = useState(false)
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [authoringView, setAuthoringView] = useState<AnatomyViewState | null>(null)
  const [debugPerformance, setDebugPerformance] = useState<{
    renderer: AnatomyRendererDiagnostics
    performance: AnatomyPerformanceSnapshot
  } | null>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const pointerLast = useRef<{ x: number; y: number } | null>(null)
  const endoscopicRef = useRef(endoscopic)
  const structureButtons = useRef(new Map<string, HTMLButtonElement>())
  const motion = useResolvedMotion()
  const anatomyDebugEnabled =
    import.meta.env.DEV && new URLSearchParams(window.location.search).get('anatomyDebug') === '1'
  const { ref: rootRef, immersive, toggle } = useImmersiveArtifact<HTMLDivElement>()
  const selection = selectedStructureIds ?? localSelection
  const reportViewChanged = useCallback(
    (view: AnatomyViewState) => {
      setCurrentWaypointId(view.waypointId)
      setEndoscopic(view.endoscopic)
      if (anatomyDebugEnabled) setAuthoringView(view)
      endoscopicRef.current = view.endoscopic
      onViewChanged?.(view)
    },
    [anatomyDebugEnabled, onViewChanged],
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
    controller?.setMarker(
      markerStructureId ?? (startView?.mode === 'marker' ? startView.structureId : null),
    )
  }, [controller, markerStructureId, startView])

  useEffect(() => {
    controller?.setFindings(findings)
  }, [controller, findings])

  const selectableStructureIds = map.structures
    .filter(({ levelId }) => !selectableLevelIds || selectableLevelIds.includes(levelId))
    .map(({ id }) => id)
  const selectableLevelKey = selectableLevelIds?.join('|') ?? '*'

  useEffect(() => {
    controller?.setSelectableLevelIds(selectableLevelIds)
    // The configured IDs are represented by the stable key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, selectableLevelKey])

  useEffect(() => {
    if (!controller || state.status !== 'ready' || endoscopicRef.current) return
    controller.frameStructures(selectableStructureIds, { animate: motion === 'full' })
    // The IDs are derived from this stable level key and the validated anatomy map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, map, motion, selectableLevelKey, state.status])

  useEffect(() => {
    if (import.meta.env.VITE_E2E !== 'true' || !controller) return
    const bridge = {
      snapshot: () => controller.getTestSnapshot(),
      loseContext: () => controller.loseContext(),
      restoreContext: () => controller.restoreContext(),
    }
    window.__anatomyTest = bridge
    return () => {
      if (window.__anatomyTest === bridge) delete window.__anatomyTest
    }
  }, [controller])

  useEffect(() => {
    if (!import.meta.env.DEV || !anatomyDebugEnabled || !controller || state.status !== 'ready')
      return
    const update = () => {
      const snapshot = controller.getTestSnapshot()
      setDebugPerformance({
        renderer: snapshot.renderer,
        performance: snapshot.performance,
      })
    }
    update()
    const interval = window.setInterval(update, 1_000)
    return () => window.clearInterval(interval)
  }, [anatomyDebugEnabled, controller, state.status])

  const selectStructure = useCallback(
    (structureId: string, focusListAlternative = false) => {
      if (disabled) return
      const structure = map.structures.find(({ id }) => id === structureId)
      if (selectableLevelIds && !selectableLevelIds.includes(structure?.levelId ?? '')) return
      if (!selectedStructureIds) setLocalSelection([structureId])
      setAnnouncement(`${structure?.label ?? structureId} selected`)
      onStructureSelected?.(structureId)
      if (focusListAlternative) structureButtons.current.get(structureId)?.focus()
    },
    [disabled, map.structures, onStructureSelected, selectableLevelIds, selectedStructureIds],
  )

  const inspectFinding = useCallback(
    (findingId: string) => {
      if (disabled) return
      const finding = findings.find(({ id }) => id === findingId)
      if (!finding) return
      setSelectedFindingId(findingId)
      setAnnouncement(`${finding.label} finding inspected`)
      onFindingInspected?.(findingId)
    },
    [disabled, findings, onFindingInspected],
  )

  const travelTo = (waypointId: string) => {
    if (disabled) return
    controller?.travelTo(waypointId, { animate: motion === 'full' })
    setCurrentWaypointId(waypointId)
    setAnnouncement(
      `${map.waypoints.find(({ id }) => id === waypointId)?.label ?? waypointId} reached`,
    )
    onWaypointReached?.(waypointId)
  }

  const branches = navigation === 'orbit' ? [] : (controller?.availableBranches() ?? [])
  const failed = state.status === 'error'
  const currentWaypoint = map.waypoints.find(({ id }) => id === currentWaypointId)
  const parentWaypointId = controller?.parentWaypoint()
  const parentWaypoint = map.waypoints.find(({ id }) => id === parentWaypointId)
  const breadcrumb = (controller?.waypointPath() ?? (currentWaypointId ? [currentWaypointId] : []))
    .map((id) => map.waypoints.find((waypoint) => waypoint.id === id))
    .filter((waypoint): waypoint is AnatomyMap['waypoints'][number] => Boolean(waypoint))

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

      <div className={cn('min-h-0', immersive && 'flex flex-1 flex-col')}>
        <div
          aria-label="Interactive 3D anatomy viewport"
          className={cn(
            'relative h-[60dvh] min-h-80 w-full touch-none overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-brand-400 md:h-[min(65dvh,42rem)]',
            immersive && 'min-h-0 flex-1 md:h-full',
            disabled && 'pointer-events-none',
          )}
          role="img"
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => {
            pointerStart.current = null
            pointerLast.current = null
          }}
          onPointerDown={(event) => {
            if (
              event.target instanceof HTMLElement &&
              event.target.closest('button, a, input, select, textarea')
            ) {
              return
            }
            pointerStart.current = { x: event.clientX, y: event.clientY }
            pointerLast.current = { x: event.clientX, y: event.clientY }
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }}
          onPointerMove={(event) => {
            const last = pointerLast.current
            if (!last || !endoscopic || !config.lumen.lookAround.enabled) return
            controller?.lookAround(event.clientX - last.x, event.clientY - last.y)
            pointerLast.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current
            pointerStart.current = null
            pointerLast.current = null
            if (
              !start ||
              Math.hypot(event.clientX - start.x, event.clientY - start.y) > config.tapMaxMovementPx
            ) {
              return
            }
            const findingId = controller?.pickFinding(event.clientX, event.clientY)
            if (findingId) {
              inspectFinding(findingId)
              return
            }
            if (endoscopic) return
            const structureId = controller?.pick(event.clientX, event.clientY, selectableLevelIds)
            if (structureId) selectStructure(structureId, true)
          }}
        >
          <div className="absolute inset-0" ref={setElement} />
          {endoscopic ? (
            <>
              <span className="pointer-events-none absolute left-3 top-1/2 rounded bg-black/60 px-2 py-1 text-caption font-bold uppercase tracking-wide">
                Left
              </span>
              <span className="pointer-events-none absolute right-3 top-1/2 rounded bg-black/60 px-2 py-1 text-caption font-bold uppercase tracking-wide">
                Right
              </span>
            </>
          ) : null}
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
      </div>

      <footer className="space-y-3 border-t border-clinical-700 p-3 sm:p-4">
        {state.warning ? (
          <p className="text-small text-warning-200" role="status">
            {state.warning}
          </p>
        ) : null}
        {anatomyDebugEnabled ? (
          <details
            className="rounded-lg border border-dashed border-brand-400/70 bg-clinical-900 p-3 font-mono text-caption"
            data-anatomy-debug=""
            open
          >
            <summary className="cursor-pointer font-sans font-semibold">
              Anatomy authoring readout
            </summary>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt>Waypoint</dt>
              <dd>{authoringView?.waypointId ?? currentWaypointId ?? 'none'}</dd>
              <dt>Mode</dt>
              <dd>{(authoringView?.endoscopic ?? endoscopic) ? 'endoscopic' : 'outside'}</dd>
              <dt>Camera</dt>
              <dd>{authoringView ? formatAuthoringVector(authoringView.position) : 'pending'}</dd>
              <dt>Target</dt>
              <dd>{authoringView ? formatAuthoringVector(authoringView.target) : 'pending'}</dd>
              <dt>Median frame</dt>
              <dd>
                {debugPerformance?.performance.medianFrameMs === null ||
                debugPerformance?.performance.medianFrameMs === undefined
                  ? 'collecting'
                  : `${debugPerformance.performance.medianFrameMs.toFixed(1)} ms`}
              </dd>
              <dt>Median FPS</dt>
              <dd>
                {debugPerformance?.performance.medianFps === null ||
                debugPerformance?.performance.medianFps === undefined
                  ? 'collecting'
                  : debugPerformance.performance.medianFps.toFixed(1)}
              </dd>
              <dt>Renderer</dt>
              <dd className="break-all">
                {debugPerformance?.renderer.unmaskedRenderer ??
                  debugPerformance?.renderer.renderer ??
                  'pending'}
              </dd>
            </dl>
          </details>
        ) : null}
        {currentWaypoint ? (
          <div className="rounded-lg border border-clinical-700 bg-clinical-900 p-3">
            <nav aria-label="Anatomy location">
              <ol className="flex flex-wrap items-center gap-1 text-caption text-neutral-300">
                {breadcrumb.map((waypoint, index) => (
                  <li key={waypoint.id}>
                    {index > 0 ? <span aria-hidden="true"> / </span> : null}
                    <span>{waypoint.label}</span>
                  </li>
                ))}
              </ol>
            </nav>
            <p className="mt-1 text-small">
              <span className="text-neutral-300">Current landmark: </span>
              <strong>{currentWaypoint.label}</strong>
            </p>
          </div>
        ) : null}
        {selectedFindingId ? (
          <div
            className="rounded-lg border border-warning-400/60 bg-warning-950/40 p-3"
            role="status"
          >
            <p className="text-caption font-bold uppercase tracking-wide text-warning-200">
              Finding inspected
            </p>
            <p className="mt-1 font-semibold">
              {findings.find(({ id }) => id === selectedFindingId)?.label}
            </p>
            <p className="mt-1 text-small text-neutral-200">
              {findings.find(({ id }) => id === selectedFindingId)?.description}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={disabled}
            leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
            size="sm"
            variant="secondary"
            onClick={() => {
              controller?.resetView()
              setCurrentWaypointId(null)
              setEndoscopic(false)
              endoscopicRef.current = false
            }}
          >
            Reset
          </Button>
          {currentWaypointId && navigation === 'both' ? (
            <div aria-label="View mode" className="flex gap-1" role="group">
              <Button
                aria-pressed={!endoscopic}
                disabled={disabled}
                size="sm"
                variant={!endoscopic ? 'primary' : 'secondary'}
                onClick={() => {
                  controller?.exitEndoscopic({ animate: motion === 'full' })
                  setEndoscopic(false)
                  endoscopicRef.current = false
                }}
              >
                Outside
              </Button>
              <Button
                aria-pressed={endoscopic}
                disabled={disabled}
                size="sm"
                variant={endoscopic ? 'primary' : 'secondary'}
                onClick={() => {
                  controller?.enterEndoscopic(currentWaypointId)
                  setEndoscopic(true)
                  endoscopicRef.current = true
                }}
              >
                Airway
              </Button>
            </div>
          ) : null}
        </div>
        {parentWaypoint ? (
          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-neutral-300">
              Back to parent
            </p>
            <Button
              disabled={disabled}
              size="sm"
              variant="secondary"
              onClick={() => travelTo(parentWaypoint.id)}
            >
              Back to {parentWaypoint.label}
            </Button>
          </div>
        ) : null}
        {branches.length ? (
          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-neutral-300">
              Branches from {currentWaypoint?.label ?? 'current location'}
            </p>
            <div className="flex flex-wrap gap-2">
              {branches.map((branchId) => (
                <Button
                  disabled={disabled}
                  key={branchId}
                  size="sm"
                  variant="secondary"
                  onClick={() => travelTo(branchId)}
                >
                  {map.waypoints.find(({ id }) => id === branchId)?.label ?? branchId}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {findings.length ? (
          <details className="rounded-lg border border-clinical-700 bg-clinical-900">
            <summary className="cursor-pointer px-3 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
              Inspect findings
            </summary>
            <ul className="grid gap-2 border-t border-clinical-700 p-3 sm:grid-cols-2">
              {findings.map((finding) => (
                <li key={finding.id}>
                  <button
                    aria-pressed={selectedFindingId === finding.id}
                    className="w-full rounded-lg border border-clinical-600 px-3 py-2 text-left text-small hover:bg-clinical-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 aria-pressed:border-warning-400 aria-pressed:bg-clinical-800"
                    disabled={disabled}
                    type="button"
                    onClick={() => inspectFinding(finding.id)}
                  >
                    {finding.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <details
          className="rounded-lg border border-clinical-700 bg-clinical-900"
          open={failed || listOpen}
          onToggle={(event) => setListOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer px-3 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            Choose from list
          </summary>
          <div className="max-h-[36dvh] space-y-4 overflow-y-auto border-t border-clinical-700 p-3">
            <p className="text-small text-neutral-300">
              This list provides the same selection without using the 3D canvas.
            </p>
            {map.levels
              .filter((level) => !selectableLevelIds || selectableLevelIds.includes(level.id))
              .map((level) => {
                const structures = map.structures.filter(({ levelId }) => levelId === level.id)
                if (structures.length === 0) return null
                return (
                  <section aria-labelledby={`anatomy-level-${level.id}`} key={level.id}>
                    <h3 className="text-small font-semibold" id={`anatomy-level-${level.id}`}>
                      {level.label}
                    </h3>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
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
        </details>
      </footer>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
