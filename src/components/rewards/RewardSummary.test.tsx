import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { RewardSummary } from '@/components/rewards/RewardSummary'
import { validateContentBundle } from '@/content/loader'
import { FeedbackPanel } from '@/player/FeedbackPanel'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

describe('reward presentation', () => {
  it('shows XP, stars, mastery, rank and streak from an activity result', () => {
    render(
      <ContentContext.Provider value={registry}>
        <RewardSummary
          result={{
            activityKind: 'lesson',
            activityId: 'lesson-one',
            xpEarned: 135,
            stars: 3,
            masteryDelta: { imaging: 4 },
            rankBefore: 8,
            rankAfter: 6,
            badgesUnlocked: ['perfect-lesson'],
            levelFrom: 2,
            levelTo: 2,
            streak: 4,
            revision: false,
          }}
        />
      </ContentContext.Provider>,
    )
    expect(screen.getByText('Final value: +135')).toBeInTheDocument()
    expect(screen.getByLabelText('3 of 3 stars')).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeVisible()
    expect(screen.getByText('#6')).toBeVisible()
    expect(screen.getByText(/4 day streak/)).toBeVisible()
  })

  it('announces awarded question XP with answer feedback', () => {
    render(
      <FeedbackPanel
        status="correct"
        message="Well done."
        canRetry={false}
        xpEarned={10}
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByText('Final value: +10')).toBeInTheDocument()
  })
})
