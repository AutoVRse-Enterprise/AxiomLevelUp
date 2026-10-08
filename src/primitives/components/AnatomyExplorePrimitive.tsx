import { useEffect, useRef, useState } from 'react'

import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import { useAnatomyEntryContext } from '@/anatomy3d/viewer/entryContext'
import { useStepFindings } from '@/anatomy3d/viewer/findingContext'
import type { AnatomyViewState } from '@/anatomy3d/viewer/controller'
import type { AnatomyExplorePrimitive as AnatomyExplorePrimitiveContent } from '@/content/schema/primitives'
import { useAnatomyPrimitiveContext } from '@/primitives/components/anatomyUtils'
import type { AnatomyExploreObservation } from '@/primitives/definitions/anatomy'
import type { PrimitiveComponentProps, PrimitiveInteraction } from '@/primitives/types'

function initialObservation(draft: unknown): AnatomyExploreObservation {
  const value = draft && typeof draft === 'object' ? (draft as Record<string, unknown>) : {}
  const currentWaypointId =
    typeof value.currentWaypointId === 'string' ? value.currentWaypointId : null
  return {
    loaded: false,
    interactionCount:
      typeof value.interactionCount === 'number' && Number.isFinite(value.interactionCount)
        ? Math.max(0, Math.floor(value.interactionCount))
        : 0,
    selectedStructureIds: Array.isArray(value.selectedStructureIds)
      ? value.selectedStructureIds.filter((id): id is string => typeof id === 'string')
      : [],
    reachedWaypointIds: Array.isArray(value.reachedWaypointIds)
      ? value.reachedWaypointIds.filter((id): id is string => typeof id === 'string')
      : [],
    inspectedFindingIds: Array.isArray(value.inspectedFindingIds)
      ? value.inspectedFindingIds.filter((id): id is string => typeof id === 'string')
      : [],
    currentWaypointId,
    visitedWaypointIds: Array.isArray(value.visitedWaypointIds)
      ? value.visitedWaypointIds.filter((id): id is string => typeof id === 'string')
      : currentWaypointId
        ? [currentWaypointId]
        : [],
    movesUsed:
      typeof value.movesUsed === 'number' && Number.isFinite(value.movesUsed)
        ? Math.max(0, Math.floor(value.movesUsed))
        : 0,
  }
}

