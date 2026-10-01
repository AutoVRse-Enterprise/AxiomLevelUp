import type { Primitive } from '@/content/schema'

export interface PrimitiveComponentProps<P extends Primitive = Primitive> {
  primitive: P
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
