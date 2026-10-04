import { z } from 'zod'

import type {
  CaseDifferentialPrimitive,
  CaseEvidenceOption,
  CaseEvidenceSelectPrimitive,
} from '@/content/schema/primitives'
import { caseEvidenceOptionSchema } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

function evidenceKey(value: CaseEvidenceOption) {
  return `${value.kind}:${value.id}`
}

const evidenceResponseSchema = z.array(caseEvidenceOptionSchema)

export const caseDifferentialDefinition = definePrimitive<CaseDifferentialPrimitive>({
  type: 'case_differential',
  family: 'domain',
  label: 'Update differential',
  layout: 'stacked',
  timerCompatible: false,
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.prompt,
})

export const caseEvidenceSelectDefinition = definePrimitive<CaseEvidenceSelectPrimitive>({
  type: 'case_evidence_select',
  family: 'assessment',
  label: 'Cite evidence',
  layout: 'stacked',
  timerCompatible: true,
  scored: () => true,
  evaluate: (primitive, response) => {
    const parsed = evidenceResponseSchema.safeParse(response)
    const allowedKeys = new Set(primitive.content.evidence.map(evidenceKey))
    const selectedKeys = new Set(
      parsed.success
        ? parsed.data.map(evidenceKey).filter((key) => allowedKeys.has(key))
        : [],
    )
    const correctKeys = new Set(primitive.content.correctEvidence.map(evidenceKey))
    const correctlySelected = [...selectedKeys].filter((key) => correctKeys.has(key)).length
    const incorrectlySelected = [...selectedKeys].filter((key) => !correctKeys.has(key)).length
    const score = Math.max(0, (correctlySelected - incorrectlySelected) / correctKeys.size)
    const items = Object.fromEntries(
      [...allowedKeys].map((key) => [
        key,
        selectedKeys.has(key)
          ? correctKeys.has(key)
            ? 'correct'
            : 'incorrect'
          : correctKeys.has(key)
            ? 'missed'
            : undefined,
      ]),
    ) as Record<string, 'correct' | 'incorrect' | 'missed' | undefined>

    return {
      score,
      correct: score === 1,
      explanation: primitive.content.explanation,
      items: Object.fromEntries(
        Object.entries(items).filter(
          (entry): entry is [string, 'correct' | 'incorrect' | 'missed'] =>
            entry[1] !== undefined,
        ),
      ),
    }
  },
  reviewPrompt: (primitive) => primitive.content.prompt,
})
