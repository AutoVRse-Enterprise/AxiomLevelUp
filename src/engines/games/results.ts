import type { GameMechanic, GameMessageRule, RoundDocument } from '@/content/schema/game'

export interface GameRoundResult {
  slotId: string
  roundId: string
  mechanic: GameMechanic
  correct: boolean
  points: number
  elapsedMs: number
  basePoints?: number
  speedBonus?: number
  clueCost?: number
  skipped?: boolean
}

export interface BestRoundResult {
  index: number
  slotId: string
  roundId: string
  points: number
}

export interface GameRunSummary {
  total: number
  correctCount: number
  roundCount: number
  totalSeconds: number
  bestRound: BestRoundResult | null
  difficulty: string
}

export interface RoundStripItem {
  key: string
  index: number
  slotId: string
  roundId: string
  mechanic: GameMechanic
  outcome: 'correct' | 'incorrect' | 'skipped'
  points: number
}

export interface RoundRevealViewModel {
  outcome: 'correct' | 'incorrect' | 'skipped'
  answerLine: string
  feedbackSentence: string
  points: number
  breakdown: {
    basePoints: number
    speedBonus: number
    clueCost: number
  }
}

export function summarizeRun(
  roundResults: readonly GameRoundResult[],
  difficulty: string,
): GameRunSummary {
  let total = 0
  let correctCount = 0
  let totalElapsedMs = 0
  let bestRound: BestRoundResult | null = null

  roundResults.forEach((round, index) => {
    total += round.points
    correctCount += round.correct ? 1 : 0
    totalElapsedMs += round.elapsedMs

    if (bestRound === null || round.points > bestRound.points) {
      bestRound = {
        index,
        slotId: round.slotId,
        roundId: round.roundId,
        points: round.points,
      }
    }
  })

  return {
    total,
    correctCount,
    roundCount: roundResults.length,
    totalSeconds: Math.round(totalElapsedMs / 1000),
    bestRound,
    difficulty,
  }
}

export function selectResultMessage(
  rules: readonly GameMessageRule[],
  summary: Pick<GameRunSummary, 'correctCount' | 'roundCount' | 'difficulty'>,
  lastRoundCorrect: boolean | null,
): string | null {
  const correctRatio = summary.roundCount === 0 ? 0 : summary.correctCount / summary.roundCount

  for (const rule of rules) {
    const { when } = rule
    if (when.minCorrectRatio !== undefined && correctRatio < when.minCorrectRatio) continue
    if (when.maxCorrectRatio !== undefined && correctRatio > when.maxCorrectRatio) continue
    if (when.lastRoundCorrect !== undefined && lastRoundCorrect !== when.lastRoundCorrect) continue
    if (when.difficulty !== undefined && summary.difficulty !== when.difficulty) continue
    return rule.text
  }

  return null
}

export const matchResultMessage = selectResultMessage

export function roundStrip(roundResults: readonly GameRoundResult[]): RoundStripItem[] {
  return roundResults.map((round, index) => ({
    key: `${round.slotId}:${index}:${round.roundId}`,
    index,
    slotId: round.slotId,
    roundId: round.roundId,
    mechanic: round.mechanic,
    outcome: round.skipped ? 'skipped' : round.correct ? 'correct' : 'incorrect',
    points: round.points,
  }))
}

export function revealViewModel(
  result: Pick<GameRoundResult, 'correct' | 'points'> &
    Partial<Pick<GameRoundResult, 'basePoints' | 'speedBonus' | 'clueCost' | 'skipped'>>,
  feedback: RoundDocument['feedback'],
  answerLabel: string,
): RoundRevealViewModel {
  return {
    outcome: result.skipped ? 'skipped' : result.correct ? 'correct' : 'incorrect',
    answerLine: feedback.answerTemplate.replaceAll('{answer}', answerLabel),
    feedbackSentence: result.skipped ? '' : result.correct ? feedback.correct : feedback.incorrect,
    points: result.points,
    breakdown: {
      basePoints: result.basePoints ?? result.points,
      speedBonus: result.speedBonus ?? 0,
      clueCost: result.clueCost ?? 0,
    },
  }
}
