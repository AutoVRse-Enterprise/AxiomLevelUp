import type { GameDifficulty, GameScoringConfig, RoundDocument } from '@/content/schema/game'
import type { AnatomyMap } from '@/content/schema/anatomyMap'
import { mechanicTemplate } from '@/engines/games/mechanics'
import {
  resolveAnswerPath,
  resolveProximityAccuracy,
  type AnatomyAnswerReference,
} from '@/engines/games/proximity'
import { evaluatePrimitive, evaluatePrimitiveTimeout } from '@/primitives/definitions'

export interface SpeedBonusInput {
  accuracy: number
  elapsedMs: number
  timeLimitSeconds: number
  timedOut: boolean
  enabled: boolean
}

export interface SpeedBonusTier {
  points: number
  label: string
}

export interface RoundScoreInput extends Omit<SpeedBonusInput, 'enabled'> {
  paidClueCount: number
  difficulty: GameDifficulty
}

export interface RoundScore {
  accuracy: number
  basePoints: number
  speedBonus: number
  clueCost: number
  points: number
  correct: boolean
}

export interface RoundAccuracyInput {
  round: RoundDocument
  response: unknown
  timedOut: boolean
  anatomyMap?: AnatomyMap
  correctAnswer?: AnatomyAnswerReference
  proximity?: GameScoringConfig['proximity']
  proximityLevelIds?: readonly string[]
}

function normalizedAccuracy(accuracy: number): number {
  return Number.isFinite(accuracy) ? Math.min(1, Math.max(0, accuracy)) : 0
}

export function resolveSpeedBonusTier(
  input: SpeedBonusInput,
  scoring: GameScoringConfig,
): SpeedBonusTier | null {
  if (
    !input.enabled ||
    input.timedOut ||
    normalizedAccuracy(input.accuracy) < scoring.minAccuracyForSpeedBonus ||
    !Number.isFinite(input.elapsedMs) ||
    input.elapsedMs < 0 ||
    !Number.isFinite(input.timeLimitSeconds) ||
    input.timeLimitSeconds <= 0
  ) {
    return null
  }

  const elapsedFraction = input.elapsedMs / (input.timeLimitSeconds * 1_000)
  const tier = scoring.speedBonuses.find(
    ({ maxFractionOfLimit }) => elapsedFraction <= maxFractionOfLimit,
  )
  return tier ? { points: tier.points, label: tier.label } : null
}

export function resolveSpeedBonus(input: SpeedBonusInput, scoring: GameScoringConfig): number {
  return resolveSpeedBonusTier(input, scoring)?.points ?? 0
}

export function clueCost(paidClueCount: number, clueCostPoints: number): number {
  if (
    !Number.isFinite(paidClueCount) ||
    paidClueCount <= 0 ||
    !Number.isFinite(clueCostPoints) ||
    clueCostPoints <= 0
  ) {
    return 0
  }

  return Math.floor(paidClueCount) * clueCostPoints
}

export function classifyRound(accuracy: number, scoring: GameScoringConfig): boolean {
  return normalizedAccuracy(accuracy) >= scoring.correctThreshold
}

export function scoreRound(input: RoundScoreInput, scoring: GameScoringConfig): RoundScore {
  const accuracy = normalizedAccuracy(input.accuracy)
  const basePoints = Math.round(scoring.roundMaxPoints * accuracy)
  const speedBonus = resolveSpeedBonus({ ...input, enabled: input.difficulty.speedBonus }, scoring)
  const paidClueCost = clueCost(input.paidClueCount, input.difficulty.clueCostPoints)

  return {
    accuracy,
    basePoints,
    speedBonus,
    clueCost: paidClueCost,
    points: Math.max(0, basePoints + speedBonus - paidClueCost),
    correct: classifyRound(accuracy, scoring),
  }
}

export function resolveRoundAccuracy(input: RoundAccuracyInput): number {
  const template = mechanicTemplate(input.round.mechanic)

  if (template.accuracySource === 'evaluator') {
    const evaluation =
      input.timedOut && template.timeoutPolicy === 'zero'
        ? evaluatePrimitiveTimeout(input.round.primitive, input.response)
        : evaluatePrimitive(input.round.primitive, input.response)
    return normalizedAccuracy(evaluation.score)
  }

  if (!input.anatomyMap || input.correctAnswer === undefined || !input.proximity) return 0

  const expected = resolveAnswerPath(input.anatomyMap, input.correctAnswer)
  const actual = resolveAnswerPath(input.anatomyMap, input.response)
  return resolveProximityAccuracy(
    input.anatomyMap,
    expected,
    actual,
    input.proximity,
    input.proximityLevelIds,
  )
}
