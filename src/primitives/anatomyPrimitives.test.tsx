import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AnatomyViewerProps } from '@/anatomy3d/viewer/AnatomyViewer'
import { ContentContext } from '@/app/contentContext'
import { anatomyExplorePrimitiveSchema } from '@/content/schema/primitives'
import { mapInteractionToEvents } from '@/player/interactionEvents'
import { AnatomyExplorePrimitive } from '@/primitives/components/AnatomyExplorePrimitive'
import {
  anatomyExploreRequirementKeys,
  isAnatomyExploreComplete,
} from '@/primitives/definitions/anatomy'
import { evaluatePrimitive, resolvePrimitiveDefinition } from '@/primitives/definitions'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'
import { validateContentBundle } from '@/content/loader'
import { makeValidContentBundle } from '@/test/contentFixtures'

const mockedViewer = vi.hoisted(() => ({ props: null as AnatomyViewerProps | null }))

vi.mock('@/anatomy3d/viewer/AnatomyViewer', () => ({
  AnatomyViewer: (props: AnatomyViewerProps) => {
    mockedViewer.props = props
    return (
      <div>
        <button
          onClick={() => props.onLoaded?.({ meshNames: ['trachea'], triangleCount: 96_152 }, 125)}
        >
          Load viewer
        </button>
        <button onClick={() => props.onStructureSelected?.('trachea')}>Select trachea</button>
        <button onClick={() => props.onWaypointReached?.('carina')}>Reach carina</button>
        <button
          onClick={() =>
            props.onViewChanged?.({
              position: [1, 2, 3],
              target: [0, 0, 0],
              waypointId: null,
              endoscopic: false,
            })
          }
        >
          Change view
        </button>
        <button onClick={() => props.onFailed?.('WebGL unavailable')}>Fail viewer</button>
      </div>
    )
  },
}))

const registry = validateContentBundle(makeValidContentBundle())

