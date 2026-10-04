import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { caseDocumentSchema } from '@/content/schema'
import type { CaseProgress } from '@/engines/learning/session'
import { CaseNotes } from '@/player/case/CaseNotes'

const caseDoc = caseDocumentSchema.parse({
  ...structuredClone(fixtureCaseJson),
  differential: [
    { id: 'leading', label: 'Leading hypothesis', description: 'Hidden reasoning detail.' },
    { id: 'alternative', label: 'Alternative hypothesis', description: 'Second hidden detail.' },
  ],
})

const progress: CaseProgress = {
  openedClueIds: ['clue-context'],
  reviewedClueIds: ['clue-context'],
  clueOpenContexts: {},
  stepElapsedMs: {},
  caseElapsedMs: 0,
  caseClockExpired: false,
  evidence: { pinned: [] },
  differential: {},
  differentialCheckpoints: {},
}

function renderNotes(overrides: { caseComplete?: boolean; availableClueIds?: string[] } = {}) {
  return render(
    <CaseNotes
      caseDoc={caseDoc}
      progress={progress}
      availableClueIds={overrides.availableClueIds ?? ['clue-context']}
      inspectedFindingIds={new Set(['fixture-occlusion'])}
      caseComplete={overrides.caseComplete}
      currentLocationLabel={null}
      onOpenClue={vi.fn()}
      onPinChange={vi.fn()}
      onHypothesisChange={vi.fn()}
    />,
  )
}

describe('CaseNotes', () => {
  it('shows only unlocked clues and inspected spatial findings', () => {
    renderNotes()

    expect(screen.getByText('Context')).toBeVisible()
    expect(screen.getByText('Configured lumen finding')).toBeVisible()
    expect(screen.queryByText('Configured structure region')).not.toBeInTheDocument()
  })

  it('hides hypothesis descriptions until completion', () => {
    const view = renderNotes()
    expect(screen.queryByText('Hidden reasoning detail.')).not.toBeInTheDocument()

    view.rerender(
      <CaseNotes
        caseDoc={caseDoc}
        progress={progress}
        availableClueIds={['clue-context']}
        inspectedFindingIds={new Set(['fixture-occlusion'])}
        caseComplete
        currentLocationLabel={null}
        onOpenClue={vi.fn()}
        onPinChange={vi.fn()}
        onHypothesisChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Hidden reasoning detail.')).toBeVisible()
  })
})
