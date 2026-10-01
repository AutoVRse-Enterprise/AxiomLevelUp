import type { ZodType } from 'zod'

import type { Primitive } from '@/content/schema'
import {
  primitiveContentSchemas,
  type TypedPrimitive,
  type TypedPrimitiveType,
} from '@/content/schema/primitives'
import { imageDefinition } from '@/primitives/definitions/image'
import { multipleChoiceDefinition } from '@/primitives/definitions/multipleChoice'
import { multipleSelectDefinition } from '@/primitives/definitions/multipleSelect'
import { richTextDefinition } from '@/primitives/definitions/richText'
import { trueFalseDefinition } from '@/primitives/definitions/trueFalse'
import type { PrimitiveDefinition, PrimitiveDefinitionMap } from '@/primitives/definitions/types'
import type { EvaluationResult } from '@/primitives/types'

export * from '@/primitives/definitions/types'

export const primitiveDefinitions = {
  rich_text: richTextDefinition,
  image: imageDefinition,
  multiple_choice: multipleChoiceDefinition,
  multiple_select: multipleSelectDefinition,
  true_false: trueFalseDefinition,
} satisfies PrimitiveDefinitionMap

export function isSupportedPrimitiveType(type: string): type is TypedPrimitiveType {
  return type in primitiveDefinitions
}

export interface ResolvedPrimitiveDefinition {
  primitive: TypedPrimitive
  definition: PrimitiveDefinition<TypedPrimitive>
}

export function resolvePrimitiveDefinition(
  primitive: Primitive,
): ResolvedPrimitiveDefinition | null {
  if (!isSupportedPrimitiveType(primitive.type)) return null

  const schema = primitiveContentSchemas[primitive.type].schema as ZodType<TypedPrimitive>
  const parsed = schema.safeParse(primitive)
  if (!parsed.success) return null

  return {
    primitive: parsed.data,
    definition: primitiveDefinitions[primitive.type] as PrimitiveDefinition<TypedPrimitive>,
  }
}

export function evaluatePrimitive(primitive: Primitive, response: unknown): EvaluationResult {
  const resolved = resolvePrimitiveDefinition(primitive)
  const evaluation = resolved?.definition.evaluate?.(resolved.primitive, response)
  const score =
    evaluation && Number.isFinite(evaluation.score) ? Math.min(1, Math.max(0, evaluation.score)) : 0

  return {
    ...evaluation,
    score,
    correct: score === 1,
    explanation: evaluation?.explanation ?? null,
  }
}
