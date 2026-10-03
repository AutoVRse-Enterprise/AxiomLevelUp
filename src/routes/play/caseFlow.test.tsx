import fixtureAnatomyMap from '../../../public/content/fixtures/anatomy-map.json'
import fixtureCase from '../../../public/content/fixtures/case.json'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useRef, useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'

import type { AnatomyViewerProps } from '@/anatomy3d/viewer/AnatomyViewer'
import { ContentContext } from '@/app/contentContext'
import { loadContent, type ContentRegistry } from '@/content/loader'
import type { CaseDocument } from '@/content/schema'
import type { TypedPrimitive } from '@/content/schema/primitives'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import type { LearnerEvent } from '@/events/types'
import { CaseAttemptPage } from '@/routes/cases/CaseAttemptPage'
import { CasePlayerPage } from '@/routes/cases/CasePlayerPage'
import { ChallengePlayerPage } from '@/routes/play/ChallengePlayerPage'
import { useLearnerStore } from '@/state/learnerStore'
import { contentResponses } from '@/test/contentFixtures'

vi.mock('@/anatomy3d/viewer/AnatomyViewer', () => ({
  AnatomyViewer: (props: AnatomyViewerProps) => {
    const reportedFailure = useRef(false)
    const [waypointId, setWaypointId] = useState(
      props.startView && 'waypointId' in props.startView ? props.startView.waypointId : null,
    )

    useEffect(() => {
      if (reportedFailure.current || props.disabled) return
      reportedFailure.current = true
      props.onFailed?.('WebGL unavailable in deterministic test substitute')
    }, [props])

    const selectableLevels = new Set(props.selectableLevelIds ?? [])
    const structures = props.map.structures.filter(
      ({ levelId }) => selectableLevels.size === 0 || selectableLevels.has(levelId),
    )
    const waypoint = props.map.waypoints.find(({ id }) => id === waypointId)

    return (
      <section aria-label="Unavailable 3D anatomy substitute">
        <p role="status">3D anatomy unavailable; use the equivalent structure list.</p>
        {waypoint?.next.map((nextId) => {
          const next = props.map.waypoints.find(({ id }) => id === nextId)
          return (
            <button
              disabled={props.disabled}
              key={nextId}
              type="button"
              onClick={() => {
                setWaypointId(nextId)
                props.onWaypointReached?.(nextId)
              }}
            >
              {next?.label ?? nextId}
            </button>
          )
        })}
        {props.findings?.map((finding) => (
          <button
            disabled={props.disabled}
            key={finding.id}
            type="button"
            onClick={() => props.onFindingInspected?.(finding.id)}
          >
            {finding.label}
          </button>
        ))}
        {structures.map((structure) => (
          <button
            aria-pressed={props.selectedStructureIds?.includes(structure.id) ?? false}
            disabled={props.disabled}
            key={structure.id}
            type="button"
            onClick={() => props.onStructureSelected?.(structure.id)}
          >
            {structure.label}
          </button>
        ))}
      </section>
    )
  },
}))

const MAIN_CASE_IDS = ['asthma-foundation', 'copd-intermediate', 'exacerbation-advanced'] as const
const QUICK_CASE_ID = 'wheeze-quick'
const DAILY_CHALLENGE_ID = 'daily-imaging-interpretation'
const axeOptions = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
  rules: { 'color-contrast': { enabled: false } },
}

type TestUser = ReturnType<typeof userEvent.setup>

async function loadRegistry(responses: ReadonlyMap<string, unknown>) {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const data = responses.get(String(input))
    return {
      ok: data !== undefined,
      status: data === undefined ? 404 : 200,
      statusText: data === undefined ? 'Not Found' : 'OK',
      json: async () => structuredClone(data),
    } as Response
  })

  try {
    return await loadContent()
  } finally {
    fetchSpy.mockRestore()
  }
}

