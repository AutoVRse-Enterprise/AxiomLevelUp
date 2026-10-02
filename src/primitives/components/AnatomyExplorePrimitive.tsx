import { useEffect, useRef, useState } from 'react'

import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import type { AnatomyViewState } from '@/anatomy3d/viewer/controller'
import type { AnatomyExplorePrimitive as AnatomyExplorePrimitiveContent } from '@/content/schema/primitives'
import { useAnatomyPrimitiveContext } from '@/primitives/components/anatomyUtils'
import type { AnatomyExploreObservation } from '@/primitives/definitions/anatomy'
import type { PrimitiveComponentProps, PrimitiveInteraction } from '@/primitives/types'

function initialObservation(draft: unknown): AnatomyExploreObservation {
  const value = draft && typeof draft === 'object' ? (draft as Record<string, unknown>) : {}
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
  }
}

export function AnatomyExplorePrimitive({
  primitive,
  draft,
  disabled,
  onDraftChange,
  onInteract,
}: PrimitiveComponentProps<AnatomyExplorePrimitiveContent>) {
  const { appConfig, map, model } = useAnatomyPrimitiveContext(primitive)
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
      markerStructureId={
        primitive.content.startView.mode === 'marker'
          ? primitive.content.startView.structureId
          : undefined
      }
      modelUrl={model.path}
      navigation={primitive.content.navigation}
      prompt={primitive.content.prompt}
      selectedStructureIds={observation.selectedStructureIds}
      startView={primitive.content.startView}
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
        update({ loaded: true })
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
