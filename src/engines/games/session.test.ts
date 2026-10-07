import { describe, expect, it } from 'vitest'

import {
  createGameSession,
  gameSessionReducer,
  type GameRoundResult,
  type GameSession,
  type GameSessionAction,
} from '@/engines/games/session'

const plan = {
  gameId: 'respiratory-challenge',
  gameVersion: '3',
  difficulty: 'challenge',
  seed: 42,
  rounds: [
    { slotId: 'location', roundId: 'airway-look' },
    { slotId: 'call', roundId: 'clinical-call' },
  ],
}

const correctResult: GameRoundResult = {
  accuracy: 1,
  correct: true,
  points: 1_100,
  basePoints: 1_000,
  speedBonus: 100,
  clueCost: 0,
}

function reduce(state: GameSession, ...actions: GameSessionAction[]) {
  return actions.reduce(gameSessionReducer, state)
}

describe('game session reducer', () => {
  it('accepts the structural output of the run planner with an explicit game version', () => {
    const session = createGameSession(
      {
        gameId: plan.gameId,
        difficultyId: 'expert',
        seed: 7,
        rounds: plan.rounds,
      },
      '5',
    )

    expect(session).toMatchObject({
      gameId: plan.gameId,
      gameVersion: '5',
      difficulty: 'expert',
      seed: 7,
    })
  })

  it('runs two rounds through the complete lifecycle', () => {
    const session = reduce(
      createGameSession(plan),
      { type: 'start', runId: 'run-42', at: '2026-10-07T04:30:00.000Z' },
      { type: 'roundStarted', at: '2026-10-07T04:30:01.000Z' },
      { type: 'clueRevealed', clueId: 'orientation' },
      { type: 'draftChanged', draft: 'right-lower-lobe' },
      { type: 'paused', elapsedMs: 2_500 },
      {
        type: 'submitted',
        at: '2026-10-07T04:30:15.000Z',
        response: 'right-lower-lobe',
        elapsedMs: 12_000,
      },
      { type: 'revealed', at: '2026-10-07T04:30:16.000Z', result: correctResult },
      { type: 'next' },
      { type: 'roundStarted', at: '2026-10-07T04:30:20.000Z' },
      { type: 'draftChanged', draft: 'asthma' },
      {
        type: 'timedOut',
        at: '2026-10-07T04:30:50.000Z',
        elapsedMs: 30_000,
      },
      {
        type: 'revealed',
        at: '2026-10-07T04:30:51.000Z',
        result: {
          ...correctResult,
          accuracy: 0,
          correct: false,
          points: 0,
          basePoints: 0,
          speedBonus: 0,
        },
      },
      { type: 'next' },
      { type: 'complete', at: '2026-10-07T04:31:00.000Z' },
    )

    expect(session).toMatchObject({
      runId: 'run-42',
      gameId: plan.gameId,
      gameVersion: plan.gameVersion,
      phase: 'complete',
      roundIndex: 1,
      startedAt: '2026-10-07T04:30:00.000Z',
      completedAt: '2026-10-07T04:31:00.000Z',
    })
    expect(session.rounds[0]).toMatchObject({
      startedAt: '2026-10-07T04:30:01.000Z',
      revealedClueIds: ['orientation'],
      draft: 'right-lower-lobe',
      response: 'right-lower-lobe',
      elapsedMs: 12_000,
      pausedMs: 2_500,
      timedOut: false,
      result: correctResult,
    })
    expect(session.rounds[1]).toMatchObject({
      draft: 'asthma',
      response: 'asthma',
      elapsedMs: 30_000,
      timedOut: true,
      result: { accuracy: 0, points: 0 },
    })
  })

  it('returns the same state for illegal transitions', () => {
    const ready = createGameSession(plan)
    const illegalFromReady: GameSessionAction[] = [
      { type: 'roundStarted', at: 'now' },
      { type: 'clueRevealed', clueId: 'clue' },
      { type: 'draftChanged', draft: 'answer' },
      { type: 'paused', elapsedMs: 100 },
      { type: 'submitted', at: 'now', response: 'answer', elapsedMs: 1 },
      { type: 'timedOut', at: 'now', elapsedMs: 1 },
      { type: 'revealed', at: 'now', result: correctResult },
      { type: 'next' },
      { type: 'complete', at: 'now' },
    ]

    for (const action of illegalFromReady) {
      expect(gameSessionReducer(ready, action)).toBe(ready)
    }

    const playing = reduce(
      ready,
      { type: 'start', runId: 'run-42', at: 'start' },
      { type: 'roundStarted', at: 'round-start' },
    )
    expect(gameSessionReducer(playing, { type: 'start', runId: 'replacement', at: 'later' })).toBe(
      playing,
    )
    expect(gameSessionReducer(playing, { type: 'next' })).toBe(playing)
    expect(gameSessionReducer(playing, { type: 'paused', elapsedMs: -1 })).toBe(playing)
  })

  it('deduplicates clues and reaches final before completion', () => {
    const playing = reduce(
      createGameSession({ ...plan, rounds: [plan.rounds[0]] }),
      { type: 'start', runId: 'run-one', at: 'start' },
      { type: 'roundStarted', at: 'round-start' },
      { type: 'clueRevealed', clueId: 'orientation' },
    )

    expect(gameSessionReducer(playing, { type: 'clueRevealed', clueId: 'orientation' })).toBe(
      playing,
    )

    const final = reduce(
      playing,
      { type: 'submitted', at: 'submitted', response: 'answer', elapsedMs: 1 },
      { type: 'revealed', at: 'revealed', result: correctResult },
      { type: 'next' },
    )
    expect(final.phase).toBe('final')
    expect(final.completedAt).toBeNull()
  })
})
