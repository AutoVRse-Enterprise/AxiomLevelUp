import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import type { AnatomyViewerProps } from '@/anatomy3d/viewer/AnatomyViewer'
import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import {
  appConfigSchema,
  caseDocumentSchema,
  type AppConfig,
  type CaseDocument,
} from '@/content/schema'
import { buildCasePlan } from '@/engines/cases/plan'
import { createActivitySession, sessionReducer } from '@/engines/learning/session'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import { CasePlayer, type CasePlayerProps } from '@/player/case/CasePlayer'
import { makeValidContentBundle } from '@/test/contentFixtures'

vi.mock('@/anatomy3d/viewer/AnatomyViewer', () => ({
  AnatomyViewer: (props: AnatomyViewerProps) => {
    const structureId = props.map.structures[0]?.id
    return (
      <button
        type="button"
        onClick={() => {
          if (structureId) props.onStructureSelected?.(structureId)
        }}
      >
        Explore anatomy
      </button>
    )
  },
}))

const baseRegistry = validateContentBundle(makeValidContentBundle())

function caseConfig(timing: 'none' | 'stopwatch' | 'countdown' = 'stopwatch'): AppConfig {
  return appConfigSchema.parse({
    ...structuredClone(baseRegistry.appConfig),
    caseLab: {
      title: 'Case Lab',
      featuredCaseId: 'case-contract-fixture',
      caseIds: ['case-contract-fixture'],
      dailyQuickCaseId: 'case-contract-fixture',
      clueCategories: [{ id: 'evidence', label: 'Evidence' }],
      clueReview: { minVisibleMs: 1_200, mediaProgressThreshold: 0.8 },
      tiers: {
        foundation: {
          label: 'Basic',
          timing,
          hints: 'full',
          labelEssentialClues: true,
        },
        intermediate: {
          label: 'Intermediate',
          timing: 'stopwatch',
          hints: 'full',
          labelEssentialClues: true,
        },
        advanced: {
          label: 'Advanced',
          timing: 'countdown',
          hints: 'reduced',
          labelEssentialClues: false,
        },
      },
      scoring: {
        weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
        speedBlend: { perStep: 0.5, perCase: 0.5 },
        defaultStepTargetSeconds: 20,
        defaultStepMaxSeconds: 90,
        cluePenalty: { perOptionalClue: 2, cap: 10 },
      },
      xp: { caseComplete: 100, perfectCaseBonus: 40 },
      historyLimit: 10,
    },
  })
}

