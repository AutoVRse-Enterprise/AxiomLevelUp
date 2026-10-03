import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle, type ContentRegistry } from '@/content/loader'
import { appConfigSchema } from '@/content/schema'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import { ChallengePlayerPage } from '@/routes/play/ChallengePlayerPage'
import { LessonPlayerPage } from '@/routes/play/LessonPlayerPage'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { useLearnerStore } from '@/state/learnerStore'
import { fixtureCase, makeCaseRegistry } from '@/test/caseFixtures'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

function makeQuickCaseRegistry() {
  const caseRegistry = makeCaseRegistry()
  const appConfig = appConfigSchema.parse({
    ...caseRegistry.appConfig,
    challenges: [
      ...caseRegistry.appConfig.challenges,
      {
        id: 'daily-quick-case',
        type: 'daily',
        title: 'Daily quick case',
        description: 'Complete one focused case.',
        estimatedMinutes: 3,
        rewardXp: 50,
        itemCount: 1,
        caseId: fixtureCase.id,
      },
    ],
  })
  return { ...caseRegistry, appConfig }
}

function renderRoute(path: string, content: ContentRegistry = registry) {
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
    <ContentContext.Provider value={content}>
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
    expect(screen.getByRole('heading', { name: 'Weekly goal' })).toBeVisible()
    expect(
      screen.getByText('Continue this goal through its linked learning activities.'),
    ).toBeVisible()
  })

  it('plays the configured daily challenge and records its result', async () => {
    const user = userEvent.setup()
    initializeLearningProgressHandlers(registry)
    renderRoute('/challenge/daily-imaging-interpretation/play')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    const challenge = registry.appConfig.challenges.find(
      ({ id }) => id === 'daily-imaging-interpretation',
    )!
    if (!challenge.items) throw new Error('Expected an item-backed challenge fixture.')
    for (const item of challenge.items) {
      const correctId = item.content.correctOptionId
      const options = item.content.options as Array<{ id: string; label: string }>
      const correct = options.find(({ id }) => id === correctId)!
      await user.click(await screen.findByRole('radio', { name: correct.label }))
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      await user.click(await screen.findByRole('button', { name: 'Continue' }))
    }

    expect(await screen.findByText('Activity complete')).toBeVisible()
    expect(screen.getByText('125 XP awarded')).toBeVisible()
    expect(screen.getByLabelText('0 of 3 stars')).toBeVisible()
    expect(screen.getByText('#6')).toBeVisible()
    expect(useLearnerStore.getState().challenges['daily-imaging-interpretation']).toMatchObject({
      completed: true,
      bestScore: 100,
    })
    expect(useLearnerStore.getState().xp.total).toBe(4945)
    expect(useLearnerStore.getState().mastery['image-windowing']?.score).toBe(81)
  })

  it('shows the current daily case attempt exactly once when persisted history already contains it', async () => {
    const user = userEvent.setup()
    const quickCaseRegistry = makeQuickCaseRegistry()
    const events: LearnerEvent[] = []
    useLearnerStore.getState().replaceWithSeed(quickCaseRegistry.seed)
    useLearnerStore.setState({
      caseProgress: {
        [fixtureCase.id]: {
          completions: 2,
          bestTotal: 88,
          lastCompletedAt: '2026-10-02T00:00:00.000Z',
        },
      },
      caseAttempts: {
        [fixtureCase.id]: [
          {
            resultVersion: 5,
            attemptId: 'prior-attempt',
            tier: 'foundation',
            total: 88,
            anatomy: 0.8,
            diagnosis: 0.96,
            speed: 0,
            durationSeconds: 180,
            openedClueIds: [],
            stepResults: [],
            completedAt: '2026-10-02T00:00:00.000Z',
          },
        ],
      },
    })
    initializeLearningProgressHandlers(quickCaseRegistry)
    subscribeToEvents((event) => events.push(event))
    renderRoute('/challenge/daily-quick-case/play', quickCaseRegistry)

    expect(screen.getByRole('heading', { name: fixtureCase.title })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'case_started',
        caseId: fixtureCase.id,
        attempt: 3,
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    await user.click(await screen.findByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    await user.click(await screen.findByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Case complete')).toBeVisible()
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'challenge_completed',
        challengeId: 'daily-quick-case',
      }),
    )
    expect(useLearnerStore.getState().challenges['daily-quick-case']).toMatchObject({
      completed: true,
      bestScore: 100,
    })
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByRole('heading', { name: 'Your history' })).toBeVisible()
    expect(screen.getByText('88/100')).toBeVisible()
    const history = screen.getByRole('list', { name: 'Recent case attempts' })
    expect(within(history).getAllByRole('listitem')).toHaveLength(2)
    expect(within(history).getAllByText('Current')).toHaveLength(1)
    expect(within(history).getAllByText('100/100')).toHaveLength(1)
  })
})
