import { beforeEach, describe, expect, it } from 'vitest'

import {
  createGameSession,
  gameSessionReducer,
  type GameSession,
  type GameSessionPlan,
} from '@/engines/games/session'
import { GAME_SESSION_VERSION, useGameSessionStore } from '@/engines/games/sessionStore'
import { idbStorage } from '@/state/persistence/idbStorage'

const plan: GameSessionPlan = {
  gameId: 'respiratory-challenge',
  gameVersion: '3',
  difficulty: 'challenge',
  seed: 42,
  rounds: [{ slotId: 'location', roundId: 'airway-look' }],
}

function startedSession(): GameSession {
  return gameSessionReducer(createGameSession(plan), {
    type: 'start',
    runId: 'run-42',
    at: '2026-10-07T04:30:00.000Z',
  })
}

describe('game session store', () => {
  beforeEach(async () => {
    useGameSessionStore.setState({ session: null })
    await useGameSessionStore.persist.clearStorage()
  })

  it('persists only the session with the game-session v1 contract', async () => {
    const session = startedSession()
    useGameSessionStore.getState().save(session)

    await expect
      .poll(() => idbStorage.getItem('game-session'))
      .toSatisfy((value) => value?.includes('"runId":"run-42"') ?? false)

    const persisted = JSON.parse((await idbStorage.getItem('game-session')) ?? '{}') as {
      state?: Record<string, unknown>
      version?: number
    }
    expect(persisted.version).toBe(GAME_SESSION_VERSION)
    expect(persisted.state).toEqual({ session })
  })

  it('resumes a rehydrated incomplete exact game and version match', async () => {
    const session = startedSession()
    useGameSessionStore.getState().save(session)

    await expect
      .poll(() => idbStorage.getItem('game-session'))
      .toSatisfy((value) => value?.includes('"runId":"run-42"') ?? false)
    const persisted = await idbStorage.getItem('game-session')
    useGameSessionStore.setState({ session: null })
    await idbStorage.setItem('game-session', persisted ?? '')
    await useGameSessionStore.persist.rehydrate()

    expect(useGameSessionStore.getState().loadForGame(plan.gameId, plan.gameVersion)).toEqual(
      session,
    )
    expect(useGameSessionStore.getState().session).toEqual(session)
  })

  it.each([
    ['different-game', plan.gameVersion],
    [plan.gameId, '4'],
  ])('clears a mismatched session for %s at version %s', (gameId, gameVersion) => {
    useGameSessionStore.getState().save(startedSession())

    expect(useGameSessionStore.getState().loadForGame(gameId, gameVersion)).toBeNull()
    expect(useGameSessionStore.getState().session).toBeNull()
  })

  it('clears ready and completed sessions instead of resuming them', () => {
    const ready = createGameSession(plan)
    useGameSessionStore.getState().save(ready)
    expect(useGameSessionStore.getState().loadForGame(plan.gameId, plan.gameVersion)).toBeNull()

    let completed = startedSession()
    completed = {
      ...completed,
      phase: 'complete',
      completedAt: '2026-10-07T04:31:00.000Z',
    }
    useGameSessionStore.getState().save(completed)

    expect(useGameSessionStore.getState().loadForGame(plan.gameId, plan.gameVersion)).toBeNull()
    expect(useGameSessionStore.getState().session).toBeNull()
  })

  it('clears the active session', () => {
    useGameSessionStore.getState().save(startedSession())

    useGameSessionStore.getState().clear()

    expect(useGameSessionStore.getState().session).toBeNull()
  })
})
