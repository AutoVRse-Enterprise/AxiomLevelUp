import type { TypedPrimitive, TypedPrimitiveType } from '@/content/schema/primitives'
import type { EvaluationResult } from '@/primitives/types'

export type PrimitiveFamily = 'content' | 'assessment' | 'domain'
export type PrimitiveLayout = 'stacked' | 'split'

export interface PrimitiveDefinition<P extends TypedPrimitive> {
  type: P['type']
  family: PrimitiveFamily
  label: string
  layout: PrimitiveLayout
  timerCompatible: boolean
  scored: (primitive: P) => boolean
  evaluate?: (primitive: P, response: unknown) => EvaluationResult
  reviewPrompt: (primitive: P) => string
  explorableKeys?: (primitive: P) => string[]
}

export function definePrimitive<P extends TypedPrimitive>(definition: PrimitiveDefinition<P>) {
  return definition
}

export type PrimitiveDefinitionMap = {
  [Type in TypedPrimitiveType]: PrimitiveDefinition<Extract<TypedPrimitive, { type: Type }>>
}
