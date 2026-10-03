import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AnatomyViewerProps } from '@/anatomy3d/viewer/AnatomyViewer'
import { ContentContext } from '@/app/contentContext'
import {
  anatomyExplorePrimitiveSchema,
  anatomyLocatePrimitiveSchema,
} from '@/content/schema/primitives'
import { mapInteractionToEvents } from '@/player/interactionEvents'
import { AnatomyExplorePrimitive } from '@/primitives/components/AnatomyExplorePrimitive'
import { AnatomyLocatePrimitive } from '@/primitives/components/AnatomyLocatePrimitive'
import {
  anatomyLocateCorrectResponse,
  anatomyExploreRequirementKeys,
  isAnatomyExploreComplete,
  parseAnatomyLocateResponse,
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
        <button
          disabled={props.disabled}
          onClick={() => props.onStructureSelected?.('right-lower-lobe')}
        >
          Select right lower lobe
        </button>
        <button onClick={() => props.onWaypointReached?.('carina')}>Reach carina</button>
        <button onClick={() => props.onFindingInspected?.('fixture-finding')}>
          Inspect finding
        </button>
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
      findingIds: ['fixture-finding'],
      requiredFindingIds: ['fixture-finding'],
    },
    completion,
  })
}

function locatePrimitive() {
  return anatomyLocatePrimitiveSchema.parse({
    id: 'locate-anatomy',
    type: 'anatomy_locate',
    conceptIds: ['thoracic-imaging'],
    content: {
      anatomyMapId: 'lung-map',
      prompt: 'Localise the finding.',
      startView: { mode: 'overview' },
      levels: [
        {
          levelId: 'lobe',
          input: 'model',
          targetStructureId: 'right-lower-lobe',
          weight: 1,
          clueIds: ['clue-model'],
        },
        {
          levelId: 'segment',
          input: 'image',
          assetId: 'showcase-cell-map',
          alt: 'Synthetic localisation image.',
          regions: [
            {
              id: 'segment-medial',
              label: 'Medial region',
              shape: 'rect',
              x: 0.08,
              y: 0.2,
              width: 0.24,
              height: 0.3,
            },
            {
              id: 'segment-lateral',
              label: 'Lateral region',
              clueIds: ['clue-region'],
              shape: 'circle',
              x: 0.72,
              y: 0.4,
              radius: 0.14,
            },
          ],
          targetRegionId: 'segment-lateral',
          weight: 1,
        },
        {
          levelId: 'structure',
          input: 'choice',
          options: [
            { id: 'distal-airway', label: 'Distal airway', clueIds: ['clue-choice'] },
            { id: 'pleural-space', label: 'Pleural space' },
          ],
          correctOptionId: 'distal-airway',
          weight: 1,
        },
      ],
      explanation: 'The three levels identify the configured site.',
    },
    completion: { mode: 'answer' },
    timer: { durationSeconds: 60, mode: 'countdown' },
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('anatomy localisation schema and evaluation', () => {
  it('registers as a timer-compatible assessment with stable level responses', () => {
    const value = locatePrimitive()
    const resolved = resolvePrimitiveDefinition(value)

    expect(resolved?.definition).toMatchObject({
      family: 'assessment',
      layout: 'viewer',
      timerCompatible: true,
    })
    expect(anatomyLocateCorrectResponse(value)).toEqual({
      lobe: 'right-lower-lobe',
      segment: 'segment-lateral',
      structure: 'distal-airway',
    })
  })

  it('awards weighted per-level fractional credit, including a 0.5 result', () => {
    const value = anatomyLocatePrimitiveSchema.parse({
      ...locatePrimitive(),
      content: {
        ...locatePrimitive().content,
        levels: [locatePrimitive().content.levels[0], locatePrimitive().content.levels[2]],
      },
    })

    expect(
      evaluatePrimitive(value, {
        lobe: 'right-lower-lobe',
        structure: 'pleural-space',
      }),
    ).toMatchObject({
      score: 0.5,
      correct: false,
      items: { lobe: 'correct', structure: 'incorrect' },
    })

    const weighted = anatomyLocatePrimitiveSchema.parse({
      ...value,
      content: {
        ...value.content,
        levels: [
          { ...value.content.levels[0], weight: 3 },
          { ...value.content.levels[1], weight: 1 },
        ],
      },
    })
    expect(
      evaluatePrimitive(weighted, {
        lobe: 'right-lower-lobe',
        structure: 'pleural-space',
      }).score,
    ).toBe(0.75)
  })

  it('rejects incomplete, extra, and unknown structured responses', () => {
    const value = locatePrimitive()

    expect(parseAnatomyLocateResponse(value, { lobe: 'right-lower-lobe' })).toBeNull()
    expect(
      parseAnatomyLocateResponse(value, {
        ...anatomyLocateCorrectResponse(value),
        extra: 'distal-airway',
      }),
    ).toBeNull()
    expect(
      parseAnatomyLocateResponse(value, {
        ...anatomyLocateCorrectResponse(value),
        segment: 'unknown-region',
      }),
    ).toBeNull()
    expect(evaluatePrimitive(value, null)).toMatchObject({
      score: 0,
      items: { lobe: 'missed', segment: 'missed', structure: 'missed' },
    })
  })

  it('rejects duplicate levels, bad region targets, and non-answer completion', () => {
    const value = locatePrimitive()
    expect(
      anatomyLocatePrimitiveSchema.safeParse({
        ...value,
        content: {
          ...value.content,
          levels: [value.content.levels[0], value.content.levels[0]],
        },
      }).success,
    ).toBe(false)
    expect(
      anatomyLocatePrimitiveSchema.safeParse({
        ...value,
        content: {
          ...value.content,
          levels: value.content.levels.map((level) =>
            level.input === 'image' ? { ...level, targetRegionId: 'missing-region' } : level,
          ),
        },
      }).success,
    ).toBe(false)
    expect(
      anatomyLocatePrimitiveSchema.safeParse({
        ...value,
        completion: { mode: 'viewed' },
      }).success,
    ).toBe(false)
  })

  it('validates anatomy levels, model structures, and image asset types semantically', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles.find(({ file }) => file.includes('runtime-showcase'))!
      .data as {
      lessons: Array<{
        primitives: Array<{
          type: string
          content: {
            levels: Array<{
              levelId: string
              input: string
              targetStructureId?: string
              assetId?: string
            }>
          }
        }>
      }>
    }
    const locate = course.lessons[0]!.primitives.find(({ type }) => type === 'anatomy_locate')!
    locate.content.levels[0]!.targetStructureId = 'trachea'
    locate.content.levels[1]!.assetId = 'showcase-media-audio'
    locate.content.levels[2]!.levelId = 'missing-level'

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('content.levels.0.targetStructureId'),
            message: expect.stringContaining('belongs to level'),
          }),
          expect.objectContaining({
            path: expect.stringContaining('content.levels.1.assetId'),
            message: expect.stringContaining('expects type "image"'),
          }),
          expect.objectContaining({
            path: expect.stringContaining('content.levels.2.levelId'),
            message: expect.stringContaining('Unknown anatomy level'),
          }),
        ]),
      }),
    )
  })
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
    expect(anatomyExploreRequirementKeys(value)).toEqual([
      'structure:trachea',
      'waypoint:carina',
      'finding:fixture-finding',
    ])
  })
})

