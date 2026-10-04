import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CaseStageBoundary } from '@/engines/cases/plan'
import { StageBanner } from '@/player/case/StageBanner'

const stage: CaseStageBoundary = {
  stageId: 'orient',
  kind: 'orient',
  component: 'anatomy',
  title: 'Orient',
  purpose: 'Build a spatial frame before interpreting the evidence.',
  update: {
    timeLabel: 'Initial review',
    narrative: 'The patient describes symptoms linked to exercise.',
  },
  clueIds: [],
  startIndex: 0,
  endIndex: 1,
}

describe('StageBanner', () => {
  it('announces the stage purpose and optional patient update', () => {
    render(<StageBanner stage={stage} />)

    const banner = screen.getByRole('region', { name: 'Orient' })
    expect(banner).toHaveAttribute('aria-live', 'polite')
    expect(banner).toHaveTextContent(stage.purpose)
    expect(banner).toHaveTextContent('Initial review')
    expect(banner).toHaveTextContent('The patient describes symptoms linked to exercise.')
    expect(screen.getByRole('heading', { name: 'Orient' })).toHaveFocus()
  })

  it('moves focus to the heading when the stage changes', () => {
    const { rerender } = render(<StageBanner stage={stage} />)
    const nextStage = {
      ...stage,
      stageId: 'observe',
      kind: 'observe' as const,
      title: 'Observe',
      purpose: 'Gather the evidence that defines the pattern.',
      update: undefined,
    }

    rerender(<StageBanner stage={nextStage} />)

    expect(screen.getByRole('heading', { name: 'Observe' })).toHaveFocus()
    expect(screen.queryByText('Initial review')).not.toBeInTheDocument()
  })
})