function primitive(
  completion:
    | { mode: 'viewed' }
    | { mode: 'explored'; count?: number }
    | { mode: 'minimum_interactions'; count: number } = { mode: 'explored' },
) {
  return anatomyExplorePrimitiveSchema.parse({
    id: 'explore-anatomy',
    type: 'anatomy_explore',
    conceptIds: ['thoracic-imaging'],
    content: {
      anatomyMapId: 'lung-map',
      prompt: 'Explore the airway.',
      startView: { mode: 'waypoint', waypointId: 'trachea-mid' },
      navigation: 'both',
      requiredStructureIds: ['trachea'],
      requiredWaypointIds: ['carina'],
    },
    completion,
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('anatomy exploration schema and definition', () => {
  it('accepts the three completion modes and rejects incompatible authoring', () => {
    expect(primitive({ mode: 'viewed' }).completion.mode).toBe('viewed')
    expect(primitive({ mode: 'explored', count: 1 }).completion.mode).toBe('explored')
    expect(primitive({ mode: 'minimum_interactions', count: 2 }).completion.mode).toBe(
      'minimum_interactions',
    )

    expect(
      anatomyExplorePrimitiveSchema.safeParse({
        ...primitive(),
        completion: { mode: 'answer' },
      }).success,
    ).toBe(false)
    expect(
      anatomyExplorePrimitiveSchema.safeParse({
        ...primitive(),
        content: {
          ...primitive().content,
          navigation: 'orbit',
          requiredWaypointIds: ['carina'],
        },
      }).success,
    ).toBe(false)
  })

  it('registers as an unscored anatomy domain primitive', () => {
    const value = primitive()
    const resolved = resolvePrimitiveDefinition(value)

    expect(resolved?.definition).toMatchObject({
      family: 'domain',
      layout: 'viewer',
      timerCompatible: false,
    })
    expect(resolved?.definition.scored(value)).toBe(false)
    expect(evaluatePrimitive(value, null)).toMatchObject({ score: 0, correct: false })
    expect(anatomyExploreRequirementKeys(value)).toEqual(['structure:trachea', 'waypoint:carina'])
  })
})

describe('anatomy exploration completion', () => {
  const empty = {
    loaded: false,
    interactionCount: 0,
    selectedStructureIds: [],
    reachedWaypointIds: [],
  }

  it('completes viewed, explored and minimum-interaction modes independently', () => {
    expect(isAnatomyExploreComplete(primitive({ mode: 'viewed' }), empty)).toBe(false)
    expect(
      isAnatomyExploreComplete(primitive({ mode: 'viewed' }), { ...empty, loaded: true }),
    ).toBe(true)

    const explored = primitive({ mode: 'explored' })
    expect(
      isAnatomyExploreComplete(explored, {
        ...empty,
        selectedStructureIds: ['trachea'],
      }),
    ).toBe(false)
    expect(
      isAnatomyExploreComplete(explored, {
        ...empty,
        selectedStructureIds: ['trachea'],
        reachedWaypointIds: ['carina'],
      }),
    ).toBe(true)

    expect(
      isAnatomyExploreComplete(primitive({ mode: 'minimum_interactions', count: 2 }), {
        ...empty,
        interactionCount: 2,
      }),
    ).toBe(true)
  })
})

describe('anatomy exploration interactions', () => {
  it('reports typed viewer events, debounces view changes and completes exploration', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const onInteract = vi.fn()
    render(
      <ContentContext.Provider value={registry}>
        <AnatomyExplorePrimitive
          attempt={0}
          draft={null}
          mode="interactive"
          onComplete={onComplete}
          onDraftChange={vi.fn()}
          onInteract={onInteract}
          onSubmit={vi.fn()}
          primitive={primitive()}
        />
      </ContentContext.Provider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Load viewer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select trachea' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reach carina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fail viewer' }))

    expect(onComplete).not.toHaveBeenCalled()
    expect(onInteract.mock.calls.map(([event]) => event.name)).toEqual([
      'anatomy_viewer_loaded',
      'anatomy_structure_selected',
      'anatomy_waypoint_reached',
      'anatomy_viewer_failed',
    ])

    act(() => vi.advanceTimersByTime(250))
    expect(onInteract.mock.calls.map(([event]) => event.name)).toEqual([
      'anatomy_viewer_loaded',
      'anatomy_structure_selected',
      'anatomy_waypoint_reached',
      'anatomy_viewer_failed',
      'anatomy_view_changed',
    ])
  })

  it('maps every typed anatomy interaction through the player event adapter', () => {
    const context = {
      activityKind: 'lesson' as const,
      activityId: 'lesson-1',
      primitiveId: 'explore-anatomy',
      primitiveType: 'anatomy_explore',
    }
    const interactions: PrimitiveInteraction[] = [
      { name: 'anatomy_structure_selected', structureId: 'trachea', key: 'structure:trachea' },
      { name: 'anatomy_waypoint_reached', waypointId: 'carina', key: 'waypoint:carina' },
      {
        name: 'anatomy_view_changed',
        position: [1, 2, 3],
        target: [0, 0, 0],
        waypointId: null,
        endoscopic: false,
        key: 'interaction:1',
      },
      { name: 'anatomy_viewer_loaded', loadMs: 125, meshCount: 8, triangleCount: 96_152 },
      { name: 'anatomy_viewer_failed', reason: 'WebGL unavailable' },
    ]

    expect(
      interactions.flatMap((interaction) =>
        mapInteractionToEvents(context, interaction, 0).map(({ event }) => event),
      ),
    ).toEqual([
      'artifact_interacted',
      'anatomy_structure_selected',
      'artifact_interacted',
      'anatomy_waypoint_reached',
      'artifact_interacted',
      'anatomy_view_changed',
      'artifact_interacted',
      'anatomy_viewer_loaded',
      'artifact_interacted',
      'anatomy_viewer_failed',
    ])
  })

  it('renders a recoverable fallback when the configured model is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ContentContext.Provider value={{ ...registry, assetById: new Map() }}>
        <PrimitiveRenderer
          attempt={0}
          draft={null}
          mode="interactive"
          onComplete={vi.fn()}
          onDraftChange={vi.fn()}
          onInteract={vi.fn()}
          onSubmit={vi.fn()}
          primitive={primitive()}
        />
      </ContentContext.Provider>,
    )

    expect(await screen.findByText('Anatomy model unavailable')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
  })
})
