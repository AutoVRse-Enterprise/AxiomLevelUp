import { describe, expect, it } from 'vitest'

import {
  anatomyMapSchema,
  gameConfigSchema,
  gameDocumentSchema,
  roundDocumentSchema,
  type AnatomyMap,
  type GameDocument,
  type RoundDocument,
} from '@/content/schema'

import { planRun, type RunPlanningRegistry } from './plan'

const games = gameConfigSchema.parse({
  hub: {
    title: 'Challenge',
    tagline: 'Make the call.',
    startLabel: 'Start',
    unavailableLabel: 'Unavailable',
  },
  difficulties: [
    {
      id: 'warmup',
      label: 'Warm-up',
      timeMultiplier: 1.5,
      maxMoves: 5,
      freeClues: 2,
      clueCostPoints: 25,
      speedBonus: true,
      optionSet: 'standard',
    },
    {
      id: 'expert',
      label: 'Expert',
      timeMultiplier: 0.5,
      maxMoves: 2,
      freeClues: 1,
      clueCostPoints: 100,
      speedBonus: false,
      optionSet: 'similar',
    },
  ],
})

const map = anatomyMapSchema.parse({
  schemaVersion: '0.1',
  id: 'airway-map',
  modelAssetId: 'airway-model',
  levels: [{ id: 'side', label: 'Side' }],
  structures: [
    { id: 'left', levelId: 'side', label: 'Left', meshNames: ['Left'] },
    { id: 'right', levelId: 'side', label: 'Right', meshNames: ['Right'] },
  ],
  waypoints: [
    {
      id: 'left-drop',
      label: 'Left drop',
      answerIds: { side: 'left' },
      position: [0, 0, 0],
      lookAt: [0, 0, 1],
      next: [],
    },
    {
      id: 'right-drop',
      label: 'Right drop',
      answerIds: { side: 'right' },
      position: [1, 0, 0],
      lookAt: [0, 0, 1],
      next: [],
    },
  ],
})

function answerPrimitive(id: string, prompt = 'Choose.') {
  return {
    id: 'answer',
    type: 'multiple_choice',
    content: {
      prompt: `${prompt} ${id}`,
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      correctOptionId: 'a',
    },
    completion: { mode: 'answer' },
  }
}

function clinicalRound(id: string): RoundDocument {
  return roundDocumentSchema.parse({
    schemaVersion: '0.1',
    roundVersion: '1',
    id,
    title: `Round ${id}`,
    mechanic: 'clinical_call',
    intro: 'Review the clues.',
    timeLimitSeconds: 40,
    primitive: answerPrimitive(id),
    primitiveByOptionSet: {
      standard: answerPrimitive(id, 'Standard options.'),
    },
    clues: [
      {
        id: 'history',
        title: 'History',
        primitive: {
          id: 'history-content',
          type: 'rich_text',
          content: { markdown: 'History.' },
        },
      },
      {
        id: 'test',
        title: 'Test',
        primitive: {
          id: 'test-content',
          type: 'rich_text',
          content: { markdown: 'Test.' },
        },
      },
      {
        id: 'image',
        title: 'Image',
        primitive: {
          id: 'image-content',
          type: 'rich_text',
          content: { markdown: 'Image.' },
        },
      },
    ],
    feedback: {
      correct: 'Correct.',
      incorrect: 'Not quite.',
      answerTemplate: 'Correct answer: {answer}.',
    },
    difficulty:
      id === 'call-a' ? { expert: { timeLimitSeconds: 17, freeClues: 0, maxMoves: 1 } } : {},
  })
}

