import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import { useEventLogStore } from '@/events/eventLogStore'
import { DevPage } from '@/routes/dev/DevPage'
import { useLearnerStore } from '@/state/learnerStore'
import { validateContentBundle } from '@/content/loader'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

describe('DevPage reward simulations', () => {
  beforeEach(() => {
    clearEventSubscribersForTests()
    useEventLogStore.getState().clear()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
  })

  it('emits typed demo commands for every Phase 5 tool', async () => {
    const user = userEvent.setup()
    const subscriber = vi.fn()
    subscribeToEvents(subscriber)
    render(
      <MemoryRouter>
        <DevPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Grant 10 XP' }))
    await user.click(screen.getByRole('button', { name: 'Unlock all' }))
    await user.click(screen.getByRole('button', { name: 'Simulate badge' }))
    await user.click(screen.getByRole('button', { name: 'Simulate level-up' }))

    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'demo_command', command: 'grant_xp', amount: 10 }),
    )
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'demo_command', command: 'unlock_all' }),
    )
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'demo_command', command: 'simulate_badge' }),
    )
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'demo_command', command: 'simulate_level_up' }),
    )
  })
})
