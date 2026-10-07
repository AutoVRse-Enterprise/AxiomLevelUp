import { Expand, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { AppConfig, CaseFinding } from '@/content/schema'
import { Button } from '@/components/ui'
import { useResolvedMotion } from '@/design/motion/useResolvedMotion'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
import type {
  AnatomyLoadResult,
  AnatomyPerformanceSnapshot,
  AnatomyRendererDiagnostics,
  AnatomyStartView,
  AnatomyViewState,
} from '@/anatomy3d/viewer/controller'
import {
  canTravelTo,
  movementCost,
  reachableWithin,
  type AnatomyMovementRule,
  type AnatomyMovementState,
} from '@/anatomy3d/viewer/movement'
import { useAnatomyViewer } from '@/anatomy3d/viewer/useAnatomyViewer'
import { cn } from '@/lib/cn'
import { useLearnerStore } from '@/state/learnerStore'

export interface AnatomyViewerProps {
  modelUrl: string
  map: AnatomyMap
  config: AppConfig['product']['anatomy3d']
  prompt?: string
  navigation?: 'orbit' | 'flythrough' | 'both' | 'look'
  orientationLabels?: 'patient' | 'hidden'
  movement?: AnatomyMovementRule
  movementState?: AnatomyMovementState
  disabled?: boolean
  startView?: AnatomyStartView
  selectedStructureIds?: readonly string[]
  selectableLevelIds?: readonly string[]
  markerStructureId?: string | null
  findings?: readonly CaseFinding[]
  neutralNavigationLabels?: boolean
  hideLocationLabels?: boolean
  onStructureSelected?: (structureId: string) => void
  onFindingInspected?: (findingId: string) => void
  onWaypointReached?: (waypointId: string) => void
  onMovementStateChange?: (state: AnatomyMovementState) => void
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
  orientationLabels = 'patient',
  movement,
  movementState,
  disabled = false,
  startView,
  selectedStructureIds,
  selectableLevelIds,
  markerStructureId,
  findings = [],
  neutralNavigationLabels = false,
  hideLocationLabels = false,
  onStructureSelected,
  onFindingInspected,
  onWaypointReached,
  onMovementStateChange,
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
  const [arrivalMessage, setArrivalMessage] = useState<string | null>(null)
  const [authoringView, setAuthoringView] = useState<AnatomyViewState | null>(null)
  const [debugPerformance, setDebugPerformance] = useState<{
    renderer: AnatomyRendererDiagnostics
    performance: AnatomyPerformanceSnapshot
  } | null>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const pointerLast = useRef<{ x: number; y: number } | null>(null)
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>())
  const pinchDistance = useRef<number | null>(null)
  const endoscopicRef = useRef(endoscopic)
  const structureButtons = useRef(new Map<string, HTMLButtonElement>())
  const motion = useResolvedMotion()
  const { labels } = usePresentation()
  const anatomyHintSeen = useLearnerStore((learner) => learner.caseLab.anatomyHintSeen)
  const markAnatomyHintSeen = useLearnerStore((learner) => learner.markAnatomyHintSeen)
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

  const waypointLabel = (waypoint: AnatomyMap['waypoints'][number]) =>
    neutralNavigationLabels ? (waypoint.neutralLabel ?? 'Branch') : waypoint.label

  const entryWaypointId =
    movementState?.entryWaypointId ??
    (startView && 'waypointId' in startView ? startView.waypointId : null)
  const effectiveMovementState =
    movement && entryWaypointId
      ? (movementState ?? {
          entryWaypointId,
          currentWaypointId: currentWaypointId ?? entryWaypointId,
          visitedWaypointIds: [entryWaypointId],
          movesUsed: 0,
        })
      : null
  const reachableWaypointIds =
    movement && entryWaypointId
      ? reachableWithin(map, entryWaypointId, movement.maxHopsFromEntry)
      : null

  const travelTo = (waypointId: string) => {
    if (disabled) return
    if (movement && effectiveMovementState && reachableWaypointIds) {
      if (!canTravelTo(waypointId, reachableWaypointIds, effectiveMovementState, movement)) return
      const cost = movementCost(
        effectiveMovementState.visitedWaypointIds,
        waypointId,
        movement.freeBacktrack,
      )
      onMovementStateChange?.({
        ...effectiveMovementState,
        currentWaypointId: waypointId,
        visitedWaypointIds: [
          ...new Set([...effectiveMovementState.visitedWaypointIds, waypointId]),
        ],
        movesUsed: effectiveMovementState.movesUsed + cost,
      })
    }
    const waypoint = map.waypoints.find(({ id }) => id === waypointId)
    const destinationLabel = waypoint ? waypointLabel(waypoint) : waypointId
    controller?.travelTo(waypointId, { animate: motion === 'full' })
    setCurrentWaypointId(waypointId)
    setArrivalMessage(`You are now in ${destinationLabel}.`)
    setAnnouncement(`You are now in ${destinationLabel}.`)
    onWaypointReached?.(waypointId)
  }

  const lookOnly = navigation === 'look'
  const branches =
    navigation === 'orbit' || lookOnly
      ? []
      : (controller?.availableBranches() ?? []).filter(
          (id) =>
            !movement ||
            !effectiveMovementState ||
            !reachableWaypointIds ||
            canTravelTo(id, reachableWaypointIds, effectiveMovementState, movement),
        )
  const failed = state.status === 'error'
  const currentWaypoint = map.waypoints.find(({ id }) => id === currentWaypointId)
  const selectedFinding = findings.find(({ id }) => id === selectedFindingId)
  const parentWaypointId = controller?.parentWaypoint()
  const parentWaypoint =
    !movement ||
    !parentWaypointId ||
    !effectiveMovementState ||
    !reachableWaypointIds ||
    canTravelTo(parentWaypointId, reachableWaypointIds, effectiveMovementState, movement)
      ? map.waypoints.find(({ id }) => id === parentWaypointId)
      : undefined
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

      <div
        className={cn(
          'min-h-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]',
          immersive && 'flex flex-1 flex-col md:grid',
        )}
      >
        <div
          aria-label="Interactive 3D anatomy viewport"
          className={cn(
            'relative h-[min(45svh,28rem)] min-h-64 w-full touch-none overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-brand-400 md:h-[min(65dvh,42rem)] md:min-h-80',
            immersive && 'min-h-0 flex-1 md:h-full',
            disabled && 'pointer-events-none',
          )}
          role="button"
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => {
            pointerStart.current = null
            pointerLast.current = null
            pointerPositions.current.clear()
            pinchDistance.current = null
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
            pointerPositions.current.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY,
            })
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (pointerPositions.current.has(event.pointerId)) {
              pointerPositions.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
              })
            }
            if (endoscopic && config.lumen.zoom.enabled && pointerPositions.current.size === 2) {
              const [first, second] = [...pointerPositions.current.values()]
              const distance = Math.hypot(first!.x - second!.x, first!.y - second!.y)
              if (pinchDistance.current !== null) {
                controller?.zoomBy((pinchDistance.current - distance) * 0.08)
              }
              pinchDistance.current = distance
              return
            }
            const last = pointerLast.current
            if (!last || !endoscopic || !config.lumen.lookAround.enabled) return
            controller?.lookAround(event.clientX - last.x, event.clientY - last.y)
            pointerLast.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current
            pointerStart.current = null
            pointerLast.current = null
            pointerPositions.current.delete(event.pointerId)
            if (pointerPositions.current.size < 2) pinchDistance.current = null
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
          onWheel={(event) => {
            if (!endoscopic || !config.lumen.zoom.enabled) return
            event.preventDefault()
            controller?.zoomBy(Math.sign(event.deltaY) * config.lumen.zoom.step)
          }}
          onKeyDown={(event) => {
            if (!endoscopic) return
            const keyboardPixels =
              config.lumen.lookAround.keyboardStepDegrees / config.lumen.lookAround.degreesPerPixel
            if (event.key === 'ArrowLeft') controller?.lookAround(-keyboardPixels, 0)
            else if (event.key === 'ArrowRight') controller?.lookAround(keyboardPixels, 0)
            else if (event.key === 'ArrowUp') controller?.lookAround(0, -keyboardPixels)
            else if (event.key === 'ArrowDown') controller?.lookAround(0, keyboardPixels)
            else if (event.key === '+' || event.key === '=') {
              controller?.zoomBy(-config.lumen.zoom.step)
            } else if (event.key === '-') {
              controller?.zoomBy(config.lumen.zoom.step)
            } else return
            event.preventDefault()
          }}
          tabIndex={0}
        >
          <div className="absolute inset-0" ref={setElement} />
          {!anatomyHintSeen && !disabled ? (
            <div className="absolute right-3 bottom-3 left-3 z-20 flex items-start justify-between gap-3 rounded-lg border border-brand-300 bg-clinical-900/95 p-3 shadow-overlay">
              <p className="text-small text-white">{labels.anatomyInteractionHint}</p>
              <button
                aria-label="Dismiss anatomy interaction hint"
                className="shrink-0 rounded p-1 text-neutral-200 hover:bg-clinical-700 focus-visible:outline-2 focus-visible:outline-brand-300"
                type="button"
                onClick={markAnatomyHintSeen}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          ) : null}
          {endoscopic && orientationLabels === 'patient' ? (
            <>
              <span className="pointer-events-none absolute left-3 top-1/2 rounded bg-black/60 px-2 py-1 text-caption font-bold uppercase tracking-wide">
                Left
              </span>
              <span className="pointer-events-none absolute right-3 top-1/2 rounded bg-black/60 px-2 py-1 text-caption font-bold uppercase tracking-wide">
                Right
              </span>
            </>
          ) : null}
          {endoscopic && config.lumen.zoom.enabled ? (
            <div
              aria-label="Airway zoom"
              className="absolute top-3 right-3 z-20 flex gap-1"
              role="group"
            >
              <Button
                aria-label={labels.zoomOut}
                disabled={disabled}
                size="sm"
                variant="secondary"
                onClick={() => controller?.zoomBy(config.lumen.zoom.step)}
              >
                <Minus aria-hidden="true" size={16} />
              </Button>
              <Button
                aria-label={labels.zoomIn}
                disabled={disabled}
                size="sm"
                variant="secondary"
                onClick={() => controller?.zoomBy(-config.lumen.zoom.step)}
              >
                <Plus aria-hidden="true" size={16} />
              </Button>
            </div>
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
        <footer className="space-y-3 border-t border-clinical-700 p-3 sm:p-4 md:max-h-[min(65dvh,42rem)] md:overflow-y-auto md:border-t-0 md:border-l">
          {state.warning ? (
            <p className="text-small text-warning-200" role="status">
              {state.warning}
            </p>
          ) : null}
          {arrivalMessage ? (
            <p
              className="rounded-lg border border-brand-400/60 bg-brand-950/50 p-3 text-small font-semibold"
              role="status"
            >
              {arrivalMessage}
            </p>
          ) : null}
          {movement && effectiveMovementState ? (
            <p className="text-small font-semibold" role="status">
              Moves left: {Math.max(0, movement.maxMoves - effectiveMovementState.movesUsed)}
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
          {currentWaypoint && !hideLocationLabels && !lookOnly ? (
            <div className="rounded-lg border border-clinical-700 bg-clinical-900 p-3">
              <nav aria-label="Anatomy location">
                <ol className="flex flex-wrap items-center gap-1 text-caption text-neutral-300">
                  {breadcrumb.map((waypoint, index) => (
                    <li key={waypoint.id}>
                      {index > 0 ? <span aria-hidden="true"> / </span> : null}
                      <span>{waypointLabel(waypoint)}</span>
                    </li>
                  ))}
                </ol>
              </nav>
              <p className="mt-1 text-small">
                <span className="text-neutral-300">Current landmark: </span>
                <strong>{waypointLabel(currentWaypoint)}</strong>
              </p>
            </div>
          ) : null}
          {selectedFinding ? (
            <div
              className="rounded-lg border border-warning-400/60 bg-warning-950/40 p-3"
              role="status"
            >
              <p className="text-caption font-bold uppercase tracking-wide text-warning-200">
                Finding inspected
              </p>
              <p className="mt-1 font-semibold">{selectedFinding.label}</p>
              <p className="mt-2 text-caption font-bold uppercase tracking-wide text-neutral-300">
                What you see
              </p>
              <p className="mt-1 text-small text-neutral-200">{selectedFinding.description}</p>
              {selectedFinding.significance ? (
                <>
                  <p className="mt-3 text-caption font-bold uppercase tracking-wide text-neutral-300">
                    Why it matters
                  </p>
                  <p className="mt-1 text-small text-neutral-100">{selectedFinding.significance}</p>
                </>
              ) : null}
            </div>
          ) : null}
          {!lookOnly ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={disabled}
                leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
                size="sm"
                variant="secondary"
                onClick={() => {
                  controller?.resetView()
                  setCurrentWaypointId(null)
                  setArrivalMessage(null)
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
          ) : null}
          {parentWaypoint && !lookOnly ? (
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
                Back to {waypointLabel(parentWaypoint)}
              </Button>
            </div>
          ) : null}
          {branches.length ? (
            <div>
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-neutral-300">
                Branches from{' '}
                {currentWaypoint && !hideLocationLabels
                  ? waypointLabel(currentWaypoint)
                  : 'current location'}
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
                    {(() => {
                      const branch = map.waypoints.find(({ id }) => id === branchId)
                      return branch ? waypointLabel(branch) : branchId
                    })()}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {findings.length && !lookOnly ? (
            <details className="rounded-lg border border-clinical-700 bg-clinical-900">
              <summary className="cursor-pointer px-3 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
                Inspect spatial findings
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
          {!lookOnly ? (
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
          ) : null}
        </footer>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
