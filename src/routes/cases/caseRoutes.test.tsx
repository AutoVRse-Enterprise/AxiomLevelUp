import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import type { ContentRegistry } from '@/content/loader'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCasePackage, offlinePackageKey } from '@/offline/package'
import { CaseAttemptPage } from '@/routes/cases/CaseAttemptPage'
import { CaseIntroPage } from '@/routes/cases/CaseIntroPage'
import { CasePlayerPage } from '@/routes/cases/CasePlayerPage'
import { useLearnerStore } from '@/state/learnerStore'
import { fixtureCase, makeCaseRegistry } from '@/test/caseFixtures'

const registry = makeCaseRegistry()
const fixtureAnatomyMap = registry.anatomyMaps[0]!
const registryWithFeaturedModel: ContentRegistry = {
  ...registry,
  anatomyMapById: new Map([
    ...registry.anatomyMapById,
    [fixtureCase.anatomyMapId, fixtureAnatomyMap] as const,
  ]),
}
const savedAttempt = {
  resultVersion: 5 as const,
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

const truthfulAttempt = {
  ...savedAttempt,
  resultVersion: 6 as const,
  attemptId: 'truthful-attempt',
  perStepSpeed: 0.2,
  caseSpeed: 0.8,
  clueCostPoints: 2,
  speedScored: true,
  timingMode: 'stopwatch' as const,
  weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
  actualAwardedXp: 30,
  actualAwardedXpSource: 'gamification_activity_result' as const,
}
const teachingAttempt = {
  ...truthfulAttempt,
  resultVersion: 7 as const,
  attemptId: 'teaching-attempt',
  speedModel: 'time_eligible' as const,
  speedEligibility: { minStepScore: 0.5, eligibleSteps: 0, totalScoredSteps: 0 },
  reviewedClueIds: ['clue-context'],
  evidence: { pinned: [{ kind: 'clue' as const, id: 'clue-context' }] },
  differential: {},
  timeoutCreditApplied: false,
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
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('model bytes', { status: 200 })),
    )
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useOfflineLibraryStore.setState({ records: {}, hydrated: true })
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    vi.unstubAllGlobals()
  })

  it('renders the configured mission, case rules and progress on case intro', () => {
    useLearnerStore.setState({
      caseProgress: {
        [fixtureCase.id]: {
          completions: 1,
          bestTotal: 88,
          lastCompletedAt: savedAttempt.completedAt,
        },
      },
      caseAttempts: { [fixtureCase.id]: [savedAttempt] },
    })

    renderCaseRoute(`/learn/cases/${fixtureCase.id}`, registryWithFeaturedModel)

    expect(screen.getByRole('heading', { name: fixtureCase.title })).toBeVisible()
    expect(screen.getByText(fixtureCase.patient.presentingComplaint)).toBeVisible()
    expect(screen.getByText(fixtureCase.mission.objective)).toBeVisible()
    expect(screen.getByText(fixtureCase.mission.role)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'How this case works' })).toBeVisible()
    expect(screen.getByText('Your first answer is scored.')).toBeVisible()
    expect(
      screen.getByText('Each optional clue costs 2 points, up to 10 points total.'),
    ).toBeVisible()
    expect(screen.getByText('Basic: untimed practice; speed is not scored.')).toBeVisible()
    expect(screen.getByText('Basic: full hints are available.')).toBeVisible()
    expect(screen.getByRole('link', { name: /Start case/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Download for offline/ })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Attempt history' })).toBeVisible()
  })

  it('prefetches the featured case exact model without claiming offline availability', async () => {
    renderCaseRoute(`/learn/cases/${fixtureCase.id}`, registryWithFeaturedModel)

    expect(await screen.findByText('3D model preloaded for this session.')).toBeVisible()
    const model = registryWithFeaturedModel.assetById.get(
      registryWithFeaturedModel.anatomyMapById.get(fixtureCase.anatomyMapId)!.modelAssetId,
    )!
    expect(fetch).toHaveBeenCalledWith(
      `${model.path}?v=${model.sha256}`,
      expect.objectContaining({ credentials: 'same-origin' }),
    )
    expect(screen.queryByText(/available offline/i)).not.toBeInTheDocument()
  })

  it('keeps the featured case start available when model prefetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network unavailable'))
    renderCaseRoute(`/learn/cases/${fixtureCase.id}`, registryWithFeaturedModel)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The 3D model could not be preloaded. You can still start the case.',
    )
    expect(screen.getByRole('link', { name: /Start case/ })).toBeVisible()
  })

  it('does not prefetch a model for an unrelated case intro', () => {
    const unrelatedRegistry = {
      ...registry,
      appConfig: {
        ...registry.appConfig,
        caseLab: {
          ...registry.appConfig.caseLab!,
          featuredCaseId: 'another-case',
        },
      },
    }

    renderCaseRoute(`/learn/cases/${fixtureCase.id}`, unrelatedRegistry)

    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByText(/3D model preloaded/i)).not.toBeInTheDocument()
  })

  it('starts the case once from the intro CTA through the route wrapper', async () => {
    const user = userEvent.setup()
    renderCaseRoute(`/learn/cases/${fixtureCase.id}`)

    await user.click(screen.getByRole('link', { name: 'Start case' }))
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Orient' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Exit activity' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Replay how this case works' })).toBeVisible()
    expect(screen.queryByRole('progressbar', { name: 'Activity progress' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Task \d+ of \d+/)).not.toBeInTheDocument()
  })

  it('blocks an undownloaded case route while offline', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/play`, registryWithFeaturedModel)

    expect(screen.getByRole('heading', { name: 'This case has not been downloaded' })).toBeVisible()
  })

  it('launches a fingerprint-matched downloaded case while offline', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    const anatomyMap = registryWithFeaturedModel.anatomyMapById.get(fixtureCase.anatomyMapId)!
    const offlinePackage = buildCasePackage(fixtureCase, anatomyMap, registryWithFeaturedModel)
    const key = offlinePackageKey(offlinePackage.kind, offlinePackage.id)
    useOfflineLibraryStore.setState({
      records: {
        [key]: {
          key,
          packageKind: 'case',
          packageId: fixtureCase.id,
          status: 'available',
          downloadedBytes: offlinePackage.totalBytes,
          totalBytes: offlinePackage.totalBytes,
          urls: offlinePackage.assets.map(({ url }) => url),
          assetUrls: {},
          fingerprint: offlinePackage.fingerprint,
          verifiedAt: new Date().toISOString(),
          error: null,
        },
      },
    })

    renderCaseRoute(`/learn/cases/${fixtureCase.id}/play`, registryWithFeaturedModel)
    expect(await screen.findByRole('heading', { name: 'Orient' })).toBeVisible()
  })

  it('renders saved results and switches to the model answer', async () => {
    const user = userEvent.setup()
    useLearnerStore.setState({
      caseProgress: {
        [fixtureCase.id]: {
          completions: 1,
          bestTotal: 88,
          lastCompletedAt: savedAttempt.completedAt,
        },
      },
      caseAttempts: { [fixtureCase.id]: [savedAttempt] },
    })
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/attempts/${savedAttempt.attemptId}`)

    expect(screen.getByText('88/100')).toBeVisible()
    await user.click(screen.getByText('Score details'))
    expect(screen.getByText(/unavailable for this legacy attempt/i)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Compare with model answer' }))
    expect(screen.getAllByText('Model answer').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'You versus the model answer' })).toBeVisible()
  })

  it('renders persisted v6 speed components and actual awarded XP without reconstruction', async () => {
    const user = userEvent.setup()
    useLearnerStore.setState({
      caseAttempts: { [fixtureCase.id]: [truthfulAttempt] },
    })
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/attempts/${truthfulAttempt.attemptId}`)

    const details = screen.getByText('Score details').closest('details')!
    await user.click(screen.getByText('Score details'))
    expect(within(details).getByText('20%')).toBeVisible()
    expect(within(details).getAllByText('80%')).toHaveLength(2)
    expect(within(details).getByText('−2 points')).toBeVisible()
    expect(screen.getByText('30 XP awarded')).toBeVisible()
    expect(screen.getByText('3:00')).toBeVisible()
  })

  it('supplies saved v7 review and evidence state to results and comparison', async () => {
    const user = userEvent.setup()
    useLearnerStore.setState({
      caseAttempts: { [fixtureCase.id]: [teachingAttempt] },
    })
    renderCaseRoute(`/learn/cases/${fixtureCase.id}/attempts/${teachingAttempt.attemptId}`)

    await user.click(screen.getByRole('button', { name: 'Compare with model answer' }))
    expect(
      screen.getByRole('heading', { name: 'Clues and spatial findings that mattered' }),
    ).toBeVisible()
    expect(screen.getByText('Reviewed')).toBeVisible()
  })

  it('handles an unknown or not-yet-configured case', () => {
    renderCaseRoute('/learn/cases/missing')
    expect(screen.getByRole('heading', { name: 'Case not found' })).toBeVisible()
  })
})
