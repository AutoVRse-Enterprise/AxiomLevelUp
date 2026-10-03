import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { caseDocumentSchema } from '@/content/schema'
import { CaseResults } from '@/player/case/CaseResults'
import type { CaseResultPresentation } from '@/player/case/types'

const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)

function result(reviewedClueIds: string[]): CaseResultPresentation {
  return {
    caseId: caseDoc.id,
    attemptId: 'attempt-1',
    resultVersion: 7,
    breakdown: {
      anatomy: 1,
      diagnosis: 1,
      speed: 0,
      total: 100,
      durationSeconds: 90,
      openedClueIds: ['clue-context'],
    },
    stepResults: [],
    reviewedClueIds,
    evidence: { pinned: [] },
    differential: {},
    timeoutCreditApplied: false,
    completedAt: '2026-10-03T00:00:00.000Z',
  }
}

function renderResults(reviewedClueIds: string[]) {
  return render(
    <CaseResults
      caseDoc={caseDoc}
      result={result(reviewedClueIds)}
      clues={caseDoc.clues}
      starThresholds={{ one: 0, two: 75, three: 90 }}
      onCompare={vi.fn()}
      onContinue={vi.fn()}
      onReplay={vi.fn()}
    />,
  )
}

describe('case results', () => {
  it('bases missed key evidence on reviewed clues rather than opened clues', () => {
    const view = renderResults([])
    expect(screen.getByRole('heading', { name: 'Key evidence not reviewed' })).toBeVisible()
    expect(screen.getByText('Context')).toBeVisible()

    view.rerender(
      <CaseResults
        caseDoc={caseDoc}
        result={result(['clue-context'])}
        clues={caseDoc.clues}
        starThresholds={{ one: 0, two: 75, three: 90 }}
        onCompare={vi.fn()}
        onContinue={vi.fn()}
        onReplay={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('heading', { name: 'Key evidence not reviewed' }),
    ).not.toBeInTheDocument()
  })
})
