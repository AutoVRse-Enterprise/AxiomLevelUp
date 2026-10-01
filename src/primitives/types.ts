import type { Primitive } from '@/content/schema'

export type PrimitiveInteraction =
  | { name: string; key?: string }
  | { name: 'media_progress'; fraction: number }
  | {
      name: 'scenario_decision'
      nodeId: string
      choiceId: string
      decisionIndex: number
    }

export interface PrimitiveComponentProps<P extends Primitive = Primitive> {
  primitive: P
  attempt: number
  mode: 'interactive' | 'review'
  review?: {
    response: unknown
    evaluation: EvaluationResult
    revealAnswer: boolean
  }
  draft: unknown
  disabled?: boolean
  onInteract: (interaction: PrimitiveInteraction) => void
  onDraftChange: (draft: unknown) => void
  onSubmit: (response: unknown) => void
  onComplete: () => void
}

export interface EvaluationResult {
  score: number
  correct: boolean
  explanation: string | null
  items?: Record<string, 'correct' | 'incorrect' | 'missed'>
}
