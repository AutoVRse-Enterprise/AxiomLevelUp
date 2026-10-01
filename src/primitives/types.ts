import type { Primitive } from '@/content/schema'

export interface PrimitiveComponentProps {
  primitive: Primitive
  attempt: number
  disabled?: boolean
  onInteract: (interaction: string) => void
  onSubmit: (response: unknown) => void
  onComplete: () => void
}

export interface EvaluationResult {
  correct: boolean
  explanation: string | null
}

export type PrimitiveEvaluator = (
  primitive: Primitive,
  response: unknown,
) => EvaluationResult
