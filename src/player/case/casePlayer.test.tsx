import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'
import anatomyMapFixture from '../../../public/content/fixtures/anatomy-map.json'

import type { AnatomyViewerProps } from '@/anatomy3d/viewer/AnatomyViewer'
import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import {
  appConfigSchema,
  anatomyMapSchema,
  caseDocumentSchema,
  type AppConfig,
  type CaseDocument,
} from '@/content/schema'
import { buildCasePlan } from '@/engines/cases/plan'
import { createActivitySession, sessionReducer } from '@/engines/learning/session'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, emitEvent, subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import { CasePlayer, type CasePlayerProps } from '@/player/case/CasePlayer'
import { useLearnerStore } from '@/state/learnerStore'
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
      howItWorks: [
        { id: 'first_attempt', title: 'First answer', description: 'Your first answer is scored.' },
        { id: 'optional_clues', title: 'Clues', description: 'Optional clues can cost points.' },
        { id: 'timing', title: 'Timing', description: 'Timing depends on the tier.' },
        { id: 'hints', title: 'Hints', description: 'Hint support depends on the tier.' },
      ],
      organSystems: { generic: 'Generic' },
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
            anatomyMap={anatomyMapSchema.parse(anatomyMapFixture)}
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
    useLearnerStore.setState({ caseLab: { walkthroughSeen: true, anatomyHintSeen: true } })
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
    expect(screen.getByRole('heading', { name: 'Orient' })).toHaveFocus()
    expect(screen.getByText('Verify the orient-stage contract.')).toBeVisible()
    expect(screen.getByText('Untimed practice')).toBeVisible()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(
      'Your first answer is scored; retries are for learning.',
    )
    expect(screen.queryByText(/Task \d+ of \d+/)).not.toBeInTheDocument()
    expect(screen.queryByText('Basic')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar', { name: 'Activity progress' })).not.toBeInTheDocument()
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
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'Conclude' })).toHaveFocus()
    expect(screen.getByText('Verify the conclusion-stage contract.')).toBeVisible()
    expect(screen.getAllByText('Context')).not.toHaveLength(0)

    await user.click(await screen.findByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Case complete')).toBeVisible()
    expect(screen.getByText('100/100')).toBeVisible()
    expect(screen.getByLabelText('3 of 3 stars')).toBeVisible()
    await user.click(screen.getByText('Score details'))
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

    await user.click(screen.getByRole('button', { name: 'Compare with model answer' }))
    expect(screen.getAllByText('Model answer').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'You versus the model answer' })).toBeVisible()
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

    await user.click(screen.getByRole('button', { name: 'Compare with model answer' }))
    expect(screen.getByText('Which configured location is highlighted?')).toBeVisible()
    expect(screen.getByText('The configured evidence supports the conclusion.')).toBeVisible()
    expect(screen.queryByText('explore-airway')).not.toBeInTheDocument()
  })

  it('walks a first-time learner through the case and keeps evidence navigation in flow', async () => {
    vi.useFakeTimers()
    setMobileViewport(true)
    useLearnerStore.setState({ caseLab: { walkthroughSeen: false, anatomyHintSeen: false } })
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      stages: fixtureCaseJson.stages.map((stage, index) =>
        index === 0
          ? {
              ...stage,
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
    const walkthrough = screen.getByRole('dialog', { name: 'How this case works' })
    expect(walkthrough).toHaveTextContent('Task')
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:03' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 5:00')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:03' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 5:00')).toBeInTheDocument()

    fireEvent.click(within(walkthrough).getByRole('button', { name: /Next/ }))
    expect(walkthrough).toHaveTextContent('Clues')
    fireEvent.click(within(walkthrough).getByRole('button', { name: /Next/ }))
    expect(walkthrough).toHaveTextContent('Case notes')
    fireEvent.click(within(walkthrough).getByRole('button', { name: /Next/ }))
    expect(walkthrough).toHaveTextContent('Primary action')
    fireEvent.click(within(walkthrough).getByRole('button', { name: 'Start case' }))
    expect(useLearnerStore.getState().caseLab.walkthroughSeen).toBe(true)
    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:02' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 4:59')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Replay how this case works' }))
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:02' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 4:59')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await act(() => vi.advanceTimersByTimeAsync(1_000))
    expect(screen.getByRole('timer', { name: 'Time remaining: 0:01' })).toBeVisible()
    expect(screen.getByLabelText('Case time remaining: 4:58')).toBeInTheDocument()

    const mobileWorkspace = within(screen.getByRole('tablist', { name: 'Case workspace' }))
    fireEvent.click(mobileWorkspace.getByRole('tab', { name: 'Clues' }))
    expect(screen.queryByRole('dialog', { name: 'Clue board' })).not.toBeInTheDocument()
    fireEvent.click(mobileWorkspace.getByRole('tab', { name: 'Case notes' }))
    expect(screen.queryByRole('dialog', { name: 'Case notes' })).not.toBeInTheDocument()
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
      differential: [
        { id: 'supported-hypothesis', label: 'Supported hypothesis' },
        { id: 'alternative-hypothesis', label: 'Alternative hypothesis' },
      ],
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
        evidence: {
          pinned: [{ kind: 'clue', id: 'clue-context' }],
          currentLocation: { kind: 'structure', id: 'target-structure' },
        },
        differential: { 'supported-hypothesis': 'likely' },
        differentialCheckpoints: {},
      },
    })

    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, config)
    await user.click(screen.getByRole('button', { name: 'Resume' }))

    expect(screen.queryByRole('dialog', { name: 'Conclude' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Conclude' })).toBeVisible()
    expect(screen.getByText('1 of 1 reviewed · 1 available this stage')).toBeVisible()
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Case elapsed time: 0:0[5-6]/)
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
      reviewedClueIds: ['clue-context'],
      caseElapsedMs: expect.any(Number),
      evidence: {
        pinned: [{ kind: 'clue', id: 'clue-context' }],
        currentLocation: { kind: 'structure', id: 'target-structure' },
      },
      differential: { 'supported-hypothesis': 'likely' },
    })
    await user.click(
      within(screen.getByRole('tablist', { name: 'Case support sections' })).getByRole('tab', {
        name: 'Case notes',
      }),
    )
    expect(screen.getByText('Target structure')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Unpin clue' })).toBeVisible()
    expect(
      within(screen.getByText('Supported hypothesis').closest('fieldset')!).getByRole('button', {
        name: 'Likely',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'case_started',
        attempt: 1,
        resumed: true,
        tier: 'foundation',
      }),
    )
  })

  it('persists pins, mapped location and reflective differential updates', async () => {
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      differential: [
        {
          id: 'supported-hypothesis',
          label: 'Supported hypothesis',
          description: 'Fits the configured evidence.',
        },
        { id: 'alternative-hypothesis', label: 'Alternative hypothesis' },
      ],
    })
    const config = caseConfig('none')
    config.caseLab!.clueReview.minVisibleMs = 1
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, config)

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('heading', { name: 'Orient' })).toHaveFocus()

    emitEvent({
      event: 'anatomy_waypoint_reached',
      activityKind: 'case',
      activityId: caseDoc.id,
      primitiveId: 'identify-location',
      primitiveType: 'anatomy_explore',
      waypointId: 'entry-waypoint',
    })
    await user.click(screen.getByRole('button', { name: /Context.*New/ }))
    await waitFor(() =>
      expect(useActivitySessionStore.getState().session?.caseProgress?.reviewedClueIds).toEqual([
        'clue-context',
      ]),
    )

    await user.click(
      within(screen.getByRole('tablist', { name: 'Case support sections' })).getByRole('tab', {
        name: 'Case notes',
      }),
    )
    expect(screen.getByText('Entry waypoint')).toBeVisible()
    expect(screen.queryByText('entry-waypoint')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin clue' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Pin finding' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pin clue' }))
    const supportedHypothesis = screen.getByText('Supported hypothesis').closest('fieldset')!
    await user.click(within(supportedHypothesis).getByRole('button', { name: 'Possible' }))
    await user.click(within(supportedHypothesis).getByRole('button', { name: 'Possible' }))

    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      evidence: {
        pinned: [{ kind: 'clue', id: 'clue-context' }],
        currentLocation: { kind: 'waypoint', id: 'entry-waypoint' },
      },
      differential: { 'supported-hypothesis': 'possible' },
    })
    expect(events.filter(({ event }) => event === 'case_evidence_pinned')).toEqual([
      expect.objectContaining({
        evidence: { kind: 'clue', id: 'clue-context' },
        pinned: true,
      }),
    ])
    expect(events.filter(({ event }) => event === 'case_hypothesis_updated')).toEqual([
      expect.objectContaining({
        hypothesisId: 'supported-hypothesis',
        confidence: 'possible',
      }),
    ])

    await user.click(screen.getByRole('button', { name: 'Context' }))
    expect(
      within(screen.getByRole('tablist', { name: 'Case support sections' })).getByRole('tab', {
        name: 'Clues',
      }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(events.filter(({ event }) => event === 'case_clue_opened')).toHaveLength(1)
  })

  it('reviews a static clue only after its configured visible dwell and emits once', async () => {
    vi.useFakeTimers()
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, caseConfig('none'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: /Context.*New/ }))

    expect(screen.getByText('0 of 1 reviewed · 1 available this stage')).toBeVisible()
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
    expect(screen.getByText('1 of 1 reviewed · 1 available this stage')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /Context.*Reviewed/ }))
    await act(() => vi.advanceTimersByTimeAsync(1_200))
    expect(events.filter(({ event }) => event === 'case_clue_reviewed')).toHaveLength(1)

    fireEvent.click(screen.getByRole('radio', { name: 'Target structure' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('1 of 1 reviewed · 0 available this stage')).toBeVisible()
  })

  it('shows optional clue cost in the advanced tier', () => {
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      tier: 'advanced',
      clues: fixtureCaseJson.clues.map((clue) => ({ ...clue, essential: false })),
    })
    renderCase(caseDoc, caseConfig('countdown'))

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: /Context.*New.*−2 pts/ })).toBeVisible()
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
    expect(
      within(screen.getByRole('tabpanel', { name: 'Clues' })).getAllByRole('heading', {
        name: 'Context',
      }),
    ).not.toHaveLength(0)
    await waitFor(() =>
      expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
        openedClueIds: ['clue-context'],
        clueOpenContexts: {
          'clue-context': { context: 'entry', beforeResponse: true },
        },
      }),
    )
    expect(onClueOpened).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /Context.*New/ }))
    expect(onClueOpened).toHaveBeenCalledTimes(1)
  })

  it('opens the mobile clue list without selecting or recording a clue', async () => {
    setMobileViewport(true)
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const onClueOpened = vi.fn()
    renderCase(caseDoc, caseConfig('none'), { onClueOpened })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(
      within(screen.getByRole('tablist', { name: 'Case workspace' })).getByRole('tab', {
        name: 'Clues',
      }),
    )

    expect(screen.getByRole('tabpanel', { name: 'Clues' })).toBeInTheDocument()
    expect(useActivitySessionStore.getState().session?.caseProgress?.openedClueIds ?? []).toEqual([])
    expect(useActivitySessionStore.getState().session?.caseProgress?.clueOpenContexts ?? {}).toEqual(
      {},
    )
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
    await user.click(screen.getByRole('radio', { name: 'Other structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Reopen clue: Context' }))

    expect(
      within(screen.getByRole('tabpanel', { name: 'Clues' })).getAllByRole('heading', {
        name: 'Context',
      }),
    ).not.toHaveLength(0)
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
      clueOpenContexts: {
        'clue-context': { context: 'remediation', beforeResponse: false },
      },
    })
    expect(onClueOpened).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Reopen clue: Context' }))
    expect(onClueOpened).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await user.click(screen.getByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(onComplete.mock.calls[0]![0].breakdown.penalty).toBe(0)
  })
})
