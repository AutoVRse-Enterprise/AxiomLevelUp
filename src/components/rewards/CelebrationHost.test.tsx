import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { CelebrationHost } from '@/components/rewards/CelebrationHost'
import { validateContentBundle } from '@/content/loader'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { learnerDataSnapshot, useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

describe('CelebrationHost', () => {
  beforeEach(() => {
    clearEventSubscribersForTests()
    useActivitySessionStore.getState().clear()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
  })

  it('presents and dismisses a badge celebration accessibly', async () => {
    const user = userEvent.setup()
    const state = learnerDataSnapshot(useLearnerStore.getState())
    state.gamification.celebrations = [
      {
        id: 'badge-perfect',
        type: 'badge',
        badgeId: 'perfect-lesson',
        rewardXp: 30,
      },
    ]
    useLearnerStore.getState().applyEventState(state)
    const subscriber = vi.fn()
    subscribeToEvents(subscriber)

    render(
      <ContentContext.Provider value={registry}>
        <CelebrationHost />
      </ContentContext.Provider>,
    )

    expect(screen.getByRole('dialog', { name: 'Perfect Lesson' })).toBeVisible()
    expect(screen.getByText('+30 XP bonus')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'celebration_dismissed',
        celebrationId: 'badge-perfect',
      }),
    )
  })
})