export function AnatomyExplorePrimitive({
  primitive,
  draft,
  disabled,
  onDraftChange,
  onInteract,
}: PrimitiveComponentProps<AnatomyExplorePrimitiveContent>) {
  const { appConfig, map, modelUrl } = useAnatomyPrimitiveContext(primitive)
  const entryContext = useAnatomyEntryContext()
  const findings = useStepFindings(primitive.id)
  const unknownEntry = entryContext.neutralNavigationLabels || entryContext.hideLocationLabels
  const [observation, setObservation] = useState(() => initialObservation(draft))
  const observationRef = useRef(observation)
  const sequence = useRef(observation.interactionCount)
  const viewerLoaded = useRef(false)
  const pendingView = useRef<AnatomyViewState | null>(null)
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (viewTimer.current) clearTimeout(viewTimer.current)
    },
    [],
  )

  const update = (
    patch: Partial<AnatomyExploreObservation>,
    interaction?: PrimitiveInteraction,
  ) => {
    if (disabled) return
    const next = {
      ...observationRef.current,
      ...patch,
    }
    observationRef.current = next
    setObservation(next)
    if (interaction) onInteract(interaction)
    onDraftChange({
      interactionCount: next.interactionCount,
      selectedStructureIds: next.selectedStructureIds,
      reachedWaypointIds: next.reachedWaypointIds,
      inspectedFindingIds: next.inspectedFindingIds,
      currentWaypointId: next.currentWaypointId,
      visitedWaypointIds: next.visitedWaypointIds,
      movesUsed: next.movesUsed,
    })
  }

  const recordInteraction = (
    patch: Partial<AnatomyExploreObservation>,
    interaction: (key: string) => PrimitiveInteraction,
    requirementKey?: string,
  ) => {
    sequence.current += 1
    update(
      {
        ...patch,
        interactionCount: observationRef.current.interactionCount + 1,
      },
      interaction(
        primitive.completion.mode === 'explored' && requirementKey
          ? requirementKey
          : `interaction:${sequence.current}`,
      ),
    )
  }

  return (
    <AnatomyViewer
      config={appConfig.product.anatomy3d}
      disabled={disabled}
      map={map}
      findings={findings}
      markerStructureId={
        primitive.content.startView.mode === 'marker'
          ? primitive.content.startView.structureId
          : undefined
      }
      modelUrl={modelUrl}
      movement={primitive.content.movement}
      movementState={
        primitive.content.movement &&
        'waypointId' in primitive.content.startView &&
        observation.currentWaypointId
          ? {
              entryWaypointId: primitive.content.startView.waypointId,
              currentWaypointId: observation.currentWaypointId,
              visitedWaypointIds: observation.visitedWaypointIds ?? [],
              movesUsed: observation.movesUsed ?? 0,
            }
          : undefined
      }
      navigation={primitive.content.navigation}
      orientationLabels={primitive.content.orientationLabels}
      neutralNavigationLabels={entryContext.neutralNavigationLabels}
      hideLocationLabels={entryContext.hideLocationLabels}
      prompt={primitive.content.prompt}
      selectedStructureIds={observation.selectedStructureIds}
      startView={
        primitive.content.movement &&
        primitive.content.startView.mode === 'endoscopic' &&
        observation.currentWaypointId
          ? { mode: 'endoscopic', waypointId: observation.currentWaypointId }
          : primitive.content.startView
      }
      onFailed={(reason) => {
        if (disabled) return
        viewerLoaded.current = false
        onInteract({ name: 'anatomy_viewer_failed', reason })
      }}
      onLoaded={(result, loadMs) => {
        if (disabled) return
        viewerLoaded.current = true
        onInteract({
          name: 'anatomy_viewer_loaded',
          loadMs,
          meshCount: result.meshNames.length,
          triangleCount: result.triangleCount,
        })
        const entryWaypointId =
          (unknownEntry || primitive.content.movement) &&
          primitive.content.startView.mode === 'endoscopic'
            ? primitive.content.startView.waypointId
            : null
        if (entryWaypointId) {
          recordInteraction(
            {
              loaded: true,
              reachedWaypointIds: [
                ...new Set([...observationRef.current.reachedWaypointIds, entryWaypointId]),
              ],
              currentWaypointId: observationRef.current.currentWaypointId ?? entryWaypointId,
              visitedWaypointIds: [
                ...new Set([...(observationRef.current.visitedWaypointIds ?? []), entryWaypointId]),
              ],
            },
            (key) => ({ name: 'anatomy_waypoint_reached', waypointId: entryWaypointId, key }),
            `waypoint:${entryWaypointId}`,
          )
        } else {
          update({ loaded: true })
        }
      }}
      onMovementStateChange={(movementState) => {
        update({
          currentWaypointId: movementState.currentWaypointId,
          visitedWaypointIds: movementState.visitedWaypointIds,
          movesUsed: movementState.movesUsed,
        })
      }}
      onStructureSelected={(structureId) => {
        const selectedStructureIds = observationRef.current.selectedStructureIds.includes(
          structureId,
        )
          ? observationRef.current.selectedStructureIds
          : [...observationRef.current.selectedStructureIds, structureId]
        recordInteraction(
          { selectedStructureIds },
          (key) => ({ name: 'anatomy_structure_selected', structureId, key }),
          `structure:${structureId}`,
        )
      }}
      onFindingInspected={(findingId) => {
        const inspectedFindingIds = observationRef.current.inspectedFindingIds.includes(findingId)
          ? observationRef.current.inspectedFindingIds
          : [...observationRef.current.inspectedFindingIds, findingId]
        recordInteraction(
          { inspectedFindingIds },
          (key) => ({ name: 'anatomy_finding_inspected', findingId, key }),
          `finding:${findingId}`,
        )
      }}
      onViewChanged={(view) => {
        if (disabled || !viewerLoaded.current) return
        pendingView.current = view
        if (viewTimer.current) clearTimeout(viewTimer.current)
        viewTimer.current = setTimeout(() => {
          const latest = pendingView.current
          if (!latest) return
          pendingView.current = null
          recordInteraction({}, (key) => ({ name: 'anatomy_view_changed', ...latest, key }))
        }, appConfig.product.anatomy3d.viewEventDebounceMs)
      }}
      onWaypointReached={(waypointId) => {
        const reachedWaypointIds = observationRef.current.reachedWaypointIds.includes(waypointId)
          ? observationRef.current.reachedWaypointIds
          : [...observationRef.current.reachedWaypointIds, waypointId]
        recordInteraction(
          { reachedWaypointIds },
          (key) => ({ name: 'anatomy_waypoint_reached', waypointId, key }),
          `waypoint:${waypointId}`,
        )
      }}
    />
  )
}
