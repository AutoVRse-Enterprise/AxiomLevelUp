import type { GameMechanic } from '@/content/schema/game'

export interface GameMechanicTemplate {
  accuracySource: 'evaluator' | 'proximity'
  timeoutPolicy: 'evaluate_draft' | 'zero'
  presentation: {
    immersive: boolean
    clueTray: boolean
    answerDrawer: boolean
    answerSurface: 'drawer' | 'replace'
  }
}

export const gameMechanicTemplates = {
  spatial_look: {
    accuracySource: 'evaluator',
    timeoutPolicy: 'evaluate_draft',
    presentation: {
      immersive: true,
      clueTray: false,
      answerDrawer: true,
      answerSurface: 'drawer',
    },
  },
  spatial_explore: {
    accuracySource: 'proximity',
    timeoutPolicy: 'evaluate_draft',
    presentation: {
      immersive: true,
      clueTray: false,
      answerDrawer: true,
      answerSurface: 'replace',
    },
  },
  spot_finding: {
    accuracySource: 'evaluator',
    timeoutPolicy: 'evaluate_draft',
    presentation: {
      immersive: true,
      clueTray: false,
      answerDrawer: false,
      answerSurface: 'replace',
    },
  },
  clinical_call: {
    accuracySource: 'evaluator',
    timeoutPolicy: 'zero',
    presentation: {
      immersive: false,
      clueTray: true,
      answerDrawer: false,
      answerSurface: 'replace',
    },
  },
} as const satisfies Record<GameMechanic, GameMechanicTemplate>

export function mechanicTemplate(mechanic: GameMechanic): GameMechanicTemplate {
  return gameMechanicTemplates[mechanic]
}
