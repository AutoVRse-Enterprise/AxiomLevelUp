export type GameSessionPhase =
  'ready' | 'intro' | 'playing' | 'locked' | 'reveal' | 'final' | 'complete'

/**
 * The stable portion of a planned run needed by the session engine. Keeping
 * this structural avoids coupling persistence to the planner's implementation.
 */
export interface GameSessionPlan {
  gameId: string
  gameVersion: string
  difficulty: string
  seed: number
  rounds: readonly unknown[]
}

export interface PlannedGameRun {
  gameId: string
  gameVersion?: string
  difficultyId: string
  seed: number
  rounds: readonly unknown[]
}

export interface GameRoundResult {
  accuracy: number
  correct: boolean
  points: number
  basePoints: number
  speedBonus: number
  clueCost: number
}

export interface GameRoundSession {
  startedAt: string | null
  submittedAt: string | null
  revealedAt: string | null
  revealedClueIds: string[]
  draft: unknown
  exploreDraft?: unknown
  roundStep?: 'explore' | 'answer'
  response: unknown
  elapsedMs: number | null
  elapsedCheckpointMs?: number
  pausedMs: number
  timedOut: boolean
  result: GameRoundResult | null
}

export interface GameSession {
  plan: GameSessionPlan | PlannedGameRun
  gameId: string
  gameVersion: string
  difficulty: string
  seed: number
  runId: string | null
  phase: GameSessionPhase
  roundIndex: number
  rounds: GameRoundSession[]
  startedAt: string | null
  completedAt: string | null
}

export type GameSessionAction =
  | { type: 'start'; runId: string; at: string }
  | { type: 'roundStarted'; at: string }
  | { type: 'clueRevealed'; clueId: string }
  | { type: 'draftChanged'; draft: unknown }
  | { type: 'exploreDraftChanged'; draft: unknown }
  | { type: 'roundStepChanged'; step: 'explore' | 'answer' }
  | { type: 'checkpoint'; elapsedMs: number }
  | { type: 'paused'; elapsedMs: number }
  | { type: 'submitted'; at: string; response: unknown; elapsedMs: number }
  | { type: 'timedOut'; at: string; elapsedMs: number; response?: unknown }
  | { type: 'revealed'; at: string; result: GameRoundResult }
  | { type: 'next' }
  | { type: 'complete'; at: string }

function createRoundSession(): GameRoundSession {
  return {
    startedAt: null,
    submittedAt: null,
    revealedAt: null,
    revealedClueIds: [],
    draft: null,
    exploreDraft: null,
    roundStep: 'explore',
    response: null,
    elapsedMs: null,
    elapsedCheckpointMs: 0,
    pausedMs: 0,
    timedOut: false,
    result: null,
  }
}

export function createGameSession(
  plan: GameSessionPlan | PlannedGameRun,
  plannedGameVersion?: string,
): GameSession {
  const gameVersion = plan.gameVersion ?? plannedGameVersion
  const difficulty = 'difficulty' in plan ? plan.difficulty : plan.difficultyId
  if (!gameVersion) {
    throw new Error('A game version is required to create a game session.')
  }
  if (!difficulty) {
    throw new Error('A difficulty is required to create a game session.')
  }
  return {
    plan,
    gameId: plan.gameId,
    gameVersion,
    difficulty,
    seed: plan.seed,
    runId: null,
    phase: 'ready',
    roundIndex: 0,
    rounds: plan.rounds.map(createRoundSession),
    startedAt: null,
    completedAt: null,
  }
}

function updateCurrentRound(
  state: GameSession,
  update: (round: GameRoundSession) => GameRoundSession,
): GameSession {
  const current = state.rounds[state.roundIndex]
  if (!current) return state
  const rounds = [...state.rounds]
  rounds[state.roundIndex] = update(current)
  return { ...state, rounds }
}

function validElapsedMs(value: number) {
  return Number.isFinite(value) && value >= 0
}

function validResult(result: GameRoundResult) {
  return (
    Number.isFinite(result.accuracy) &&
    result.accuracy >= 0 &&
    result.accuracy <= 1 &&
    Number.isFinite(result.points) &&
    Number.isFinite(result.basePoints) &&
    Number.isFinite(result.speedBonus) &&
    Number.isFinite(result.clueCost)
  )
}

export function gameSessionReducer(state: GameSession, action: GameSessionAction): GameSession {
  switch (action.type) {
    case 'start':
      if (state.phase !== 'ready' || !action.runId || state.rounds.length === 0) return state
      return {
        ...state,
        runId: action.runId,
        phase: 'intro',
        startedAt: action.at,
      }

    case 'roundStarted':
      if (state.phase !== 'intro') return state
      return updateCurrentRound({ ...state, phase: 'playing' }, (round) => ({
        ...round,
        startedAt: action.at,
      }))

    case 'clueRevealed': {
      if (state.phase !== 'playing' || !action.clueId) return state
      const current = state.rounds[state.roundIndex]
      if (!current || current.revealedClueIds.includes(action.clueId)) return state
      return updateCurrentRound(state, (round) => ({
        ...round,
        revealedClueIds: [...round.revealedClueIds, action.clueId],
      }))
    }

    case 'draftChanged':
      if (state.phase !== 'playing') return state
      return updateCurrentRound(state, (round) => ({ ...round, draft: action.draft }))

    case 'exploreDraftChanged':
      if (state.phase !== 'playing') return state
      return updateCurrentRound(state, (round) => ({ ...round, exploreDraft: action.draft }))

    case 'roundStepChanged':
      if (state.phase !== 'playing') return state
      return updateCurrentRound(state, (round) => ({ ...round, roundStep: action.step }))

    case 'checkpoint':
      if (state.phase !== 'playing' || !validElapsedMs(action.elapsedMs)) return state
      return updateCurrentRound(state, (round) => ({
        ...round,
        elapsedCheckpointMs: action.elapsedMs,
      }))

    case 'paused':
      if (
        state.phase !== 'playing' ||
        !validElapsedMs(action.elapsedMs) ||
        action.elapsedMs === 0
      ) {
        return state
      }
      return updateCurrentRound(state, (round) => ({
        ...round,
        pausedMs: round.pausedMs + action.elapsedMs,
      }))

    case 'submitted':
    case 'timedOut':
      if (state.phase !== 'playing' || !validElapsedMs(action.elapsedMs)) return state
      return updateCurrentRound({ ...state, phase: 'locked' }, (round) => ({
        ...round,
        submittedAt: action.at,
        response: action.type === 'timedOut' ? (action.response ?? round.draft) : action.response,
        elapsedMs: action.elapsedMs,
        elapsedCheckpointMs: action.elapsedMs,
        timedOut: action.type === 'timedOut',
      }))

    case 'revealed':
      if (state.phase !== 'locked' || !validResult(action.result)) return state
      return updateCurrentRound({ ...state, phase: 'reveal' }, (round) => ({
        ...round,
        revealedAt: action.at,
        result: action.result,
      }))

    case 'next':
      if (state.phase !== 'reveal') return state
      if (state.roundIndex >= state.rounds.length - 1) {
        return { ...state, phase: 'final' }
      }
      return {
        ...state,
        phase: 'intro',
        roundIndex: state.roundIndex + 1,
      }

    case 'complete':
      if (state.phase !== 'final') return state
      return { ...state, phase: 'complete', completedAt: action.at }
  }
}

export function sessionMatchesGame(session: GameSession, gameId: string, gameVersion: string) {
  return session.gameId === gameId && session.gameVersion === gameVersion
}

export function isIncompleteGameSession(session: GameSession) {
  return session.phase !== 'ready' && session.phase !== 'complete'
}