function spatialRound(
  id = 'spatial',
  anatomyMapId = 'airway-map',
  dropIds = ['left-drop', 'right-drop'],
): RoundDocument {
  const primitive = {
    id: 'location',
    type: 'anatomy_locate',
    content: {
      anatomyMapId,
      prompt: 'Where are you?',
      answerFrom: 'entry',
      levels: [
        {
          levelId: 'side',
          input: 'choice',
          options: [
            { id: 'left', label: 'Left' },
            { id: 'right', label: 'Right' },
          ],
          correctOptionId: 'left',
        },
      ],
    },
    completion: { mode: 'answer' },
  }

  return roundDocumentSchema.parse({
    schemaVersion: '0.1',
    roundVersion: '1',
    id,
    title: 'Where are you?',
    mechanic: 'spatial_look',
    anatomyMapId,
    intro: 'Look around.',
    timeLimitSeconds: 30,
    drop: {
      pools: {
        warmup: dropIds,
        expert: dropIds,
      },
    },
    explore: {
      id: 'scene',
      type: 'anatomy_explore',
      content: {
        anatomyMapId,
        prompt: 'Inspect the marker.',
        navigation: 'orbit',
        startView: { mode: 'waypoint_marker', waypointId: 'left-drop' },
      },
    },
    primitive,
    primitiveByOptionSet: { standard: primitive },
    feedback: {
      correct: 'Correct.',
      incorrect: 'Not quite.',
      answerTemplate: 'Correct answer: {answer}.',
    },
  })
}

function game(slots: GameDocument['slots']): GameDocument {
  return gameDocumentSchema.parse({
    schemaVersion: '0.1',
    gameVersion: '1',
    id: 'airway-game',
    title: 'Airway game',
    tagline: 'A deterministic challenge.',
    organSystem: 'respiratory',
    estimatedSeconds: 120,
    slots,
    difficulties: ['warmup', 'expert'],
    defaultDifficulty: 'warmup',
  })
}

function registry(
  rounds: readonly RoundDocument[],
  anatomyMaps: readonly AnatomyMap[] = [map],
): RunPlanningRegistry {
  return {
    appConfig: { games },
    roundById: new Map(rounds.map((round) => [round.id, round])),
    anatomyMapById: new Map(anatomyMaps.map((anatomyMap) => [anatomyMap.id, anatomyMap])),
  }
}

