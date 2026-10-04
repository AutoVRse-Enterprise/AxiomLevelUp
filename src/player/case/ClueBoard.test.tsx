import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { caseDocumentSchema } from '@/content/schema'
import { ClueBoard } from '@/player/case/ClueBoard'

const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
const essentialClue = caseDoc.clues[0]!
const optionalClue = { ...essentialClue, id: 'optional-clue', title: 'Optional context', essential: false }
const categoryLabels = new Map([['evidence', 'Evidence']])

function props(overrides: Record<string, unknown> = {}) {
  return {
    clues: [essentialClue, optionalClue],
    caseClueCount: 2,
    availableClueCount: 2,
    categoryLabels,
    openedClueIds: [],
    reviewedClueIds: [],
    selectedClueId: null,
    presenterOpen: true,
    labelEssentialClues: false,
    relevantClueIds: [essentialClue.id],
    optionalClueCost: 2,
    clueReview: { minVisibleMs: 1_200, mediaProgressThreshold: 0.8 },
    variant: 'desktop' as const,
    onPresentClue: vi.fn(),
    onReviewClue: vi.fn(),
    onPresenterOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('ClueBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows status, cost and current-question relevance at the decision point', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    render(<ClueBoard {...props()} />)

    expect(screen.getByText('0 of 2 reviewed')).toBeVisible()
    expect(screen.getAllByText('New')).toHaveLength(2)
    expect(screen.getByText('Free')).toBeVisible()
    expect(screen.getByText('−2 pts')).toBeVisible()
    expect(screen.getByText('Relevant to this question')).toBeVisible()
  })

  it('confirms once before opening the first optional clue', async () => {
    const user = userEvent.setup()
    const onPresentClue = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    render(<ClueBoard {...props({ onPresentClue })} />)

    await user.click(screen.getByRole('button', { name: /Optional context/ }))
    expect(onPresentClue).not.toHaveBeenCalled()
    expect(screen.getByText('Open this optional clue for −2 points?')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Open clue' }))
    expect(onPresentClue).toHaveBeenCalledWith('optional-clue')
  })

  it('announces evidence unlocked by a later stage', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const view = render(<ClueBoard {...props({ clues: [essentialClue], caseClueCount: 2 })} />)

    view.rerender(<ClueBoard {...props()} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 new evidence item is available.')
  })
})
