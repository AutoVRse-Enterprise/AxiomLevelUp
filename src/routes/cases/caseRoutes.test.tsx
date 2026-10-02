import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import type { ContentRegistry } from '@/content/loader'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { CaseAttemptPage } from '@/routes/cases/CaseAttemptPage'
import { CaseIntroPage } from '@/routes/cases/CaseIntroPage'
import { CasePlayerPage } from '@/routes/cases/CasePlayerPage'
import { useLearnerStore } from '@/state/learnerStore'
import { fixtureCase, makeCaseRegistry } from '@/test/caseFixtures'

const registry = makeCaseRegistry()
const savedAttempt = {
  attemptId: 'saved-attempt',
  tier: 'foundation' as const,
  total: 88,
  anatomy: 0.8,
  diagnosis: 0.96,
  speed: 0,
  durationSeconds: 180,
  openedClueIds: ['clue-context'],
  stepResults: [],
  completedAt: '2026-10-01T10:00:00.000Z',
}

function renderCaseRoute(path: string, content: ContentRegistry = registry) {
  const router = createMemoryRouter(
    [
      { path: '/learn/cases/:caseId', element: <CaseIntroPage /> },
      { path: '/learn/cases/:caseId/play', element: <CasePlayerPage /> },
      {
        path: '/learn/cases/:caseId/attempts/:attemptId',
        element: <CaseAttemptPage />,
      },
      { path: '/learn', element: <p>Learn route</p> },
    ],
    { initialEntries: [path] },
  )
  render(
    <ContentContext.Provider value={content}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
  return router
}

describe('Case Lab routes', () => {
  beforeEach(async () => {
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
  })

  it('renders configured patient, tier rules and progress on case intro', () => {
    useLearnerStore.setState({
      caseProgress: {
        [fixtureCase.id]: { completions: 1, bestTotal: 88, lastCompletedAt: savedAttempt.completedAt },
      },
      caseAttempts: { [fixtureCase.id]: [savedAttempt] },
    })

    renderCaseRoute(`/learn/cases/${fixtureCase.id}`)

    expect(screen.getByRole('heading', { name: fixtureCase.title })).toBeVisible()
    expect(screen.getByText(fixtureCase.patient.presentingComplaint)).toBeVisible()
    expect(screen.getByText('No timer')).toBeVisible()
    expect(screen.getByRole('link', { name: /Start case/ })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Attempt history' })).toBeVisible()
  })

  it('opens the immersive case player through the route wrapper', async () => {
    const user = userEvent.setup()
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/play`)

    expect(screen.getByRole('heading', { name: fixtureCase.title })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByRole('heading', { name: 'Orient' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Exit activity' })).toBeVisible()
  })

  it('renders saved results and switches to expert comparison', async () => {
    const user = userEvent.setup()
    useLearnerStore.setState({
      caseProgress: {
        [fixtureCase.id]: { completions: 1, bestTotal: 88, lastCompletedAt: savedAttempt.completedAt },
      },
      caseAttempts: { [fixtureCase.id]: [savedAttempt] },
    })
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/attempts/${savedAttempt.attemptId}`)

    expect(screen.getByText('88 points')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByText('Attempt comparison')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Configured expert/ })).toBeVisible()
  })

  it('handles an unknown or not-yet-configured case', () => {
    renderCaseRoute('/learn/cases/missing')
    expect(screen.getByRole('heading', { name: 'Case not found' })).toBeVisible()
  })
})