describe('game run planning', () => {
  it('selects the same rounds and drop points for the same seed', () => {
    const rounds = [clinicalRound('call-a'), clinicalRound('call-b'), spatialRound()]
    const selectedGame = game([
      { id: 'calls', pool: ['call-a', 'call-b'], pick: 1 },
      { id: 'location', pool: ['spatial'], pick: 1 },
    ])

    const first = planRun({
      game: selectedGame,
      registry: registry(rounds),
      difficultyId: 'warmup',
      seed: 42,
    })
    const second = planRun({
      game: selectedGame,
      registry: registry(rounds),
      difficultyId: 'warmup',
      seed: 42,
    })

    expect(first).toEqual(second)
    const spatial = first.rounds.find(({ roundId }) => roundId === 'spatial')!
    expect(spatial.dropWaypointId).toMatch(/^(left|right)-drop$/)
    expect(spatial.primitive.content.levels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correctOptionId: map.waypoints.find(({ id }) => id === spatial.dropWaypointId)!.answerIds!
            .side,
        }),
      ]),
    )
    expect(spatial.explore?.content.startView).toEqual({
      mode: 'waypoint_marker',
      waypointId: spatial.dropWaypointId,
    })
  })

  it('changes the planned selection when the seed changes', () => {
    const rounds = [
      clinicalRound('call-a'),
      clinicalRound('call-b'),
      clinicalRound('call-c'),
      spatialRound(),
    ]
    const selectedGame = game([
      { id: 'calls', pool: ['call-a', 'call-b', 'call-c'], pick: 2 },
      { id: 'location', pool: ['spatial'], pick: 1 },
    ])

    const first = planRun({
      game: selectedGame,
      registry: registry(rounds),
      difficultyId: 'warmup',
      seed: 1,
    })
    const second = planRun({
      game: selectedGame,
      registry: registry(rounds),
      difficultyId: 'warmup',
      seed: 2,
    })

    expect(second.rounds).not.toEqual(first.rounds)
  })

  it('plans distinct rounds when one reusable slot picks more than once', () => {
    const rounds = [clinicalRound('call-a'), clinicalRound('call-b'), clinicalRound('call-c')]
    const planned = planRun({
      game: game([{ id: 'calls', pool: ['call-a', 'call-b', 'call-c'], pick: 2 }]),
      registry: registry(rounds),
      difficultyId: 'warmup',
      seed: 42,
    }).rounds

    expect(planned).toHaveLength(2)
    expect(new Set(planned.map(({ roundId }) => roundId)).size).toBe(2)
    expect(planned.map(({ slotId }) => slotId)).toEqual(['calls', 'calls'])
  })

  it('applies difficulty values, absolute overrides, clue split, and standard option fallback', () => {
    const round = clinicalRound('call-a')
    const planned = planRun({
      game: game([{ id: 'call', pool: ['call-a'], pick: 1 }]),
      registry: registry([round]),
      difficultyId: 'expert',
      seed: 7,
    }).rounds[0]!

    expect(planned).toMatchObject({
      timeLimitSeconds: 17,
      freeClueIds: [],
      paidClueIds: ['history', 'test', 'image'],
      clueCostPoints: 100,
      maxMoves: 1,
      speedBonus: false,
    })
    expect(planned.primitive.content.prompt).toBe('Standard options. call-a')
  })

  it('applies the time multiplier when no round override exists', () => {
    const planned = planRun({
      game: game([{ id: 'call', pool: ['call-b'], pick: 1 }]),
      registry: registry([clinicalRound('call-b')]),
      difficultyId: 'warmup',
      seed: 7,
    }).rounds[0]!

    expect(planned.timeLimitSeconds).toBe(60)
    expect(planned.freeClueIds).toEqual(['history', 'test'])
    expect(planned.paidClueIds).toEqual(['image'])
  })

  it('applies spatial exploration drop and difficulty movement overrides', () => {
    const baseRound = spatialRound('explore')
    const exploreRound = roundDocumentSchema.parse({
      ...baseRound,
      mechanic: 'spatial_explore',
      explore: {
        id: 'scene',
        type: 'anatomy_explore',
        content: {
          anatomyMapId: 'airway-map',
          prompt: 'Explore.',
          navigation: 'flythrough',
          startView: { mode: 'endoscopic', waypointId: 'left-drop' },
          movement: { maxMoves: 5, maxHopsFromEntry: 2, freeBacktrack: true },
        },
      },
      difficulty: {
        expert: {
          maxMoves: 1,
          maxHopsFromEntry: 1,
          orientationLabels: 'hidden',
        },
      },
    })
    const planned = planRun({
      game: game([{ id: 'location', pool: ['explore'], pick: 1 }]),
      registry: registry([exploreRound]),
      difficultyId: 'expert',
      seed: 2,
    }).rounds[0]!

    expect(planned.explore?.content).toMatchObject({
      startView: { mode: 'endoscopic', waypointId: planned.dropWaypointId },
      movement: { maxMoves: 1, maxHopsFromEntry: 1, freeBacktrack: true },
      orientationLabels: 'hidden',
    })
  })

  it('rejects unknown difficulties, maps, and drop waypoints with useful errors', () => {
    const selectedGame = game([{ id: 'location', pool: ['spatial'], pick: 1 }])
    expect(() =>
      planRun({
        game: selectedGame,
        registry: registry([spatialRound()]),
        difficultyId: 'missing',
        seed: 1,
      }),
    ).toThrow('Unknown difficulty "missing"')

    expect(() =>
      planRun({
        game: selectedGame,
        registry: registry([spatialRound('spatial', 'missing-map')]),
        difficultyId: 'warmup',
        seed: 1,
      }),
    ).toThrow('Unknown anatomy map "missing-map"')

    expect(() =>
      planRun({
        game: selectedGame,
        registry: registry([spatialRound('spatial', 'airway-map', ['missing-drop'])]),
        difficultyId: 'warmup',
        seed: 1,
      }),
    ).toThrow('Unknown drop waypoint "missing-drop"')
  })

  it('rejects an option-set primitive that is inconsistent with the base primitive', () => {
    const round = clinicalRound('call-a')
    const inconsistent = roundDocumentSchema.parse({
      ...round,
      primitiveByOptionSet: {
        standard: { ...round.primitive, id: 'different-answer' },
      },
    })

    expect(() =>
      planRun({
        game: game([{ id: 'call', pool: ['call-a'], pick: 1 }]),
        registry: registry([inconsistent]),
        difficultyId: 'warmup',
        seed: 1,
      }),
    ).toThrow('option set "standard" uses primitive id "different-answer"')
  })
})
