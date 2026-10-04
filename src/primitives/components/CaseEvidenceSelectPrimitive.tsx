import { useState } from 'react'

import { Button } from '@/components/ui'
import type {
  CaseEvidenceOption,
  CaseEvidenceSelectPrimitive as CaseEvidenceSelectPrimitiveConfig,
} from '@/content/schema/primitives'
import { StepActionSlot } from '@/player/StepActionSlot'
import { useCaseReasoningContext } from '@/player/case/caseReasoningContext'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'

function evidenceKey(evidence: CaseEvidenceOption) {
  return `${evidence.kind}:${evidence.id}`
}

function readEvidence(value: unknown): CaseEvidenceOption[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is CaseEvidenceOption =>
      Boolean(item) &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      ((item as CaseEvidenceOption).kind === 'clue' ||
        (item as CaseEvidenceOption).kind === 'finding') &&
      typeof (item as CaseEvidenceOption).id === 'string',
  )
}

export function CaseEvidenceSelectPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onDraftChange,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<CaseEvidenceSelectPrimitiveConfig>) {
  const caseContext = useCaseReasoningContext()
  const [draftEvidence, setDraftEvidence] = useState(() => readEvidence(draft))
  const selectedEvidence = mode === 'review' ? readEvidence(review?.response) : draftEvidence
  const selectedKeys = new Set(selectedEvidence.map(evidenceKey))
  const readOnly = disabled || mode === 'review'

  const titleFor = (evidence: CaseEvidenceOption) =>
    evidence.kind === 'clue'
      ? (caseContext?.caseDoc.clues.find(({ id }) => id === evidence.id)?.title ?? evidence.id)
      : (caseContext?.caseDoc.findings?.find(({ id }) => id === evidence.id)?.label ?? evidence.id)

  const isAvailable = (evidence: CaseEvidenceOption) =>
    evidence.kind === 'clue'
      ? (caseContext?.progress.reviewedClueIds.includes(evidence.id) ?? false)
      : (caseContext?.progress.evidence.inspectedFindingIds?.includes(evidence.id) ?? false)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (selectedEvidence.length >= primitive.content.minSelections) {
          onSubmit(selectedEvidence)
        }
      }}
    >
      <fieldset disabled={readOnly}>
        <legend className="text-title font-bold text-neutral-950">{primitive.content.prompt}</legend>
        <p className="mt-2 text-small text-neutral-600">
          Select from evidence you have reviewed or inspected.
        </p>
        <div className="mt-5 space-y-3">
          {primitive.content.evidence.map((evidence) => {
            const key = evidenceKey(evidence)
            const selected = selectedKeys.has(key)
            const available = isAvailable(evidence)
            const status = mode === 'review' ? review?.evaluation.items?.[key] : undefined
            return (
              <label
                key={key}
                className={`flex min-h-12 items-center gap-3 rounded-lg border p-4 ${
                  available || readOnly
                    ? 'border-neutral-300 bg-white'
                    : 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={readOnly || !available}
                  className="size-5 shrink-0 accent-brand-700"
                  onChange={() => {
                    const next = selected
                      ? selectedEvidence.filter((item) => evidenceKey(item) !== key)
                      : [...selectedEvidence, evidence]
                    setDraftEvidence(next)
                    onDraftChange(next)
                    onInteract({ name: 'case_evidence_selected', evidence, selected: !selected, key })
                  }}
                />
                <span className="min-w-0 flex-1 font-medium">{titleFor(evidence)}</span>
                {!available && !readOnly ? (
                  <span className="text-caption">Review first</span>
                ) : null}
                {status ? <ReviewMark status={status} /> : null}
              </label>
            )
          })}
        </div>
      </fieldset>
      {mode === 'interactive' ? (
        <StepActionSlot>
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={selectedEvidence.length < primitive.content.minSelections || disabled}
          >
            Cite evidence
          </Button>
        </StepActionSlot>
      ) : null}
    </form>
  )
}
