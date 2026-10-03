import freshSeedData from '../../public/content/seeds/fresh.json'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle, type ContentRegistry } from '@/content/loader'
import { appConfigSchema, learnerSeedSchema } from '@/content/schema'
import { clearEventSubscribersForTests, emitEvent, subscribeToEvents } from '@/events/bus'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import { useLearnerStore } from '@/state/learnerStore'
import { fixtureCase, makeCaseRegistry } from '@/test/caseFixtures'
import { makeValidContentBundle } from '@/test/contentFixtures'

import { ChallengePage } from './challenge/ChallengePage'
import { HomePage } from './home/HomePage'
import { LeaderboardPage } from './leaderboard/LeaderboardPage'
import { CoursePage } from './learn/CoursePage'
import { LearnPage } from './learn/LearnPage'
import { PathwayPage } from './learn/PathwayPage'
import { ProfilePage } from './profile/ProfilePage'

const advancedRegistry = validateContentBundle(makeValidContentBundle())
const freshSeed = learnerSeedSchema.parse(freshSeedData)

function makeQuickCaseRegistry() {
  const registry = makeCaseRegistry()
  const appConfig = appConfigSchema.parse({
    ...registry.appConfig,
    challenges: registry.appConfig.challenges.map((challenge) =>
      challenge.type === 'daily'
        ? {
            id: 'daily-quick-case',
            type: 'daily',
            title: 'Daily quick case',
            description: 'Complete one focused case.',
            estimatedMinutes: 3,
            rewardXp: 50,
            itemCount: 1,
            caseId: fixtureCase.id,
          }
        : challenge,
    ),
  })
  return { ...registry, appConfig }
}