function renderCase(
  caseDoc: CaseDocument,
  config: AppConfig,
  callbacks: Pick<CasePlayerProps, 'onComplete' | 'onClueOpened'> = {},
) {
  const registry = { ...baseRegistry, appConfig: config }
  const router = createMemoryRouter(
    [
      {
        path: '/case',
        element: (
          <CasePlayer
            caseDoc={caseDoc}
            config={config}
            previousAttempts={0}
            previousBestScore={null}
            continuePath="/done"
            exitPath="/exit"
            onComplete={callbacks.onComplete}
            onClueOpened={callbacks.onClueOpened}
          />
        ),
      },
      { path: '/done', element: <p>Case Lab route</p> },
      { path: '/exit', element: <p>Exit route</p> },
    ],
    { initialEntries: ['/case'] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
  return router
}

function setMobileViewport(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('case player integration', () => {
  beforeEach(async () => {
    cleanup()
    setMobileViewport(false)
    clearEventSubscribersForTests()
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('plays a configured case through results and expert comparison', async () => {
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const config = caseConfig('none')
    const onComplete = vi.fn()
    const onClueOpened = vi.fn()
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, config, { onComplete, onClueOpened })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    const firstStageDialog = screen.getByRole('dialog', { name: 'Orient' })
    expect(firstStageDialog).toBeVisible()
    await user.click(within(firstStageDialog).getByRole('button', { name: 'Begin stage' }))
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Case elapsed time; speed is not scored/)
    expect(screen.getByText('Task 1 of 1')).toBeVisible()
    expect(screen.queryByRole('progressbar', { name: 'Activity progress' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Open clue board.*Case: 0\/1 reviewed/ }))
    await user.click(screen.getByRole('button', { name: /Context/ }))
    expect(onClueOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        clueId: 'clue-context',
        essential: true,
        context: 'browse',
        beforeResponse: true,
      }),
    )

    await user.click(await screen.findByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Conclude')
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    expect(screen.queryByText('Context')).not.toBeInTheDocument()

    await user.click(await screen.findByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Case complete')).toBeVisible()
    expect(screen.getByText('100/100')).toBeVisible()
    expect(screen.getByLabelText('3 of 3 stars')).toBeVisible()
    expect(screen.getAllByText('50% weight · 50 points')).toHaveLength(2)
    expect(screen.getByText('−0 points')).toBeVisible()
    expect(screen.getByText(/first submitted response/i)).toBeVisible()
    expect(
      screen.getByText(/First-attempt scores of 50% or higher are eligible \(2\/2 steps\)/i),
    ).toBeVisible()
    expect(screen.queryByText('100 completion XP')).not.toBeInTheDocument()
    expect(screen.getAllByText('Not scored')).toHaveLength(3)
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'case-contract-fixture',
        breakdown: expect.objectContaining({ anatomy: 1, diagnosis: 1, total: 100 }),
      }),
    )
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'case_opened', caseId: caseDoc.id }),
        expect.objectContaining({
          event: 'case_started',
          caseId: caseDoc.id,
          attempt: 1,
          resumed: false,
        }),
        expect.objectContaining({
          event: 'question_answered',
          activityKind: 'case',
          activityId: caseDoc.id,
        }),
        expect.objectContaining({
          event: 'case_stage_completed',
          caseId: caseDoc.id,
          stageId: 'stage-diagnose',
          stageIndex: 1,
        }),
        expect.objectContaining({
          event: 'case_completed',
          caseId: caseDoc.id,
          attemptId: expect.any(String),
          tier: 'foundation',
          breakdown: expect.objectContaining({ total: 100 }),
        }),
      ]),
    )

    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByText('Attempt comparison')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Configured expert/ })).toBeVisible()
    expect(
      screen.getByText('The configured evidence localizes the target structure.'),
    ).toBeVisible()
    expect(screen.getByText(/first recorded attempt/i)).toBeVisible()
  })

  it('completes unscored anatomy exploration without timing, scoring or comparing it', async () => {
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      entry: { mode: 'overview_marker', markerStructureId: 'respiratory-system' },
      stages: fixtureCaseJson.stages.map((stage, index) =>
        index === 0
          ? {
              ...stage,
              steps: [
                {
                  id: 'explore-airway',
                  type: 'anatomy_explore',
                  conceptIds: ['thoracic-imaging'],
                  content: {
                    anatomyMapId: 'lung-map',
                    prompt: 'Explore the airway before answering.',
                    startView: { mode: 'overview' },
                    navigation: 'orbit',
                    requiredStructureIds: ['respiratory-system'],
                  },
                  assets: [],
                  completion: { mode: 'explored' },
                  scoring: { weight: 100 },
                  feedback: {},
                },
                ...stage.steps,
              ],
            }
          : stage,
      ),
      expertBenchmark: {
        ...fixtureCaseJson.expertBenchmark,
        responses: {
          'explore-airway': { selectedStructureIds: ['respiratory-system'] },
          ...fixtureCaseJson.expertBenchmark.responses,
        },
      },
    })
    const onComplete = vi.fn()
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, caseConfig('stopwatch'), { onComplete })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    expect(screen.getAllByRole('timer')).toHaveLength(1)
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Case elapsed time/)
    await user.click(await screen.findByRole('button', { name: 'Explore anatomy' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await user.click(await screen.findByRole('radio', { name: 'Other structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await user.click(screen.getByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))

    await user.click(await screen.findByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    const result = onComplete.mock.calls[0]![0]
    expect(result.breakdown).toMatchObject({
      anatomy: 0,
      diagnosis: 1,
      perStepSpeed: 1,
      speedEligibility: { minStepScore: 0.5, eligibleSteps: 1, totalScoredSteps: 2 },
    })
    expect(result.stepResults).toEqual([
      expect.objectContaining({
        primitiveId: 'identify-location',
        firstAttemptScore: 0,
        response: 'other',
      }),
      expect.objectContaining({
        primitiveId: 'select-conclusion',
        firstAttemptScore: 1,
        response: true,
      }),
    ])
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'primitive_completed',
          primitiveId: 'explore-airway',
        }),
        expect.objectContaining({
          event: 'case_completed',
          stepResults: result.stepResults,
        }),
      ]),
    )

    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByText('Which configured location is highlighted?')).toBeVisible()
    expect(screen.getByText('The configured evidence supports the conclusion.')).toBeVisible()
    expect(screen.queryByText('explore-airway')).not.toBeInTheDocument()
  })

  it('shows the first stage intro and pauses both clocks for blocking dialogs', async () => {
    vi.useFakeTimers()
    setMobileViewport(true)
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      stages: fixtureCaseJson.stages.map((stage, index) =>
        index === 0
          ? {
              ...stage,
              intro: 'Review the stage goal before starting.',
              steps: stage.steps.map((step) => ({
                ...step,
                timer: { durationSeconds: 3, mode: 'countdown' },
              })),
            }
          : stage,
      ),
    })
    renderCase(caseDoc, caseConfig('countdown'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await act(async () => Promise.resolve())
    const stageDialog = screen.getByRole('dialog', { name: 'Orient' })
    expect(stageDialog).toHaveTextContent('Review the stage goal before starting.')
    expect(within(stageDialog).getByRole('button', { name: 'Begin stage' })).toHaveFocus()
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:03' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 5:00')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:03' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 5:00')).toBeInTheDocument()

    fireEvent.click(within(stageDialog).getByRole('button', { name: 'Begin stage' }))
    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:02' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 4:59')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Clues.*Case: 0\/1 reviewed/ }))
    await act(async () => Promise.resolve())
    expect(screen.getByRole('dialog', { name: 'Clue board' })).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:02' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 4:59')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await act(() => vi.advanceTimersByTimeAsync(2_000))
    expect(useActivitySessionStore.getState().session?.progress['identify-location']).toMatchObject(
      {
        firstTimedOut: true,
      },
    )
  })

  it('persists actual elapsed duration after the case countdown expires', async () => {
    vi.useFakeTimers()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      timing: { caseTargetSeconds: 1, caseMaxSeconds: 3 },
    })
    renderCase(caseDoc, caseConfig('countdown'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await act(async () => Promise.resolve())
    fireEvent.click(screen.getByRole('button', { name: 'Begin stage' }))
    await act(() => vi.advanceTimersByTimeAsync(5_000))

    expect(screen.getByRole('timer', { name: 'Case time remaining: 0:00' })).toBeVisible()
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      caseElapsedMs: 5_000,
      caseClockExpired: true,
    })
  })

  it('restores the current stage, reviewed clues and active case clock', async () => {
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      stages: fixtureCaseJson.stages.map((stage) =>
        stage.id === 'stage-diagnose' ? { ...stage, clueIds: ['clue-context'] } : stage,
      ),
    })
    const config = caseConfig('stopwatch')
    const plan = buildCasePlan(caseDoc, config)
    let session = createActivitySession(plan)
    session = sessionReducer(session, { type: 'start', at: '2026-10-03T00:00:00.000Z' })
    session = sessionReducer(session, {
      type: 'submit',
      primitiveId: 'identify-location',
      response: 'target',
      score: 1,
      completed: true,
    })
    session = sessionReducer(session, { type: 'continue', stepCount: plan.steps.length })
    useActivitySessionStore.getState().save({
      ...session,
      caseProgress: {
        openedClueIds: ['clue-context'],
        reviewedClueIds: ['clue-context'],
        clueOpenContexts: {
          'clue-context': { context: 'browse', beforeResponse: true },
        },
        stepElapsedMs: { 'identify-location': 2_500 },
        caseElapsedMs: 4_200,
        caseClockExpired: false,
        evidence: { pinned: [] },
        differential: {},
      },
    })

    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, config)
    await user.click(screen.getByRole('button', { name: 'Resume' }))

    expect(screen.queryByRole('dialog', { name: 'Conclude' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Conclude' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: /Open clue board.*Case: 1\/1 reviewed/ }),
    ).toBeVisible()
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Case elapsed time: 0:0[5-6]/)
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
      reviewedClueIds: ['clue-context'],
      caseElapsedMs: expect.any(Number),
    })
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'case_started',
        attempt: 1,
        resumed: true,
        tier: 'foundation',
      }),
    )
  })

  it('reviews a static clue only after its configured visible dwell and emits once', async () => {
    vi.useFakeTimers()
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, caseConfig('none'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin stage' }))
    fireEvent.click(
      screen.getByRole('button', { name: /Open clue board.*Available this stage: 1/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Context.*Unopened/ }))

    expect(screen.getByText('Case: 0/1 reviewed')).toBeVisible()
    expect(screen.getByText('Available this stage: 1')).toBeVisible()
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
      reviewedClueIds: [],
    })
    expect(events.filter(({ event }) => event === 'case_clue_reviewed')).toHaveLength(0)

    await act(() => vi.advanceTimersByTimeAsync(1_199))
    expect(events.filter(({ event }) => event === 'case_clue_reviewed')).toHaveLength(0)
    await act(() => vi.advanceTimersByTimeAsync(1))

    expect(useActivitySessionStore.getState().session?.caseProgress?.reviewedClueIds).toEqual([
      'clue-context',
    ])
    expect(events.filter(({ event }) => event === 'case_clue_reviewed')).toEqual([
      expect.objectContaining({
        event: 'case_clue_reviewed',
        clueId: 'clue-context',
        method: 'dwell',
        stageId: 'stage-orient',
      }),
    ])
    expect(screen.getByText('Case: 1/1 reviewed')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close clues' }))
    fireEvent.click(screen.getByRole('button', { name: /Open clue board.*Case: 1\/1 reviewed/ }))
    fireEvent.click(screen.getByRole('button', { name: /Context.*Reviewed/ }))
    await act(() => vi.advanceTimersByTimeAsync(1_200))
    expect(events.filter(({ event }) => event === 'case_clue_reviewed')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Close clues' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Target structure' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin stage' }))
    expect(
      screen.getByRole('button', {
        name: /Open clue board.*Case: 1\/1 reviewed.*Available this stage: 0/,
      }),
    ).toBeVisible()
  })

  it('hides clue importance labels for the advanced tier', () => {
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      tier: 'advanced',
      clues: fixtureCaseJson.clues.map((clue) => ({ ...clue, essential: false })),
    })
    renderCase(caseDoc, caseConfig('countdown'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin stage' }))
    fireEvent.click(screen.getByRole('button', { name: /Open clue board/ }))

    expect(screen.getByRole('button', { name: /Context.*Unopened/ })).toBeVisible()
    expect(screen.queryByText(/Optional|Recommended/)).not.toBeInTheDocument()
  })

  it('visibly presents configured clue-first evidence on mobile and records it once', async () => {
    setMobileViewport(true)
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      entry: { mode: 'clue_first', clueId: 'clue-context' },
    })
    const onClueOpened = vi.fn()
    renderCase(caseDoc, caseConfig('none'), { onClueOpened })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('dialog', { name: 'Orient' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    expect(screen.getByRole('dialog', { name: 'Context' })).toBeVisible()
    await waitFor(() =>
      expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
        openedClueIds: ['clue-context'],
        clueOpenContexts: {
          'clue-context': { context: 'entry', beforeResponse: true },
        },
      }),
    )
    expect(onClueOpened).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: /Clues.*Case: 0\/1 reviewed/ }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Context' })).getByRole('button', {
        name: /Context.*Opened/,
      }),
    )
    expect(onClueOpened).toHaveBeenCalledTimes(1)
  })

  it('opens the mobile clue list without selecting or recording a clue', async () => {
    setMobileViewport(true)
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const onClueOpened = vi.fn()
    renderCase(caseDoc, caseConfig('none'), { onClueOpened })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    await user.click(screen.getByRole('button', { name: /Clues.*Case: 0\/1 reviewed/ }))

    expect(screen.getByRole('dialog', { name: 'Clue board' })).toBeVisible()
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: [],
      clueOpenContexts: {},
    })
    expect(onClueOpened).not.toHaveBeenCalled()
  })

  it('opens feedback remediation on mobile once without adding a clue penalty', async () => {
    setMobileViewport(true)
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      clues: fixtureCaseJson.clues.map((clue) => ({ ...clue, essential: false })),
    })
    const onClueOpened = vi.fn()
    const onComplete = vi.fn()
    renderCase(caseDoc, caseConfig('none'), { onClueOpened, onComplete })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    await user.click(screen.getByRole('radio', { name: 'Other structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Reopen clue: Context' }))

    expect(screen.getByRole('dialog', { name: 'Context' })).toBeVisible()
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
      clueOpenContexts: {
        'clue-context': { context: 'remediation', beforeResponse: false },
      },
    })
    expect(onClueOpened).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Reopen clue: Context' }))
    expect(onClueOpened).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await user.click(screen.getByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))
    await user.click(screen.getByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(onComplete.mock.calls[0]![0].breakdown.penalty).toBe(0)
  })
})
