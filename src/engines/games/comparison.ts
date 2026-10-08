import type { GameOpponent } from '@/engines/games/runContext'

export interface GameComparison {
  outcome: 'win' | 'loss' | 'tie'
  margin: number
  opponent: GameOpponent
}

export function compareWithOpponent(score: number, opponent: GameOpponent): GameComparison {
  const margin = Math.abs(score - opponent.score)
  return {
    outcome: score > opponent.score ? 'win' : score < opponent.score ? 'loss' : 'tie',
    margin,
    opponent,
  }
}
