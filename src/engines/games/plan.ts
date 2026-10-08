import type { ContentRegistry } from '@/content/loader'
import type {
  AnatomyExplorePrimitive,
  AnatomyLocatePrimitive,
  AnatomyMap,
  GameDocument,
  GameMechanic,
  Primitive,
  RoundDocument,
} from '@/content/schema'
import { resolveEntryLocalisation } from '@/engines/cases/entry'

import { pickFromPool } from './seed'

export type RunPlanningRegistry = Pick<ContentRegistry, 'roundById' | 'anatomyMapById'> & {
  appConfig: Pick<ContentRegistry['appConfig'], 'games'>
}

export interface PlannedRound {
  slotId: string
  roundId: string
  mechanic: GameMechanic
  timeLimitSeconds: number
  freeClueIds: string[]
  paidClueIds: string[]
  clueCostPoints: number
  maxMoves: number
  speedBonus: boolean
  dropWaypointId?: string
  primitive: Primitive
  explore?: Primitive
}

export interface PlannedRun {
  gameId: string
  gameVersion: string
  difficultyId: string
  seed: number
  rounds: PlannedRound[]
}

export interface PlanRunInput {
  game: GameDocument
  registry: RunPlanningRegistry
  difficultyId: string
  seed: number
}

interface SelectedPrimitive {
  primitive: Primitive
  optionSet: string
}

function selectPrimitive(round: RoundDocument, optionSet: string): SelectedPrimitive {
  const exact = round.primitiveByOptionSet[optionSet]
  const standard = round.primitiveByOptionSet.standard
  const selected = exact ?? standard ?? round.primitive
  const selectedOptionSet = exact ? optionSet : standard ? 'standard' : 'base'

  if (selected.id !== round.primitive.id) {
    throw new Error(
      `Round "${round.id}" option set "${selectedOptionSet}" uses primitive id "${selected.id}" instead of "${round.primitive.id}".`,
    )
  }
  if (selected.type !== round.primitive.type) {
    throw new Error(
      `Round "${round.id}" option set "${selectedOptionSet}" uses primitive type "${selected.type}" instead of "${round.primitive.type}".`,
    )
  }

  return { primitive: selected, optionSet: selectedOptionSet }
}

function assertEntryOptionExists(
  round: RoundDocument,
  primitive: AnatomyLocatePrimitive,
  map: AnatomyMap,
  waypointId: string,
  optionSet: string,
): void {
  const waypoint = map.waypoints.find(({ id }) => id === waypointId)!
  const structureIds = new Set(map.structures.map(({ id }) => id))

  primitive.content.levels.forEach((level) => {
    const answerId = waypoint.answerIds?.[level.levelId]
    if (!answerId) {
      throw new Error(
        `Drop waypoint "${waypointId}" has no answer for level "${level.levelId}" in round "${round.id}".`,
      )
    }

    const isConsistent =
      level.input === 'choice'
        ? level.options.some(({ id }) => id === answerId)
        : level.input === 'image'
          ? level.regions.some(({ id }) => id === answerId)
          : structureIds.has(answerId)
    if (!isConsistent) {
      throw new Error(
        `Round "${round.id}" option set "${optionSet}" does not contain drop answer "${answerId}" for level "${level.levelId}".`,
      )
    }
  })
}

function resolvePlannedPrimitive(
  round: RoundDocument,
  selected: SelectedPrimitive,
  map: AnatomyMap | undefined,
  dropWaypointId: string | undefined,
): Primitive {
  if (
    selected.primitive.type !== 'anatomy_locate' ||
    selected.primitive.content.answerFrom !== 'entry'
  ) {
    return selected.primitive
  }
  if (!map) {
    throw new Error(`Round "${round.id}" needs a known anatomy map to resolve its entry answer.`)
  }
  if (!dropWaypointId) {
    throw new Error(`Round "${round.id}" needs a drop waypoint to resolve its entry answer.`)
  }

  const primitive = selected.primitive as AnatomyLocatePrimitive
  assertEntryOptionExists(round, primitive, map, dropWaypointId, selected.optionSet)
  return resolveEntryLocalisation(primitive, map, dropWaypointId)
}

function resolvePlannedExplore(
  round: RoundDocument,
  dropWaypointId: string | undefined,
  maxMoves: number,
  maxHopsFromEntry: number | undefined,
  orientationLabels: 'patient' | 'hidden' | undefined,
): Primitive | undefined {
  if (round.explore?.type !== 'anatomy_explore' || !dropWaypointId) return round.explore
  const explore = round.explore as AnatomyExplorePrimitive
  const startView =
    round.mechanic === 'spatial_look' && explore.content.navigation !== 'look'
      ? ({ mode: 'waypoint_marker', waypointId: dropWaypointId } as const)
      : explore.content.startView.mode === 'waypoint_marker'
        ? ({ mode: 'waypoint_marker', waypointId: dropWaypointId } as const)
        : ({ mode: 'endoscopic', waypointId: dropWaypointId } as const)
  return {
    ...explore,
    content: {
      ...explore.content,
      startView,
      orientationLabels: orientationLabels ?? explore.content.orientationLabels,
      ...(explore.content.movement
        ? {
            movement: {
              ...explore.content.movement,
              maxMoves,
              maxHopsFromEntry: maxHopsFromEntry ?? explore.content.movement.maxHopsFromEntry,
            },
          }
        : {}),
    },
  }
}

