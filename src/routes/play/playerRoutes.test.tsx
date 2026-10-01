import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests } from '@/events/bus'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import { ChallengePlayerPage } from '@/routes/play/ChallengePlayerPage'
import { LessonPlayerPage } from '@/routes/play/LessonPlayerPage'
import { useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

function renderRoute(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/learn/courses/:courseId/lessons/:lessonId',
        element: <LessonPlayerPage />,
      },
      { path: '/challenge/:challengeId/play', element: <ChallengePlayerPage /> },
      { path: '/challenge', element: <p>Challenges route</p> },
      { path: '/learn/courses/:courseId', element: <p>Course route</p> },
    ],
    { initialEntries: [path] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

describe('player routes', () => {
  beforeEach(async () => {
    stopLearningEventHandlersForTests()
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
  })

  it('rejects a lesson that does not belong to the selected course', () => {
    renderRoute('/learn/courses/scientific-imaging/lessons/trial-design-basics')
    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeVisible()
  })

  it('guards a lesson with unmet prerequisites', () => {
    renderRoute('/learn/courses/scientific-imaging/lessons/imaging-case-practice')
    expect(screen.getByRole('heading', { name: 'Lesson locked' })).toBeVisible()
    expect(screen.getByText(/Interpreting Thoracic CT/)).toBeVisible()
  })

  it('reports an item-less challenge as unavailable', () => {
    renderRoute('/challenge/weekly-imaging-sprint/play')
    expect(screen.getByRole('heading', { name: 'Challenge unavailable' })).toBeVisible()
  })

  it('plays the configured daily challenge and records its result', async () => {
    const user = userEvent.setup()
    initializeLearningProgressHandlers(registry)
    renderRoute('/challenge/daily-imaging-interpretation/play')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const challenge = registry.appConfig.challenges.find(
      ({ id }) => id === 'daily-imaging-interpretation',
    )!
    for (const item of challenge.items) {
      const correctId = item.content.correctOptionId
      const options = item.content.options as Array<{ id: string; label: string }>
      const correct = options.find(({ id }) => id === correctId)!
      await user.click(await screen.findByRole('radio', { name: correct.label }))
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      await user.click(await screen.findByRole('button', { name: 'Continue' }))
    }

    expect(await screen.findByText('Activity complete')).toBeVisible()
    expect(
      useLearnerStore.getState().challenges['daily-imaging-interpretation'],
    ).toMatchObject({ completed: true, bestScore: 100 })
  })
})
