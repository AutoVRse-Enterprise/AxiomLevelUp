import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { multipleChoicePrimitiveSchema } from '@/content/schema/primitives'
import { buildActivityPlan } from '@/engines/learning/plan'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import { FeedbackPanel } from '@/player/FeedbackPanel'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { MultipleChoicePrimitive } from '@/primitives/components/MultipleChoicePrimitive'
import { makeValidContentBundle, playerFixtures } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const plan = buildActivityPlan(playerFixtures.allTyped, {
  environment: 'development',
  player: registry.appConfig.product.player,
})
const primitiveSources = import.meta.glob('../primitives/components/*Primitive.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function renderPlayer() {
  const router = createMemoryRouter(
    [
      {
        path: '/play',
        element: (
          <ActivityPlayer
            plan={plan}
            previousAttempts={0}
            previousBestScore={null}
            continuePath="/done"
            exitPath="/exit"
          />
        ),
      },
      { path: '/done', element: <p>Done route</p> },
      { path: '/exit', element: <p>Exit route</p> },
    ],
    { initialEntries: ['/play'] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
  return router
}

describe('activity player', () => {
  beforeEach(async () => {
    clearEventSubscribersForTests()
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
  })

  it('executes a configured activity and emits ordered lifecycle events', async () => {
    const user = userEvent.setup()
    const events: string[] = []
    subscribeToEvents((event) => events.push(event.event))
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByText('Review the evidence before answering.')).toBeVisible()
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('radio', { name: 'Supported' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    const feedbackHeading = await screen.findByRole('heading', { name: 'Correct' })
    expect(feedbackHeading).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Supported' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Supported' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Activity complete')).toBeVisible()
    expect(screen.getAllByText('100%')).toHaveLength(2)
    expect(events).toEqual(
      expect.arrayContaining([
        'lesson_started',
        'primitive_viewed',
        'primitive_completed',
        'question_answered',
        'lesson_completed',
      ]),
    )
    expect(useActivitySessionStore.getState().session).toBeNull()
  })

  it('offers resume and restart for a stored session', async () => {
    const user = userEvent.setup()
    renderPlayer()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await waitFor(() => expect(useActivitySessionStore.getState().session?.startedAt).toBeTruthy())
    cleanup()

    renderPlayer()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeVisible()
  })

  it('confirms before leaving an in-progress activity', async () => {
    const user = userEvent.setup()
    renderPlayer()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Exit activity' }))
    expect(screen.getByRole('dialog', { name: 'Leave this activity?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Save and leave' }))
    expect(await screen.findByText('Exit route')).toBeVisible()
    expect(useActivitySessionStore.getState().session?.startedAt).toBeTruthy()
  })

  it('supports keyboard selection and submission in multiple choice', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const question = multipleChoicePrimitiveSchema.parse(plan.steps[1]!.primitive)
    render(
      <MultipleChoicePrimitive
        primitive={question}
        attempt={0}
        mode="interactive"
        draft={null}
        onInteract={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={onSubmit}
        onComplete={vi.fn()}
      />,
    )

    await user.tab()
    await user.keyboard('{ArrowDown}')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('persists primitive drafts after the debounce window', async () => {
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('radio', { name: 'Supported' }))

    expect(
      useActivitySessionStore.getState().session?.progress['fixture-question']?.draft,
    ).toBeNull()
    await waitFor(() =>
      expect(useActivitySessionStore.getState().session?.progress['fixture-question']?.draft).toBe(
        'supported',
      ),
    )
  })

  it('renders retry and continue feedback actions', () => {
    const { rerender } = render(
      <FeedbackPanel
        status="incorrect"
        message="Review the evidence."
        canRetry
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
    rerender(
      <FeedbackPanel
        status="partial"
        message="Supported."
        canRetry={false}
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Partially correct' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
  })

  it('keeps primitive modules independent from events and stores', () => {
    expect(Object.keys(primitiveSources)).toHaveLength(6)
    for (const source of Object.values(primitiveSources)) {
      expect(source).not.toMatch(/@\/events|@\/state|sessionStore|learnerStore/)
    }
  })
})