function planRound(
  round: RoundDocument,
  slotId: string,
  pickIndex: number,
  game: GameDocument,
  registry: RunPlanningRegistry,
  difficulty: NonNullable<ContentRegistry['appConfig']['games']>['difficulties'][number],
  seed: number,
): PlannedRound {
  const override = round.difficulty[difficulty.id]
  const freeClueCount = override?.freeClues ?? difficulty.freeClues
  const clueIds = round.clues.map(({ id }) => id)
  const selectedPrimitive = selectPrimitive(round, difficulty.optionSet)

  let map: AnatomyMap | undefined
  if (round.anatomyMapId) {
    map = registry.anatomyMapById.get(round.anatomyMapId)
    if (!map) {
      throw new Error(
        `Unknown anatomy map "${round.anatomyMapId}" referenced by round "${round.id}".`,
      )
    }
    const primitiveMapId = selectedPrimitive.primitive.content.anatomyMapId
    if (typeof primitiveMapId === 'string' && primitiveMapId !== round.anatomyMapId) {
      throw new Error(
        `Round "${round.id}" option set "${selectedPrimitive.optionSet}" references anatomy map "${primitiveMapId}" instead of "${round.anatomyMapId}".`,
      )
    }
  }

  let dropWaypointId: string | undefined
  if (round.drop) {
    if (!map) {
      throw new Error(`Round "${round.id}" defines drop points without a known anatomy map.`)
    }
    const dropPool = round.drop.pools[difficulty.id]
    if (!dropPool) {
      throw new Error(`Round "${round.id}" has no drop pool for difficulty "${difficulty.id}".`)
    }
    const waypointIds = new Set(map.waypoints.map(({ id }) => id))
    const unknownDrop = dropPool.find((id) => !waypointIds.has(id))
    if (unknownDrop) {
      throw new Error(
        `Unknown drop waypoint "${unknownDrop}" in round "${round.id}" for anatomy map "${map.id}".`,
      )
    }
    ;[dropWaypointId] = pickFromPool(
      dropPool,
      1,
      seed,
      `game:${game.id}:slot:${slotId}:pick:${pickIndex}:round:${round.id}:drop`,
    )
  }

  const timeLimitSeconds =
    override?.timeLimitSeconds ??
    Math.max(1, Math.round(round.timeLimitSeconds * difficulty.timeMultiplier))
  const primitive = resolvePlannedPrimitive(round, selectedPrimitive, map, dropWaypointId)
  const maxMoves = override?.maxMoves ?? difficulty.maxMoves
  const explore = resolvePlannedExplore(
    round,
    dropWaypointId,
    maxMoves,
    override?.maxHopsFromEntry,
    override?.orientationLabels,
  )

  return {
    slotId,
    roundId: round.id,
    mechanic: round.mechanic,
    timeLimitSeconds,
    freeClueIds: clueIds.slice(0, freeClueCount),
    paidClueIds: clueIds.slice(freeClueCount),
    clueCostPoints: difficulty.clueCostPoints,
    maxMoves,
    speedBonus: difficulty.speedBonus,
    ...(dropWaypointId ? { dropWaypointId } : {}),
    primitive,
    ...(explore ? { explore } : {}),
  }
}

export function planRun({ game, registry, difficultyId, seed }: PlanRunInput): PlannedRun {
  const gamesConfig = registry.appConfig.games
  if (!gamesConfig) {
    throw new Error('Game configuration is unavailable.')
  }
  const difficulty = gamesConfig.difficulties.find(({ id }) => id === difficultyId)
  if (!difficulty || !game.difficulties.includes(difficultyId)) {
    throw new Error(`Unknown difficulty "${difficultyId}" for game "${game.id}".`)
  }

  const runSeed = seed >>> 0
  const rounds = game.slots.flatMap((slot) => {
    const roundIds = pickFromPool(
      slot.pool,
      slot.pick,
      runSeed,
      `game:${game.id}:slot:${slot.id}:rounds`,
    )
    return roundIds.map((roundId, pickIndex) => {
      const round = registry.roundById.get(roundId)
      if (!round) {
        throw new Error(`Unknown round "${roundId}" in game "${game.id}" slot "${slot.id}".`)
      }
      return planRound(round, slot.id, pickIndex, game, registry, difficulty, runSeed)
    })
  })

  return {
    gameId: game.id,
    gameVersion: game.gameVersion,
    difficultyId,
    seed: runSeed,
    rounds,
  }
}
