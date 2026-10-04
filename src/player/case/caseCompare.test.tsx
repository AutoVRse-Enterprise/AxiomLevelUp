import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { caseDocumentSchema } from '@/content/schema'
import { CaseCompare } from '@/player/case/CaseCompare'
import type { CaseResultPresentation } from '@/player/case/types'
import { makeCaseRegistry } from '@/test/caseFixtures'

const caseDoc = caseDocumentSchema.parse({
  ...structuredClone(fixtureCaseJson),
  differential: [
    { id: 'supported', label: 'Supported hypothesis' },
    { id: 'alternative', label: 'Alternative hypothesis' },
  ],
  expertBenchmark: {
    ...fixtureCaseJson.expertBenchmark,
    responses: { ...fixtureCaseJson.expertBenchmark.responses, differential: 'supported' },
  },
})
const caseLab = makeCaseRegistry().appConfig.caseLab!
const result: CaseResultPresentation = {
  caseId: caseDoc.id,
  attemptId: 'attempt-1',
  resultVersion: 8,
  breakdown: {
    anatomy: 1,
    diagnosis: 1,
    speed: 1,
    total: 100,
    durationSeconds: 90,
    openedClueIds: ['clue-context'],
  },
  stepResults: [
    {
      primitiveId: 'identify-location',
      firstAttemptScore: 1,
      timedOut: false,
      response: 'target',
    },
  ],
  reviewedClueIds: ['clue-context'],
  evidence: { pinned: [{ kind: 'clue', id: 'clue-context' }] },
  differential: { supported: 'likely', alternative: 'unlikely' },
  differentialCheckpoints: {
    'identify-location': { supported: 'possible', alternative: 'possible' },
  },
  timeoutCreditApplied: false,
  completedAt: '2026-10-03T00:00:00.000Z',
}

describe('case comparison', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders authored teaching sections, status, and a focusable evidence anchor without raw ids', () => {
    render(
      <CaseCompare
        caseDoc={caseDoc}
        caseLab={caseLab}
        result={result}
        history={[]}
        historyLimit={10}
        evidenceAnchor="expert-evidence-0"
        onBack={vi.fn()}
        onContinue={vi.fn()}
        onReplay={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'How the model answer approached it' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Clues and spatial findings that mattered' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Differential evolution' })).toBeVisible()
    expect(screen.getAllByText('Orient: possible')).toHaveLength(2)
    expect(screen.getByText('Model answer: leading')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Step-by-step comparison' })).toBeVisible()
    expect(screen.getByText('Reviewed')).toBeVisible()
    expect(document.activeElement).toBe(document.getElementById('expert-evidence-0'))
    expect(screen.queryByText('clue-context')).not.toBeInTheDocument()
    expect(screen.queryByText('identify-location')).not.toBeInTheDocument()
    expect(
      screen.getByText('Complete this case again to compare your next result.', { exact: false }),
    ).toBeVisible()
    expect(screen.queryByText(/case state pipeline/i)).not.toBeInTheDocument()
  })
})