describe('anatomy exploration completion', () => {
  const empty = {
    loaded: false,
    interactionCount: 0,
    selectedStructureIds: [],
    reachedWaypointIds: [],
    inspectedFindingIds: [],
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
        inspectedFindingIds: ['fixture-finding'],
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
    fireEvent.click(screen.getByRole('button', { name: 'Inspect finding' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fail viewer' }))

    expect(onComplete).not.toHaveBeenCalled()
    expect(onInteract.mock.calls.map(([event]) => event.name)).toEqual([
      'anatomy_viewer_loaded',
      'anatomy_structure_selected',
      'anatomy_waypoint_reached',
      'anatomy_finding_inspected',
      'anatomy_viewer_failed',
    ])

    act(() => vi.advanceTimersByTime(250))
    expect(onInteract.mock.calls.map(([event]) => event.name)).toEqual([
      'anatomy_viewer_loaded',
      'anatomy_structure_selected',
      'anatomy_waypoint_reached',
      'anatomy_finding_inspected',
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
        name: 'anatomy_finding_inspected',
        findingId: 'fixture-finding',
        key: 'finding:fixture-finding',
      },
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
      'anatomy_finding_inspected',
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

describe('anatomy localisation component', () => {
  it('passes authored navigation and marker settings to the model viewer', () => {
    const value = anatomyLocatePrimitiveSchema.parse({
      ...locatePrimitive(),
      content: {
        ...locatePrimitive().content,
        navigation: 'both',
        startView: { mode: 'marker', structureId: 'trachea' },
      },
    })
    render(
      <ContentContext.Provider value={registry}>
        <AnatomyLocatePrimitive
          attempt={0}
          draft={null}
          mode="interactive"
          onComplete={vi.fn()}
          onDraftChange={vi.fn()}
          onInteract={vi.fn()}
          onSubmit={vi.fn()}
          primitive={value}
        />
      </ContentContext.Provider>,
    )

    expect(mockedViewer.props).toMatchObject({
      navigation: 'both',
      markerStructureId: 'trachea',
      startView: { mode: 'marker', structureId: 'trachea' },
    })
  })

  it('completes model, image, and choice levels using only the keyboard', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ContentContext.Provider value={registry}>
        <AnatomyLocatePrimitive
          attempt={0}
          draft={null}
          mode="interactive"
          onComplete={vi.fn()}
          onDraftChange={vi.fn()}
          onInteract={vi.fn()}
          onSubmit={onSubmit}
          primitive={locatePrimitive()}
        />
      </ContentContext.Provider>,
    )

    screen.getByRole('button', { name: 'Select right lower lobe' }).focus()
    await user.keyboard('{Enter}')
    screen.getByRole('button', { name: 'Next level' }).focus()
    await user.keyboard('{Enter}')

    screen.getByRole('radio', { name: 'Lateral region' }).focus()
    await user.keyboard(' ')
    screen.getByRole('button', { name: 'Next level' }).focus()
    await user.keyboard('{Enter}')

    screen.getByRole('radio', { name: 'Distal airway' }).focus()
    await user.keyboard(' ')
    screen.getByRole('button', { name: 'Check locations' }).focus()
    await user.keyboard('{Enter}')

    expect(onSubmit).toHaveBeenCalledWith({
      lobe: 'right-lower-lobe',
      segment: 'segment-lateral',
      structure: 'distal-airway',
    })
  })

  it('reveals the correct structure, region, and choice in review', () => {
    const value = locatePrimitive()
    const response = {
      lobe: 'right-upper-lobe',
      segment: 'segment-medial',
      structure: 'pleural-space',
    }
    render(
      <ContentContext.Provider value={registry}>
        <AnatomyLocatePrimitive
          attempt={1}
          disabled
          draft={null}
          mode="review"
          review={{
            response,
            evaluation: evaluatePrimitive(value, response),
            revealAnswer: true,
          }}
          onComplete={vi.fn()}
          onDraftChange={vi.fn()}
          onInteract={vi.fn()}
          onSubmit={vi.fn()}
          primitive={value}
        />
      </ContentContext.Provider>,
    )

    expect(screen.getByText('Correct structure: Right lower lobe')).toBeVisible()
    expect(screen.getByText('Correct region: Lateral region')).toBeVisible()
    expect(screen.getByText('Correct choice: Distal airway')).toBeVisible()
  })

  it('does not allow progress while disabled', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    render(
      <ContentContext.Provider value={registry}>
        <AnatomyLocatePrimitive
          attempt={0}
          disabled
          draft={null}
          mode="interactive"
          onComplete={vi.fn()}
          onDraftChange={onDraftChange}
          onInteract={vi.fn()}
          onSubmit={vi.fn()}
          primitive={locatePrimitive()}
        />
      </ContentContext.Provider>,
    )

    expect(screen.getByRole('button', { name: 'Select right lower lobe' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next level' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Select right lower lobe' }))
    expect(onDraftChange).not.toHaveBeenCalled()
  })
})
