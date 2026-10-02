import type { CaseClockMode } from '@/engines/cases/clock'

export type CaseScoreComponent = 'anatomy' | 'diagnosis' | 'none'

export interface CaseScoringWeights {
  anatomy: number
  diagnosis: number
  speed: number
}

export interface CaseSpeedBlend {
  perStep: number
  perCase: number
}

export interface CaseCluePenaltyConfig {
  perOptionalClue: number
  cap: number
}

export interface CaseScoringConfig {
  weights: CaseScoringWeights
  speedBlend: CaseSpeedBlend
  defaultStepTargetSeconds: number
  defaultStepMaxSeconds: number
  cluePenalty: CaseCluePenaltyConfig
}

export interface CaseScoringStepInput {
  component: CaseScoreComponent
  firstAttemptScore: number
  weight?: number
  elapsedMs?: number
  targetSeconds?: number
  maxSeconds?: number
  timedOut?: boolean
}

export interface CaseScoringClueInput {
  id: string
  essential: boolean
}

export interface CaseScoreInput {
  timingMode: CaseClockMode
  steps: readonly CaseScoringStepInput[]
  clues: readonly CaseScoringClueInput[]
  openedClueIds: readonly string[]
  durationMs: number
  caseTargetSeconds?: number
  caseMaxSeconds?: number
  caseClockExpired?: boolean
  config: CaseScoringConfig
}

export interface CaseScoreBreakdown {
  anatomy: number
  diagnosis: number
  speed: number
  perStepSpeed: number
  caseSpeed: number
  penalty: number
  total: number
  weights: CaseScoringWeights
  durationSeconds: number
  openedClueIds: string[]
}

interface ResolvedStep {
  component: CaseScoreComponent
  score: number
  weight: number
  speed: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0)

const nonnegativeOrZero = (value: number) => Math.max(0, finiteOrZero(value))

const scoreOrZero = (value: number) => clamp(finiteOrZero(value), 0, 1)

function normalizeParts<T extends { [Key in keyof T]: number }>(parts: T): T {
  const keys = Object.keys(parts) as (keyof T)[]
  const total = keys.reduce((sum, key) => sum + nonnegativeOrZero(parts[key]), 0)

  return Object.fromEntries(
    keys.map((key) => {
      const value = nonnegativeOrZero(parts[key])
      return [key, total === 0 ? 0 : value / total]
    }),
  ) as T
}

function resolveEffectiveWeights(
  weights: CaseScoringWeights,
  timingMode: CaseClockMode,
): CaseScoringWeights {
  const normalized = normalizeParts(weights)
  if (timingMode !== 'none') return normalized

  const withoutSpeed = normalizeParts({
    anatomy: normalized.anatomy,
    diagnosis: normalized.diagnosis,
  })
  return {
    ...withoutSpeed,
    speed: 0,
  }
}

function resolveStepSpeed(step: CaseScoringStepInput, score: number, config: CaseScoringConfig) {
  if (step.timedOut || score === 0) return 0

  const elapsedMs = step.elapsedMs
  if (elapsedMs === undefined || !Number.isFinite(elapsedMs) || elapsedMs < 0) return 0

  const configuredTarget = config.defaultStepTargetSeconds
  const configuredMaximum = config.defaultStepMaxSeconds
  const targetSeconds =
    step.targetSeconds !== undefined &&
    Number.isFinite(step.targetSeconds) &&
    step.targetSeconds >= 0
      ? step.targetSeconds
      : configuredTarget
  const maxSeconds =
    step.maxSeconds !== undefined && Number.isFinite(step.maxSeconds) && step.maxSeconds >= 0
      ? step.maxSeconds
      : configuredMaximum

  if (
    !Number.isFinite(targetSeconds) ||
    !Number.isFinite(maxSeconds) ||
    targetSeconds < 0 ||
    maxSeconds <= targetSeconds
  ) {
    return 0
  }

  const elapsedSeconds = elapsedMs / 1_000
  return clamp((maxSeconds - elapsedSeconds) / (maxSeconds - targetSeconds), 0, 1) * score
}

