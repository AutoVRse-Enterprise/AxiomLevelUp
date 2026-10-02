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
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
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
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    stopLearningEventHandlersForTests()
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
    useOfflineLibraryStore.setState({ records: {}, hydrated: true })
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

  it('gates required uncached lesson content while offline', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    renderRoute('/learn/courses/scientific-imaging/lessons/thoracic-ct')

    expect(
      screen.getByRole('heading', { name: 'This lesson has not been downloaded' }),
    ).toBeVisible()
    expect(screen.getByText('Connect to the internet or choose an offline lesson.')).toBeVisible()
  })

  it('opens the internal showcase through the real lesson route', async () => {
    const user = userEvent.setup()
    renderRoute('/learn/courses/runtime-showcase/lessons/primitive-showcase')

    expect(screen.getByRole('heading', { name: 'Primitive Showcase' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByText('Read evidence before interpreting it')).toBeVisible()
  })

  it.each([
    {
      prerequisiteId: 'thoracic-ct',
      courseId: 'scientific-imaging',
      lessonId: 'imaging-case-practice',
      context: /67-year-old with fever/,
    },
    {
      prerequisiteId: 'endpoint-strategy',
      courseId: 'clinical-research',
      lessonId: 'trial-bias-case',
      context: /sponsor proposes an open-label/,
    },
  ])(
    'plays the configured scenario in $lessonId',
    async ({ prerequisiteId, courseId, lessonId, context }) => {
      const user = userEvent.setup()
      const prerequisite = useLearnerStore.getState().lessonProgress[prerequisiteId]
      useLearnerStore.setState((state) => ({
        lessonProgress: {
          ...state.lessonProgress,
          [prerequisiteId]: {
            ...prerequisite!,
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        },
      }))

      renderRoute(`/learn/courses/${courseId}/lessons/${lessonId}`)
      await user.click(screen.getByRole('button', { name: 'Start' }))

      expect(await screen.findByText(context)).toBeVisible()
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    },
  )

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
    expect(screen.getByText('+125')).toBeVisible()
    expect(screen.getByLabelText('0 of 3 stars')).toBeVisible()
    expect(screen.getByText('#6')).toBeVisible()
    expect(useLearnerStore.getState().challenges['daily-imaging-interpretation']).toMatchObject({
      completed: true,
      bestScore: 100,
    })
    expect(useLearnerStore.getState().xp.total).toBe(4945)
    expect(useLearnerStore.getState().mastery['image-windowing']?.score).toBe(81)
  })
})
