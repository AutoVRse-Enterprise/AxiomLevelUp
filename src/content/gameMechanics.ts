import type { GameMechanic, RoundDocument } from './schema/game'

export interface GameMechanicContentRule {
  allowedPrimitiveTypes: readonly string[]
  requiresAnatomyMap: boolean
  requiresDrop: boolean
  requiresEntryAnswer: boolean
  requiresExploreType?: string
  cluePolicy: 'none' | 'optional' | 'required'
}

export const gameMechanicContentRules = {
  spatial_look: {
    allowedPrimitiveTypes: ['anatomy_locate'],
    requiresAnatomyMap: true,
    requiresDrop: true,
    requiresEntryAnswer: true,
    requiresExploreType: 'anatomy_explore',
    cluePolicy: 'none',
  },
  spatial_explore: {
    allowedPrimitiveTypes: ['anatomy_locate'],
    requiresAnatomyMap: true,
    requiresDrop: true,
    requiresEntryAnswer: true,
    requiresExploreType: 'anatomy_explore',
    cluePolicy: 'none',
  },
  spot_finding: {
    allowedPrimitiveTypes: ['image_hotspot'],
    requiresAnatomyMap: false,
    requiresDrop: false,
    requiresEntryAnswer: false,
    cluePolicy: 'optional',
  },
  clinical_call: {
    allowedPrimitiveTypes: ['multiple_choice'],
    requiresAnatomyMap: false,
    requiresDrop: false,
    requiresEntryAnswer: false,
    cluePolicy: 'required',
  },
} as const satisfies Record<GameMechanic, GameMechanicContentRule>

export function contentRuleForMechanic(mechanic: GameMechanic): GameMechanicContentRule {
  return gameMechanicContentRules[mechanic]
}

export function mechanicContentProblems(round: RoundDocument): string[] {
  const rule = contentRuleForMechanic(round.mechanic)
  const problems: string[] = []
  if (!rule.allowedPrimitiveTypes.includes(round.primitive.type)) {
    problems.push(`primitive type "${round.primitive.type}" is not allowed`)
  }
  if (rule.requiresAnatomyMap && !round.anatomyMapId) problems.push('an anatomy map is required')
  if (rule.requiresDrop && !round.drop) problems.push('a drop pool is required')
  if (
    rule.requiresEntryAnswer &&
    (round.primitive.content as { answerFrom?: unknown }).answerFrom !== 'entry'
  ) {
    problems.push('the answer must resolve from the entry waypoint')
  }
  if (rule.requiresExploreType && round.explore?.type !== rule.requiresExploreType) {
    problems.push(`an ${rule.requiresExploreType} exploration primitive is required`)
  }
  if (rule.cluePolicy === 'none' && round.clues.length > 0) problems.push('clues are not allowed')
  if (rule.cluePolicy === 'required' && round.clues.length === 0) {
    problems.push('at least one clue is required')
  }
  return problems
}
