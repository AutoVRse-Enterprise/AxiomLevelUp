import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CaseDocument } from '@/content/schema'
import {
  caseDifferentialPrimitiveSchema,
  caseEvidenceSelectPrimitiveSchema,
} from '@/content/schema/primitives'
import type { CaseProgress } from '@/engines/learning/session'
import { CaseReasoningProvider } from '@/player/case/reasoningContext'
import { CaseDifferentialPrimitive } from '@/primitives/components/CaseDifferentialPrimitive'
import { CaseEvidenceSelectPrimitive } from '@/primitives/components/CaseEvidenceSelectPrimitive'
import { evaluatePrimitive } from '@/primitives/definitions'

const differential = caseDifferentialPrimitiveSchema.parse({
  id: 'differential-checkpoint',
  type: 'case_differential',
  conceptIds: [],
  content: {
    prompt: 'Update the differential.',
    hypotheses: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ],
  },
  assets: [],
  completion: { mode: 'all_rated' },
  scoring: { weight: 1 },
  feedback: {},
})

const evidence = caseEvidenceSelectPrimitiveSchema.parse({
  id: 'cite-evidence',
  type: 'case_evidence_select',
  clueIds: ['history'],
  conceptIds: [],
  content: {
    prompt: 'Cite the decisive evidence.',
    evidence: [
      { kind: 'clue', id: 'history' },
      { kind: 'finding', id: 'finding' },
      { kind: 'clue', id: 'unreviewed' },
    ],
    correctEvidence: [
      { kind: 'clue', id: 'history' },
      { kind: 'finding', id: 'finding' },
    ],
    minSelections: 1,
    explanation: 'History and the inspected finding are decisive.',
  },
  assets: [],
  completion: { mode: 'answer' },
  scoring: { weight: 1 },
  feedback: {},
})

const progress: CaseProgress = {
  openedClueIds: ['history'],
  reviewedClueIds: ['history'],
  clueOpenContexts: {},
  stepElapsedMs: {},
  caseElapsedMs: 0,
  caseClockExpired: false,
  evidence: { pinned: [], inspectedFindingIds: ['finding'] },
  differential: {},
  differentialCheckpoints: {},
}

const caseDoc = {
  clues: [
    { id: 'history', title: 'History pattern' },
    { id: 'unreviewed', title: 'Unreviewed clue' },
  ],
  findings: [{ id: 'finding', label: 'Inspected airway finding' }],
} as CaseDocument

describe('Case reasoning primitives', () => {
  it('completes a differential checkpoint only after every hypothesis is rated', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onInteract = vi.fn()
    render(
      <CaseDifferentialPrimitive
        primitive={differential}
        attempt={0}
        mode="interactive"
        draft={null}
        onComplete={onComplete}
        onDraftChange={vi.fn()}
        onInteract={onInteract}
        onSubmit={vi.fn()}
      />,
    )

    await user.click(
      within(screen.getByRole('group', { name: 'Alpha' })).getByRole('button', {
        name: 'Likely',
      }),
    )
    expect(onComplete).not.toHaveBeenCalled()
    await user.click(screen.getAllByRole('button', { name: 'Unlikely' })[1]!)

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onInteract).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'case_hypothesis_rated', hypothesisId: 'beta' }),
    )
  })

  it('only permits reviewed or inspected evidence and awards partial credit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <CaseReasoningProvider caseDoc={caseDoc} progress={progress}>
        <CaseEvidenceSelectPrimitive
          primitive={evidence}
          attempt={0}
          mode="interactive"
          draft={null}
          onComplete={vi.fn()}
          onDraftChange={vi.fn()}
          onInteract={vi.fn()}
          onSubmit={onSubmit}
        />
      </CaseReasoningProvider>,
    )

    expect(screen.getByRole('checkbox', { name: /Unreviewed clue/ })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /History pattern/ }))
    await user.click(screen.getByRole('button', { name: 'Cite evidence' }))
    expect(onSubmit).toHaveBeenCalledWith([{ kind: 'clue', id: 'history' }])
    expect(evaluatePrimitive(evidence, [{ kind: 'clue', id: 'history' }]).score).toBe(0.5)
  })
})
