export type CaseClockMode = 'none' | 'stopwatch' | 'countdown'

export interface PersistedCaseClock {
  mode: CaseClockMode
  accumulatedActiveMs: number
  maxDurationMs: number | null
  expired: boolean
}

export interface CaseClockState extends PersistedCaseClock {
  activeSinceMs: number | null
}

export interface CaseClockSnapshot {
  mode: CaseClockMode
  elapsedMs: number
  remainingMs: number | null
  expired: boolean
  running: boolean
}

interface CreateCaseClockOptions {
  mode: CaseClockMode
  maxDurationMs?: number | null
  accumulatedActiveMs?: number
  expired?: boolean
}

function normalizeMs(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function normalizeMaximum(mode: CaseClockMode, value: number | null | undefined) {
  if (mode !== 'countdown') return null
  const maxDurationMs = normalizeMs(value ?? 0)
  if (maxDurationMs === 0) {
    throw new Error('Countdown case clocks require a positive maximum duration.')
  }
  return maxDurationMs
}

function elapsedAt(state: CaseClockState, nowMs: number) {
  const runningMs = state.activeSinceMs === null ? 0 : Math.max(0, nowMs - state.activeSinceMs)
  return normalizeMs(state.accumulatedActiveMs + runningMs)
}

export function createCaseClock({
  mode,
  maxDurationMs,
  accumulatedActiveMs = 0,
}: CreateCaseClockOptions): CaseClockState {
  const maximum = normalizeMaximum(mode, maxDurationMs)
  const accumulated = normalizeMs(accumulatedActiveMs)
  const isExpired = mode === 'countdown' && accumulated >= (maximum ?? Infinity)

  return {
    mode,
    accumulatedActiveMs: accumulated,
    maxDurationMs: maximum,
    expired: isExpired,
    activeSinceMs: null,
  }
}

export function resumeCaseClock(state: CaseClockState, nowMs: number): CaseClockState {
  if (state.activeSinceMs !== null) return state
  return { ...state, activeSinceMs: nowMs }
}

export function pauseCaseClock(state: CaseClockState, nowMs: number): CaseClockState {
  const accumulatedActiveMs = elapsedAt(state, nowMs)
  const expired =
    state.mode === 'countdown' &&
    (state.expired || accumulatedActiveMs >= (state.maxDurationMs ?? Infinity))

  return {
    ...state,
    accumulatedActiveMs,
    expired,
    activeSinceMs: null,
  }
}

export function updateCaseClock(state: CaseClockState, nowMs: number): CaseClockState {
  if (state.activeSinceMs === null) return state
  const updated = pauseCaseClock(state, nowMs)
  return resumeCaseClock(updated, nowMs)
}

export function selectCaseClock(state: CaseClockState, nowMs: number): CaseClockSnapshot {
  const elapsedMs = elapsedAt(state, nowMs)
  const expired =
    state.mode === 'countdown' && (state.expired || elapsedMs >= (state.maxDurationMs ?? Infinity))

  return {
    mode: state.mode,
    elapsedMs,
    remainingMs:
      state.mode === 'countdown' ? Math.max(0, (state.maxDurationMs ?? 0) - elapsedMs) : null,
    expired,
    running: state.activeSinceMs !== null,
  }
}

export function persistCaseClock(state: CaseClockState, nowMs: number): PersistedCaseClock {
  const paused = pauseCaseClock(state, nowMs)
  return {
    mode: paused.mode,
    accumulatedActiveMs: paused.accumulatedActiveMs,
    maxDurationMs: paused.maxDurationMs,
    expired: paused.expired,
  }
}

export function restoreCaseClock(persisted: PersistedCaseClock): CaseClockState {
  return createCaseClock(persisted)
}
