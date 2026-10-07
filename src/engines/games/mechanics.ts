import type { GameMechanic } from '@/content/schema/game'

export interface GameMechanicTemplate {
  accuracySource: 'evaluator' | 'proximity'
  timeoutPolicy: 'evaluate_draft' | 'zero'
  presentation: {
    immersive: boolean
    clueTray: boolean
    answerDrawer: boolean
  }
}

export const gameMechanicTemplates = {
  spatial_look: {
    accuracySource: 'proximity',
    timeoutPolicy: 'evaluate_draft',
    presentation: { immersive: true, clueTray: false, answerDrawer: true },
  },
  spatial_explore: {
    accuracySource: 'proximity',
    timeoutPolicy: 'evaluate_draft',
    presentation: { immersive: true, clueTray: false, answerDrawer: true },
  },
  spot_finding: {
    accuracySource: 'evaluator',
    timeoutPolicy: 'evaluate_draft',
    presentation: { immersive: true, clueTray: false, answerDrawer: false },
  },
  clinical_call: {
    accuracySource: 'evaluator',
    timeoutPolicy: 'zero',
    presentation: { immersive: false, clueTray: true, answerDrawer: false },
  },
} as const satisfies Record<GameMechanic, GameMechanicTemplate>

export function mechanicTemplate(mechanic: GameMechanic): GameMechanicTemplate {
  return gameMechanicTemplates[mechanic]
}
