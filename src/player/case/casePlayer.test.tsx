import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

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

describe('case player integration', () => {
  beforeEach(async () => {
    cleanup()
    clearEventSubscribersForTests()
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
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
    expect(screen.getByRole('heading', { name: 'Orient' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Context/ }))
    expect(onClueOpened).toHaveBeenCalledWith(
      expect.objectContaining({ clueId: 'clue-context', essential: true }),
    )

    await user.click(await screen.findByRole('radio', { name: 'Target structure' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Conclude')
    await user.click(screen.getByRole('button', { name: 'Begin stage' }))

    await user.click(await screen.findByRole('radio', { name: 'True' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Case complete')).toBeVisible()
    expect(screen.getByText('100 points')).toBeVisible()
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
    expect(screen.getByText(/first recorded attempt/i)).toBeVisible()
  })

  it('restores the current stage, opened clues and active case clock', async () => {
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
        stepElapsedMs: { 'identify-location': 2_500 },
        caseElapsedMs: 4_200,
        caseClockExpired: false,
      },
    })

    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderCase(caseDoc, config)
    await user.click(screen.getByRole('button', { name: 'Resume' }))

    expect(screen.getByRole('heading', { name: 'Conclude' })).toBeVisible()
    expect(screen.getByText('1/1 opened')).toBeVisible()
    expect(screen.getByRole('timer')).toHaveAccessibleName(/Case elapsed time: 0:0[5-6]/)
    expect(useActivitySessionStore.getState().session?.caseProgress).toMatchObject({
      openedClueIds: ['clue-context'],
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

  it('automatically opens the configured clue-first evidence once', async () => {
    const user = userEvent.setup()
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      entry: { mode: 'clue_first', clueId: 'clue-context' },
    })
    const onClueOpened = vi.fn()
    renderCase(caseDoc, caseConfig('none'), { onClueOpened })

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await waitFor(() =>
      expect(useActivitySessionStore.getState().session?.caseProgress?.openedClueIds).toEqual([
        'clue-context',
      ]),
    )
    expect(onClueOpened).toHaveBeenCalledTimes(1)
  })
})
