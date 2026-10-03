import type { TypedPrimitive, TypedPrimitiveType } from '@/content/schema/primitives'
import type { EvaluationResult } from '@/primitives/types'

export type PrimitiveFamily = 'content' | 'assessment' | 'domain'
export type PrimitiveLayout = 'stacked' | 'split' | 'viewer'
export type PrimitiveTimeoutCredit = 'none' | 'committed_progress'

export interface PrimitiveDefinition<P extends TypedPrimitive> {
  type: P['type']
  family: PrimitiveFamily | ((primitive: P) => PrimitiveFamily)
  label: string
  layout: PrimitiveLayout
  timerCompatible: boolean
  timeoutCredit: PrimitiveTimeoutCredit
  scored: (primitive: P) => boolean
  evaluate?: (primitive: P, response: unknown) => EvaluationResult
  reviewPrompt: (primitive: P) => string
  explorableKeys?: (primitive: P) => string[]
}

type PrimitiveDefinitionInput<P extends TypedPrimitive> = Omit<
  PrimitiveDefinition<P>,
  'timeoutCredit'
> & {
  timeoutCredit?: PrimitiveTimeoutCredit
}

export function definePrimitive<P extends TypedPrimitive>(
  definition: PrimitiveDefinitionInput<P>,
): PrimitiveDefinition<P> {
  return { timeoutCredit: 'none', ...definition }
}

export type PrimitiveDefinitionMap = {
  [Type in TypedPrimitiveType]: PrimitiveDefinition<Extract<TypedPrimitive, { type: Type }>>
}