function renderSurface(
  element: ReactNode,
  initialPath: string,
  routePath = initialPath,
  registry: ContentRegistry = advancedRegistry,
) {
  const router = createMemoryRouter(
    [
      { path: routePath, element },
      { path: 'challenge/:challengeId/play', element: <p>Challenge player</p> },
    ],
    { initialEntries: [initialPath] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
  return router
}

describe('application surfaces', () => {
  beforeEach(() => {
    stopLearningEventHandlersForTests()
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(advancedRegistry.seed)
  })

  it('renders every required Home section from configured data', () => {
    renderSurface(<HomePage />, '/')

    expect(screen.getByText(/Ready for your next discovery/)).toBeVisible()
    expect(screen.getByText('Continue learning')).toBeVisible()
    expect(screen.getByText("Today's challenge")).toBeVisible()
    expect(screen.getByText('Strengthen your knowledge')).toBeVisible()
    expect(screen.getByText('Active pathway')).toBeVisible()
    expect(screen.getByText('Recent achievements')).toBeVisible()
    expect(screen.getByText('Cohort standing')).toBeVisible()
    expect(screen.getByText('Weekly progress')).toBeVisible()
  })

  it('uses arbitrary registry course identity rather than hard-coded course copy', () => {
    const bundle = makeValidContentBundle()
    const firstCourse = bundle.courseFiles[0]?.data as { id: string; title: string }
    firstCourse.id = 'custom-course'
    firstCourse.title = 'Novel Translational Curriculum'
    const registry = validateContentBundle(bundle)

    renderSurface(<HomePage />, '/', '/', registry)
    expect(screen.getByText('Novel Translational Curriculum')).toBeVisible()
  })

  it('keeps Learn filters in URL state and supports keyboard activation', async () => {
    const user = userEvent.setup()
    const router = renderSurface(<LearnPage />, '/learn', '/learn')
    const completed = screen.getByRole('button', { name: 'Completed' })

    completed.focus()
    await user.keyboard('{Enter}')

    expect(router.state.location.search).toBe('?status=completed')
    expect(completed).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the configured featured case above Home continuation and in Learn', () => {
    const caseRegistry = makeCaseRegistry()
    renderSurface(<HomePage />, '/', '/', caseRegistry)

    const homeCase = screen.getByRole('link', { name: new RegExp(fixtureCase.title) })
    expect(homeCase).toBeVisible()
    expect(
      homeCase.compareDocumentPosition(screen.getByText('Continue learning')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    cleanup()

    renderSurface(<LearnPage />, '/learn', '/learn', caseRegistry)
    expect(screen.getByRole('link', { name: new RegExp(fixtureCase.title) })).toBeVisible()
    expect(screen.getByText('Basic')).toBeVisible()
    expect(screen.getByText('Generic')).toBeVisible()
    expect(screen.getByText('Daily')).toBeVisible()
    expect(screen.getByText('4 min')).toBeVisible()
  })

  it('labels a daily case as a case instead of questions', () => {
    const caseRegistry = makeQuickCaseRegistry()
    renderSurface(<ChallengePage />, '/challenge', '/challenge', caseRegistry)
    expect(screen.getByText('Case')).toBeVisible()
    expect(screen.queryByText('1 questions')).not.toBeInTheDocument()
    cleanup()

    renderSurface(<HomePage />, '/', '/', caseRegistry)
    expect(screen.getByText(/Case · ~3 min/)).toBeVisible()
    expect(screen.queryByText('1 questions')).not.toBeInTheDocument()
  })

  it('links a weekly challenge to its next eligible qualifying activity', () => {
    renderSurface(<ChallengePage />, '/challenge', '/challenge')

    expect(
      screen.getByRole('link', { name: 'Continue Scientific Imaging Sprint' }),
    ).toHaveAttribute('href', '/learn/courses/data-interpretation/lessons/dose-response-curves')
    expect(screen.getByText('Next: Dose-response Curves')).toBeVisible()
  })

  it('keeps internal courses off Home, Learn and Pathway surfaces', () => {
    renderSurface(<HomePage />, '/')
    expect(screen.queryByText('Runtime Primitive Showcase')).not.toBeInTheDocument()
    cleanup()

    renderSurface(<LearnPage />, '/learn', '/learn')
    expect(screen.getByText('4 courses · 12 lessons')).toBeVisible()
    expect(screen.queryByText('Runtime Primitive Showcase')).not.toBeInTheDocument()
    cleanup()

    renderSurface(
      <PathwayPage />,
      '/learn/pathways/translational-science',
      '/learn/pathways/:pathwayId',
    )
    expect(screen.queryByText('Runtime Primitive Showcase')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: /Runtime Primitive Showcase|Primitive Showcase/u,
      }),
    ).not.toBeInTheDocument()
  })

  it('shows locked lesson reasons without making locked lessons links', () => {
    renderSurface(<CoursePage />, '/learn/courses/scientific-imaging', '/learn/courses/:courseId')

    const lockedTitle = screen.getByText('Thoracic Case Practice')
    expect(lockedTitle.closest('[aria-disabled="true"]')).toBeInTheDocument()
    expect(lockedTitle.closest('a')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Complete Interpreting Thoracic CT first/)).toHaveLength(2)
  })

  it('opens a locked pathway explanation from the keyboard', async () => {
    const user = userEvent.setup()
    renderSurface(
      <PathwayPage />,
      '/learn/pathways/translational-science',
      '/learn/pathways/:pathwayId',
    )
    const locked = screen.getAllByRole('button', { name: /Show why this activity is locked/ })[0]!

    locked.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('status')).toHaveTextContent('Complete the preceding activity')
  })

  it('shows useful unknown and fresh states', () => {
    useLearnerStore.getState().replaceWithSeed(freshSeed)
    renderSurface(<CoursePage />, '/learn/courses/missing', '/learn/courses/:courseId')
    expect(screen.getByText('Course not found')).toBeVisible()
  })

  it('emits course, pathway and challenge intent events', async () => {
    const user = userEvent.setup()
    const subscriber = vi.fn()
    subscribeToEvents(subscriber)
    renderSurface(<CoursePage />, '/learn/courses/scientific-imaging', '/learn/courses/:courseId')
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'course_opened', courseId: 'scientific-imaging' }),
    )

    renderSurface(<ChallengePage />, '/challenge', '/challenge')
    await user.click(screen.getByRole('link', { name: /Start challenge/ }))
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'challenge_opened',
        challengeId: 'daily-imaging-interpretation',
      }),
    )
  })

  it('updates the visible leaderboard rank from the event-driven learner XP', () => {
    initializeLearningProgressHandlers(advancedRegistry)
    renderSurface(<LeaderboardPage />, '/leaderboard', '/leaderboard')
    expect(screen.getByText('#8')).toBeVisible()

    act(() => {
      emitEvent({ event: 'demo_command', command: 'grant_xp', amount: 600 })
    })

    expect(screen.getByText('#1')).toBeVisible()
  })

  it('switches leaderboard periods with tabs and keyboard navigation', async () => {
    const user = userEvent.setup()
    renderSurface(<LeaderboardPage />, '/leaderboard', '/leaderboard')

    const weekly = screen.getByRole('tab', { name: 'Weekly' })
    weekly.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'This month' })).toBeVisible()
    expect(screen.getByText('#9')).toBeVisible()
    expect(screen.getByText('3,180 XP')).toBeVisible()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'All time' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'All-time ranking' })).toBeVisible()
    expect(screen.getByText('#13')).toBeVisible()
    expect(screen.getByText('4,820 XP')).toBeVisible()
  })

  it('renders Profile for a fresh learner without invalid arithmetic', () => {
    useLearnerStore.getState().replaceWithSeed(freshSeed)
    renderSurface(<ProfilePage />, '/profile', '/profile')

    expect(screen.getByText('Alex Morgan')).toBeVisible()
    expect(screen.getByText('0%', { selector: '.text-title' })).toBeVisible()
    expect(screen.getByRole('contentinfo', { name: 'About Autovrse LevelUp' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Autovrse logo' })).toHaveAttribute(
      'src',
      '/brand/autovrse-logo.svg',
    )
  })
})
