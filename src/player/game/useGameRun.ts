import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ContentRegistry } from '@/content/loader'
import type { GameDocument } from '@/content/schema/game'
import type { AnatomyLocatePrimitive } from '@/content/schema/primitives'
import { planRun } from '@/engines/games/plan'
import { resolveRoundAccuracy, scoreRound } from '@/engines/games/scoring'
import {
  createGameSession,
  gameSessionReducer,
  type GameSession,
  type GameSessionAction,
} from '@/engines/games/session'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { emitEvent } from '@/events/bus'
import type { GameEventRoundResult } from '@/events/types'
import type { PrimitiveInteraction } from '@/primitives/types'

export function useGameRun({
  game,
  registry,
  difficultyId,
  seed,
  resumedSession,
}: {
  game: GameDocument
  registry: ContentRegistry
  difficultyId: string
  seed: number
  resumedSession?: GameSession | null
}) {
  const plan = useMemo(
    () => planRun({ game, registry, difficultyId, seed }),
    [difficultyId, game, registry, seed],
  )
  const [session, setSession] = useState<GameSession>(
    () => resumedSession ?? createGameSession(plan),
  )
  const save = useGameSessionStore((state) => state.save)
  const config = registry.appConfig.games!
  const difficulty = config.difficulties.find(({ id }) => id === session.difficulty)!

  useEffect(() => {
    save(session)
  }, [save, session])

  const dispatch = useCallback((action: GameSessionAction) => {
    setSession((current) => gameSessionReducer(current, action))
  }, [])

  const start = useCallback(() => {
    if (session.phase !== 'ready') return
    const runId = crypto.randomUUID()
    dispatch({ type: 'start', runId, at: new Date().toISOString() })
    emitEvent({
      event: 'game_started',
      gameId: game.id,
      runId,
      difficulty: session.difficulty,
      seed: session.seed,
      mode: 'standard',
    })
  }, [dispatch, game.id, session.difficulty, session.phase, session.seed])

  const startRound = useCallback(() => {
    const planned = plan.rounds[session.roundIndex]
    if (!planned || !session.runId) return
    dispatch({ type: 'roundStarted', at: new Date().toISOString() })
    emitEvent({
      event: 'game_round_started',
      runId: session.runId,
      slotId: planned.slotId,
      roundId: planned.roundId,
      mechanic: planned.mechanic,
    })
  }, [dispatch, plan.rounds, session.roundIndex, session.runId])

  const lock = useCallback(
    (response: unknown, elapsedMs: number, timedOut: boolean) => {
      const planned = plan.rounds[session.roundIndex]
      const round = planned ? registry.roundById.get(planned.roundId) : undefined
      if (!planned || !round || !config.scoring || !session.runId) return
      const now = new Date().toISOString()
      const action: GameSessionAction = timedOut
        ? { type: 'timedOut', at: now, elapsedMs, response }
        : { type: 'submitted', at: now, elapsedMs, response }
      dispatch(action)
      const effectiveRound = { ...round, primitive: planned.primitive }
      const anatomyMap = round.anatomyMapId
        ? registry.anatomyMapById.get(round.anatomyMapId)
        : undefined
      const proximityLevelIds =
        anatomyMap && planned.primitive.type === 'anatomy_locate'
          ? (() => {
              const primitive = planned.primitive as AnatomyLocatePrimitive
              const levels = new Set(primitive.content.levels.map(({ levelId }) => levelId))
              const structures = new Map(
                anatomyMap.structures.map((structure) => [structure.id, structure]),
              )
              primitive.content.levels.forEach((level) => {
                if (level.input !== 'model' && level.input !== 'structure_choice') return
                let current = structures.get(level.targetStructureId)
                while (current) {
                  levels.add(current.levelId)
                  current = current.parentId ? structures.get(current.parentId) : undefined
                }
              })
              return [...levels]
            })()
          : undefined
      const accuracy = resolveRoundAccuracy({
        round: effectiveRound,
        response,
        timedOut,
        anatomyMap,
        correctAnswer: planned.dropWaypointId,
        proximity: config.scoring.proximity,
        proximityLevelIds,
      })
      const currentRound = session.rounds[session.roundIndex]
      const paidClueCount = (currentRound?.revealedClueIds ?? []).filter((id) =>
        planned.paidClueIds.includes(id),
      ).length
      const result = scoreRound(
        {
          accuracy,
          elapsedMs,
          timeLimitSeconds: planned.timeLimitSeconds,
          timedOut,
          paidClueCount,
          difficulty,
        },
        config.scoring,
      )
      window.setTimeout(() => {
        setSession((current) =>
          gameSessionReducer(current, {
            type: 'revealed',
            at: new Date().toISOString(),
            result,
          }),
        )
        emitEvent({
          event: 'game_round_answered',
          runId: session.runId!,
          roundId: planned.roundId,
          accuracy: result.accuracy,
          correct: result.correct,
          points: result.points,
          speedBonus: result.speedBonus,
          elapsedMs,
          timedOut,
        })
      }, config.player.lockedHoldMs)
    },
    [
      config.player.lockedHoldMs,
      config.scoring,
      difficulty,
      dispatch,
      plan.rounds,
      registry.roundById,
      registry.anatomyMapById,
      session.roundIndex,
      session.rounds,
      session.runId,
    ],
  )

  const roundResults = useCallback(
    (source: GameSession): GameEventRoundResult[] =>
      source.rounds.flatMap((roundSession, index) => {
        const planned = plan.rounds[index]
        const result = roundSession.result
        if (!planned || !result || roundSession.elapsedMs === null) return []
        return [
          {
            slotId: planned.slotId,
            roundId: planned.roundId,
            mechanic: planned.mechanic,
            ...result,
            elapsedMs: roundSession.elapsedMs,
            timedOut: roundSession.timedOut,
          },
        ]
      }),
    [plan.rounds],
  )

  const next = useCallback(() => {
    setSession((current) => {
      const advanced = gameSessionReducer(current, { type: 'next' })
      if (advanced.phase !== 'final' || !advanced.runId) return advanced
      const results = roundResults(advanced)
      emitEvent({
        event: 'game_completed',
        runId: advanced.runId,
        gameId: advanced.gameId,
        difficulty: advanced.difficulty,
        seed: advanced.seed,
        mode: 'standard',
        total: results.reduce((sum, result) => sum + result.points, 0),
        correctCount: results.filter(({ correct }) => correct).length,
        durationSeconds: Math.round(
          results.reduce((sum, result) => sum + result.elapsedMs, 0) / 1_000,
        ),
        roundResults: results,
      })
      return gameSessionReducer(advanced, { type: 'complete', at: new Date().toISOString() })
    })
  }, [roundResults])

  const revealClue = useCallback(
    (clueId: string) => {
      const planned = plan.rounds[session.roundIndex]
      if (!planned || !session.runId) return
      dispatch({ type: 'clueRevealed', clueId })
      const paid = planned.paidClueIds.includes(clueId)
      emitEvent({
        event: 'game_clue_revealed',
        runId: session.runId,
        roundId: planned.roundId,
        clueId,
        paid,
        cost: paid ? planned.clueCostPoints : 0,
      })
    },
    [dispatch, plan.rounds, session.roundIndex, session.runId],
  )

  const interact = useCallback(
    (primitiveId: string, primitiveType: string, interaction: PrimitiveInteraction) => {
      emitEvent({
        event: 'artifact_interacted',
        activityKind: 'game',
        activityId: game.id,
        primitiveId,
        primitiveType,
        interaction,
      })
    },
    [game.id],
  )

  return {
    plan,
    session,
    dispatch,
    start,
    startRound,
    submit: (response: unknown, elapsedMs: number) => lock(response, elapsedMs, false),
    timeout: (response: unknown, elapsedMs: number) => lock(response, elapsedMs, true),
    next,
    revealClue,
    interact,
    results: roundResults(session),
  }
}