function renderCaseRoute(path: string, registry: ContentRegistry) {
  const router = createMemoryRouter(
    [
      {
        path: '/learn/cases/:caseId/play',
        element: <CasePlayerPage />,
      },
      {
        path: '/learn/cases/:caseId/attempts/:attemptId',
        element: <CaseAttemptPage />,
      },
      {
        path: '/challenge/:challengeId/play',
        element: <ChallengePlayerPage />,
      },
      { path: '/learn/cases/:caseId', element: <p>Case intro route</p> },
      { path: '/learn', element: <p>Learn route</p> },
      { path: '/challenge', element: <p>Challenge route</p> },
    ],
    { initialEntries: [path] },
  )

  return render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

function optionLabel(options: readonly { id: string; label: string }[], id: string) {
  const label = options.find((option) => option.id === id)?.label
  if (!label) throw new Error(`No configured option label for "${id}".`)
  return label
}

function waypointPath(registry: ContentRegistry, mapId: string, startId: string, targetId: string) {
  const map = registry.anatomyMapById.get(mapId)
  if (!map) throw new Error(`Missing anatomy map "${mapId}".`)
  const queue: string[][] = [[startId]]
  const visited = new Set([startId])
  while (queue.length) {
    const path = queue.shift()!
    const current = map.waypoints.find(({ id }) => id === path.at(-1))
    for (const nextId of current?.next ?? []) {
      const nextPath = [...path, nextId]
      if (nextId === targetId) return nextPath
      if (!visited.has(nextId)) {
        visited.add(nextId)
        queue.push(nextPath)
      }
    }
  }
  throw new Error(`No authored waypoint route from "${startId}" to "${targetId}".`)
}

async function answerAnatomyExplore(
  user: TestUser,
  primitive: Extract<TypedPrimitive, { type: 'anatomy_explore' }>,
  response: unknown,
  registry: ContentRegistry,
) {
  if (!('waypointId' in primitive.content.startView)) {
    throw new Error('Case-flow anatomy exploration requires a waypoint start view.')
  }
  const observation = response as {
    reachedWaypointIds?: string[]
    inspectedFindingIds?: string[]
  }
  const map = registry.anatomyMapById.get(primitive.content.anatomyMapId)!
  let currentId = primitive.content.startView.waypointId
  for (const targetId of observation.reachedWaypointIds ?? []) {
    const path = waypointPath(registry, primitive.content.anatomyMapId, currentId, targetId)
    for (const nextId of path.slice(1)) {
      const label = map.waypoints.find(({ id }) => id === nextId)?.label
      if (!label) throw new Error(`Missing waypoint "${nextId}".`)
      await user.click(await screen.findByRole('button', { name: label }))
    }
    currentId = targetId
  }
  for (const findingId of observation.inspectedFindingIds ?? []) {
    const finding = registry.cases
      .flatMap(({ findings }) => findings ?? [])
      .find(({ id }) => id === findingId)
    if (!finding) throw new Error(`Missing finding "${findingId}".`)
    await user.click(await screen.findByRole('button', { name: finding.label }))
  }
}

async function answerAnatomyLocate(
  user: TestUser,
  primitive: Extract<TypedPrimitive, { type: 'anatomy_locate' }>,
  response: unknown,
  registry: ContentRegistry,
) {
  const selections = response as Record<string, string>
  const map = registry.anatomyMapById.get(primitive.content.anatomyMapId)
  if (!map) throw new Error(`Missing anatomy map "${primitive.content.anatomyMapId}".`)

  for (const [index, level] of primitive.content.levels.entries()) {
    const selectionId = selections[level.levelId]
    if (!selectionId) throw new Error(`Missing expert response for level "${level.levelId}".`)

    if (level.input === 'model') {
      const label = map.structures.find(({ id }) => id === selectionId)?.label
      if (!label) throw new Error(`Missing structure "${selectionId}".`)
      const structureButton = await screen.findByRole('button', { name: label })
      structureButton.focus()
      await user.keyboard('{Enter}')
      expect(structureButton).toHaveFocus()
    } else {
      const options = level.input === 'image' ? level.regions : level.options
      await user.click(
        await screen.findByRole('radio', {
          name: optionLabel(options, selectionId),
        }),
      )
    }

    await user.click(
      screen.getByRole('button', {
        name: index === primitive.content.levels.length - 1 ? 'Check locations' : 'Next level',
      }),
    )
  }
}

async function answerScenario(
  user: TestUser,
  primitive: Extract<TypedPrimitive, { type: 'scenario' }>,
  response: unknown,
) {
  const path = response as Array<{ nodeId: string; choiceId: string }>
  await user.click(await screen.findByRole('button', { name: 'Continue' }))

  for (const entry of path) {
    const node = primitive.content.nodes.find(({ id }) => id === entry.nodeId)
    if (!node || node.type !== 'decision') {
      throw new Error(`Missing scenario decision "${entry.nodeId}".`)
    }
    const choice = node.choices.find(({ id }) => id === entry.choiceId)
    if (!choice) throw new Error(`Missing scenario choice "${entry.choiceId}".`)
    await user.click(await screen.findByRole('button', { name: choice.label }))
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
  }

  await user.click(await screen.findByRole('button', { name: 'Complete scenario' }))
}

async function answerStep(
  user: TestUser,
  primitive: TypedPrimitive,
  response: unknown,
  registry: ContentRegistry,
) {
  switch (primitive.type) {
    case 'anatomy_explore':
      await answerAnatomyExplore(user, primitive, response, registry)
      return
    case 'anatomy_locate':
      await answerAnatomyLocate(user, primitive, response, registry)
      return
    case 'multiple_choice': {
      const responseId = response as string
      await user.click(
        await screen.findByRole('radio', {
          name: optionLabel(primitive.content.options, responseId),
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      return
    }
    case 'multiple_select': {
      for (const responseId of response as string[]) {
        await user.click(
          await screen.findByRole('checkbox', {
            name: optionLabel(primitive.content.options, responseId),
          }),
        )
      }
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      return
    }
    case 'classification': {
      const assignments = response as Record<string, string>
      for (const item of primitive.content.items) {
        await user.click(await screen.findByRole('button', { name: item.label }))
        await user.click(
          screen.getByRole('button', {
            name: optionLabel(primitive.content.categories, assignments[item.id]!),
          }),
        )
      }
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      return
    }
    case 'true_false':
      await user.click(
        await screen.findByRole('radio', {
          name: response === true ? 'True' : 'False',
        }),
      )
      await user.click(screen.getByRole('button', { name: 'Check answer' }))
      return
    case 'scenario':
      await answerScenario(user, primitive, response)
      return
    default:
      throw new Error(`Case-flow driver does not support "${primitive.type}".`)
  }
}

async function completeCase(user: TestUser, caseDoc: CaseDocument, registry: ContentRegistry) {
  const manualStart = screen.queryByRole('button', { name: /^(Start|Resume)$/ })
  if (manualStart) await user.click(manualStart)
  await user.click(await screen.findByRole('button', { name: 'Begin stage' }))

  for (const [stageIndex, stage] of caseDoc.stages.entries()) {
    for (const step of stage.steps) {
      await answerStep(
        user,
        step as TypedPrimitive,
        caseDoc.expertBenchmark.responses[step.id],
        registry,
      )
      await user.click(await screen.findByRole('button', { name: 'Continue' }))
    }
    if (stageIndex < caseDoc.stages.length - 1) {
      await user.click(await screen.findByRole('button', { name: 'Begin stage' }))
    }
  }

  expect(await screen.findByText('Case complete')).toBeVisible()
  expect(screen.getByText(/^\d+\/100$/)).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Score details' })).toBeVisible()
}

function fourthCatalogueResponses() {
  const responses = new Map(
    [...contentResponses].map(([path, data]) => [path, structuredClone(data)] as const),
  )
  const manifest = responses.get('/content/manifest.json') as {
    cases: string[]
    anatomyMaps: string[]
  }
  manifest.cases.splice(3, 0, 'cases/case-contract-fixture.json')
  manifest.anatomyMaps.push('anatomy/fixture-anatomy.json')

  const config = responses.get('/content/app-config.json') as {
    caseLab: {
      caseIds: string[]
      clueCategories: Array<{ id: string; label: string }>
    }
  }
  config.caseLab.caseIds.push('case-contract-fixture')
  config.caseLab.clueCategories.push({ id: 'evidence', label: 'Evidence' })

  const assets = responses.get('/content/assets.json') as {
    assets: Array<Record<string, unknown>>
  }
  assets.assets.push({
    assetId: 'fixture-anatomy-model',
    path: '/assets/models/fixture.glb',
    type: 'model',
    mimeType: 'model/gltf-binary',
    offlineRequired: false,
    offlineAvailable: false,
    sizeBytes: 1024,
    sha256: '1'.repeat(64),
    meshNames: ['root-region', 'target-structure'],
    triangleCount: 12,
    bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
  })
  responses.set('/content/cases/case-contract-fixture.json', structuredClone(fixtureCase))
  responses.set('/content/anatomy/fixture-anatomy.json', structuredClone(fixtureAnatomyMap))
  return responses
}

let registry: ContentRegistry

beforeAll(async () => {
  registry = await loadRegistry(contentResponses)
})

beforeEach(async () => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  stopLearningEventHandlersForTests()
  clearEventSubscribersForTests()
  useLearnerStore.getState().replaceWithSeed(registry.seed)
  useActivitySessionStore.getState().clear()
  await useActivitySessionStore.persist.clearStorage()
})

afterEach(() => {
  cleanup()
  stopLearningEventHandlersForTests()
  clearEventSubscribersForTests()
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('configured Case Lab flows', () => {
  it('keeps the three catalogue cases distinct from the configured quick case', () => {
    expect(registry.appConfig.caseLab?.caseIds).toEqual(MAIN_CASE_IDS)
    expect(registry.appConfig.caseLab?.dailyQuickCaseId).toBe(QUICK_CASE_ID)
    expect(registry.appConfig.caseLab?.caseIds).not.toContain(QUICK_CASE_ID)
  })

  it.each(MAIN_CASE_IDS)(
    'completes %s through results, comparison, and the learner pipeline',
    async (caseId) => {
      const user = userEvent.setup()
      const caseDoc = registry.caseById.get(caseId)!
      const priorCompletions = useLearnerStore.getState().caseProgress[caseId]?.completions ?? 0
      const priorAttempts = useLearnerStore.getState().caseAttempts[caseId]?.length ?? 0
      const priorDiagnosisMastery =
        useLearnerStore.getState().mastery['respiratory-diagnosis']?.score ?? 0
      const events: LearnerEvent[] = []
      subscribeToEvents((event) => events.push(event))
      initializeLearningProgressHandlers(registry)
      renderCaseRoute(`/learn/cases/${caseId}/play`, registry)

      await completeCase(user, caseDoc, registry)

      await waitFor(() => {
        expect(useLearnerStore.getState().caseProgress[caseId]?.completions).toBe(
          priorCompletions + 1,
        )
      })
      const state = useLearnerStore.getState()
      const attempts = state.caseAttempts[caseId] ?? []
      expect(attempts).toHaveLength(priorAttempts + 1)
      expect(attempts.at(-1)).toMatchObject({
        resultVersion: 7,
        anatomy: 1,
        diagnosis: 1,
        actualAwardedXpSource: 'gamification_activity_result',
      })
      const completedAttempt = attempts.at(-1)
      const awardedXp =
        completedAttempt && completedAttempt.resultVersion !== 5
          ? completedAttempt.actualAwardedXp
          : null
      expect(awardedXp).not.toBeNull()
      expect(screen.getByText(`${awardedXp} XP awarded`)).toBeVisible()
      expect(attempts.at(-1)!.total).toBeGreaterThanOrEqual(90)
      expect(state.mastery['respiratory-diagnosis']?.score).toBeGreaterThan(priorDiagnosisMastery)
      expect(state.badges['sharp-eye']?.unlockedAt).not.toBeNull()
      expect(state.badges['rapid-responder']?.unlockedAt).not.toBeNull()
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ event: 'anatomy_viewer_failed' }),
          expect.objectContaining({ event: 'case_completed', caseId }),
        ]),
      )

      await user.click(screen.getByRole('button', { name: 'Compare' }))
      expect(screen.getByText('Attempt comparison')).toBeVisible()
      expect(
        screen.getByRole('heading', {
          name: `You versus ${caseDoc.expertBenchmark.name}`,
        }),
      ).toBeVisible()
      expect(screen.getAllByText('Matched expert')).toHaveLength(
        caseDoc.stages
          .flatMap(({ steps }) => steps)
          .filter(({ type }) => type !== 'anatomy_explore').length,
      )
    },
    20_000,
  )

  it('completes the quick case through the daily challenge pipeline', async () => {
    const user = userEvent.setup()
    const quickCase = registry.caseById.get(QUICK_CASE_ID)!
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    initializeLearningProgressHandlers(registry)
    renderCaseRoute(`/challenge/${DAILY_CHALLENGE_ID}/play`, registry)

    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible()
    await completeCase(user, quickCase, registry)

    await waitFor(() => {
      expect(useLearnerStore.getState().challenges[DAILY_CHALLENGE_ID]).toMatchObject({
        completed: true,
        bestScore: 100,
      })
    })
    expect(useLearnerStore.getState().caseProgress[QUICK_CASE_ID]).toMatchObject({
      completions: 1,
      bestTotal: 100,
    })
    expect(screen.getByText('100/100')).toBeVisible()
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'case_completed',
          caseId: QUICK_CASE_ID,
          challengeId: DAILY_CHALLENGE_ID,
        }),
        expect.objectContaining({
          event: 'challenge_completed',
          challengeId: DAILY_CHALLENGE_ID,
        }),
      ]),
    )

    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByText('Attempt comparison')).toBeVisible()
    expect(screen.getAllByText('Matched expert')).toHaveLength(2)
  }, 15_000)

  it('loads and plays a content-only fourth catalogue fixture while keeping quick case separate', async () => {
    const fixtureRegistry = await loadRegistry(fourthCatalogueResponses())
    const user = userEvent.setup()
    const fixture = fixtureRegistry.caseById.get('case-contract-fixture')!
    useLearnerStore.getState().replaceWithSeed(fixtureRegistry.seed)
    initializeLearningProgressHandlers(fixtureRegistry)

    expect(fixtureRegistry.appConfig.caseLab?.caseIds).toEqual([
      ...MAIN_CASE_IDS,
      'case-contract-fixture',
    ])
    expect(fixtureRegistry.appConfig.caseLab?.dailyQuickCaseId).toBe(QUICK_CASE_ID)
    expect(fixtureRegistry.cases).toHaveLength(5)
    renderCaseRoute('/learn/cases/case-contract-fixture/play', fixtureRegistry)

    await completeCase(user, fixture, fixtureRegistry)

    expect(useLearnerStore.getState().caseProgress[fixture.id]).toMatchObject({
      completions: 1,
      bestTotal: 100,
    })
    expect(screen.getByText('100/100')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByRole('heading', { name: 'You versus Configured expert' })).toBeVisible()
    expect(screen.getAllByText('Matched expert')).toHaveLength(2)
  }, 15_000)

  it('has no detectable WCAG A/AA violations in the active unavailable-3D case state', async () => {
    const user = userEvent.setup()
    const { container } = renderCaseRoute('/learn/cases/asthma-foundation/play', registry)
    await user.click(await screen.findByRole('button', { name: 'Begin stage' }))

    expect(screen.getByRole('status')).toHaveTextContent('3D anatomy unavailable')
    expect((await axe.run(container, axeOptions)).violations).toEqual([])
  })
})