function resolveSteps(
  steps: readonly CaseScoringStepInput[],
  config: CaseScoringConfig,
): ResolvedStep[] {
  return steps
    .filter(({ component }) => component === 'anatomy' || component === 'diagnosis')
    .map((step) => {
      const score = scoreOrZero(step.firstAttemptScore)
      const weight =
        step.weight === undefined
          ? 1
          : Number.isFinite(step.weight) && step.weight > 0
            ? step.weight
            : 0

      return {
        component: step.component,
        score,
        weight,
        speed: resolveStepSpeed(step, score, config),
      }
    })
}

function componentMean(steps: readonly ResolvedStep[], component: CaseScoreComponent) {
  let weightedScore = 0
  let totalWeight = 0

  for (const step of steps) {
    if (step.component !== component || step.weight === 0) continue
    weightedScore += step.score * step.weight
    totalWeight += step.weight
  }

  return totalWeight === 0 ? 0 : weightedScore / totalWeight
}

function mean(values: readonly number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}

function resolveCaseSpeed(input: CaseScoreInput, anatomy: number, diagnosis: number) {
  if (input.caseClockExpired) return 0
  if (!Number.isFinite(input.durationMs) || input.durationMs < 0) return 0

  const targetSeconds = input.caseTargetSeconds
  const maxSeconds = input.caseMaxSeconds
  if (
    targetSeconds === undefined ||
    maxSeconds === undefined ||
    !Number.isFinite(targetSeconds) ||
    !Number.isFinite(maxSeconds) ||
    targetSeconds < 0 ||
    maxSeconds <= targetSeconds
  ) {
    return 0
  }

  const durationSeconds = input.durationMs / 1_000
  const timeFactor = clamp((maxSeconds - durationSeconds) / (maxSeconds - targetSeconds), 0, 1)
  return timeFactor * ((anatomy + diagnosis) / 2)
}

function uniqueOpenedClueIds(openedClueIds: readonly string[]) {
  return [
    ...new Set(openedClueIds.filter((clueId) => typeof clueId === 'string' && clueId.length > 0)),
  ]
}

function resolvePenalty(
  clues: readonly CaseScoringClueInput[],
  openedClueIds: readonly string[],
  config: CaseCluePenaltyConfig,
) {
  const optionalClueIds = new Set(clues.filter(({ essential }) => !essential).map(({ id }) => id))
  const openedOptionalCount = openedClueIds.filter((id) => optionalClueIds.has(id)).length
  const perOptionalClue = nonnegativeOrZero(config.perOptionalClue)
  const cap = clamp(nonnegativeOrZero(config.cap), 0, 100)
  return Math.min(cap, perOptionalClue * openedOptionalCount)
}

export function calculateCaseScore(input: CaseScoreInput): CaseScoreBreakdown {
  const effectiveWeights = resolveEffectiveWeights(input.config.weights, input.timingMode)
  const steps = resolveSteps(input.steps, input.config)
  const anatomy = componentMean(steps, 'anatomy')
  const diagnosis = componentMean(steps, 'diagnosis')
  const openedClueIds = uniqueOpenedClueIds(input.openedClueIds)
  const penalty = resolvePenalty(input.clues, openedClueIds, input.config.cluePenalty)

  const perStepSpeed = input.timingMode === 'none' ? 0 : mean(steps.map(({ speed }) => speed))
  const caseSpeed = input.timingMode === 'none' ? 0 : resolveCaseSpeed(input, anatomy, diagnosis)
  const speedBlend = normalizeParts(input.config.speedBlend)
  const speed =
    input.timingMode === 'none'
      ? 0
      : speedBlend.perStep * perStepSpeed + speedBlend.perCase * caseSpeed
  const weightedScore =
    effectiveWeights.anatomy * anatomy +
    effectiveWeights.diagnosis * diagnosis +
    effectiveWeights.speed * speed
  const total = clamp(Math.round(100 * weightedScore) - penalty, 0, 100)

  return {
    anatomy,
    diagnosis,
    speed,
    perStepSpeed,
    caseSpeed,
    penalty,
    total,
    weights: effectiveWeights,
    durationSeconds:
      Number.isFinite(input.durationMs) && input.durationMs >= 0 ? input.durationMs / 1_000 : 0,
    openedClueIds,
  }
}
