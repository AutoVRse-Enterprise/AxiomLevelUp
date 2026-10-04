import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

export const caseConfidenceSchema = z.enum(['unlikely', 'possible', 'likely'])

const hypothesisSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
})

export const caseDifferentialPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('case_differential'),
  content: z
    .strictObject({
      prompt: z.string().trim().min(1),
      hypotheses: z.array(hypothesisSchema).min(2),
    })
    .superRefine(({ hypotheses }, context) => {
      if (new Set(hypotheses.map(({ id }) => id)).size !== hypotheses.length) {
        context.addIssue({
          code: 'custom',
          message: 'hypothesis IDs must be unique',
          path: ['hypotheses'],
        })
      }
    }),
  completion: z.strictObject({ mode: z.literal('all_rated') }),
})

export const caseEvidenceOptionSchema = z.strictObject({
  kind: z.enum(['clue', 'finding']),
  id: idSchema,
})

function evidenceKey(value: z.infer<typeof caseEvidenceOptionSchema>) {
  return `${value.kind}:${value.id}`
}

export const caseEvidenceSelectPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('case_evidence_select'),
  content: z
    .strictObject({
      prompt: z.string().trim().min(1),
      evidence: z.array(caseEvidenceOptionSchema).min(2),
      correctEvidence: z.array(caseEvidenceOptionSchema).min(1),
      minSelections: z.number().int().positive().default(1),
      explanation: z.string().trim().min(1),
    })
    .superRefine((value, context) => {
      const evidenceKeys = value.evidence.map(evidenceKey)
      const correctKeys = value.correctEvidence.map(evidenceKey)
      if (new Set(evidenceKeys).size !== evidenceKeys.length) {
        context.addIssue({ code: 'custom', message: 'evidence must be unique', path: ['evidence'] })
      }
      if (new Set(correctKeys).size !== correctKeys.length) {
        context.addIssue({
          code: 'custom',
          message: 'correctEvidence must be unique',
          path: ['correctEvidence'],
        })
      }
      if (correctKeys.some((key) => !evidenceKeys.includes(key))) {
        context.addIssue({
          code: 'custom',
          message: 'correctEvidence must reference evidence options',
          path: ['correctEvidence'],
        })
      }
      if (value.minSelections > value.evidence.length) {
        context.addIssue({
          code: 'custom',
          message: 'minSelections cannot exceed the evidence option count',
          path: ['minSelections'],
        })
      }
    }),
  completion: z.strictObject({ mode: z.literal('answer') }),
})

export type CaseConfidence = z.infer<typeof caseConfidenceSchema>
export type CaseDifferentialPrimitive = z.infer<typeof caseDifferentialPrimitiveSchema>
export type CaseEvidenceOption = z.infer<typeof caseEvidenceOptionSchema>
export type CaseEvidenceSelectPrimitive = z.infer<typeof caseEvidenceSelectPrimitiveSchema>

export const caseDifferentialContentSchema = {
  schema: caseDifferentialPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<CaseDifferentialPrimitive>

export const caseEvidenceSelectContentSchema = {
  schema: caseEvidenceSelectPrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<CaseEvidenceSelectPrimitive>
