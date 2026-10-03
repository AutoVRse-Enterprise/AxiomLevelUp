import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { primitiveTypes } from '@/content/primitiveTypes'
import { buildActivityPlan, lessonActivity } from '@/engines/learning/plan'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { LessonPlayerPage } from '@/routes/play/LessonPlayerPage'
import { useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

vi.mock('@/imaging/viewer/useDicomViewer', () => ({
  useDicomViewer: () => ({
    state: {
      status: 'unavailable',
      message: 'DICOM fixture intentionally unavailable in route integration tests.',
      loaded: 0,
      total: 125,
      slice: 81,
      activeTool: 'scroll',
      presetId: null,
      measurement: null,
      firstImageMs: null,
    },
    controller: null,
    retry: vi.fn(),
  }),
}))

vi.mock('@/anatomy3d/viewer/useAnatomyViewer', () => ({
  useAnatomyViewer: () => ({
    state: {
      status: 'ready',
      message: 'Interactive anatomy ready',
      loadResult: { meshNames: ['trachea'], triangleCount: 12 },
      warning: null,
    },
    controller: {
      highlight: vi.fn(),
      setMarker: vi.fn(),
      setFindings: vi.fn(),
      pick: vi.fn(),
      pickFinding: vi.fn(),
      travelTo: vi.fn(),
      availableBranches: () => ['carina'],
      parentWaypoint: () => null,
      waypointPath: () => ['trachea-mid'],
      enterEndoscopic: vi.fn(),
      exitEndoscopic: vi.fn(),
      lookAround: vi.fn(),
      frameStructures: vi.fn(),
      resetView: vi.fn(),
    },
    retry: vi.fn(),
  }),
}))

const registry = validateContentBundle(makeValidContentBundle())
const showcaseCourse = registry.courseById.get('runtime-showcase')!
const showcaseLesson = registry.lessonById.get('primitive-showcase')!
const showcasePlan = buildActivityPlan(
  lessonActivity(showcaseCourse.id, showcaseCourse.courseVersion, showcaseLesson),
  {
    environment: 'development',
    player: registry.appConfig.product.player,
  },
)

function authoredStepHeading(primitiveId: string) {
  const step = showcasePlan.steps.find(({ primitive }) => primitive.id === primitiveId)
  if (!step) throw new Error(`Missing showcase plan step ${primitiveId}`)
  return `${showcasePlan.activity.title}: ${step.label} — ${step.prompt}`
}

function renderShowcaseRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/learn/courses/:courseId/lessons/:lessonId',
        element: <LessonPlayerPage />,
      },
      { path: '/learn/courses/:courseId', element: <p>Course route</p> },
    ],
    {
      initialEntries: ['/learn/courses/runtime-showcase/lessons/primitive-showcase'],
    },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

function oneStepShowcasePlan(primitiveId: string) {
  const primitive = showcaseLesson.primitives.find(({ id }) => id === primitiveId)
  if (!primitive) throw new Error(`Missing showcase primitive ${primitiveId}`)
  return buildActivityPlan(
    lessonActivity(showcaseCourse.id, showcaseCourse.courseVersion, {
      ...showcaseLesson,
      id: `resume-${primitiveId}`,
      primitives: [primitive],
    }),
    {
      environment: 'development',
      player: registry.appConfig.product.player,
    },
  )
}

function renderOneStepPlayer(primitiveId: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/play',
        element: (
          <ActivityPlayer
            plan={oneStepShowcasePlan(primitiveId)}
            previousAttempts={0}
            previousBestScore={null}
            continuePath="/done"
            exitPath="/exit"
          />
        ),
      },
      { path: '/done', element: <p>Done route</p> },
      { path: '/exit', element: <p>Exit route</p> },
    ],
    { initialEntries: ['/play'] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

async function continueCompletedStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Continue' }))
}

function completeMedia(element: HTMLMediaElement) {
  Object.defineProperty(element, 'duration', { configurable: true, value: 10 })
  Object.defineProperty(element, 'played', {
    configurable: true,
    value: { length: 1, start: () => 0, end: () => 10 },
  })
  fireEvent.timeUpdate(element)
}

async function submitCorrectChoice(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole('radio', { name: label }))
  await user.click(screen.getByRole('button', { name: 'Check answer' }))
  await continueCompletedStep(user)
}

async function moveOrderingItemTo(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  targetIndex: number,
) {
  for (;;) {
    const item = screen.getByText(label).closest('li')
    if (!item) throw new Error(`Ordering item not found: ${label}`)
    const index = Array.from(item.parentElement?.children ?? []).indexOf(item)
    if (index <= targetIndex) return
    await user.click(within(item).getByRole('button', { name: 'Move up' }))
  }
}

describe('showcase lesson integration', () => {
  beforeEach(async () => {
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => 'Synthetic transcript.' })),
    )
  })

  it('covers every registered primitive type and only duplicates intentional modes', () => {
    const representedTypes = showcaseLesson.primitives.map(({ type }) => type)
    const counts = representedTypes.reduce<Record<string, number>>((result, type) => {
      result[type] = (result[type] ?? 0) + 1
      return result
    }, {})

    expect([...new Set(representedTypes)].sort()).toEqual([...primitiveTypes].sort())
    expect(Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 1))).toEqual({
      image_hotspot: 2,
    })
  })

  it('plays all 28 showcase steps through the real route and emits ordered completion events', async () => {
    const user = userEvent.setup()
    const events: LearnerEvent[] = []
    subscribeToEvents((event) => events.push(event))
    renderShowcaseRoute()

    await user.click(screen.getByRole('button', { name: 'Start' }))

    await screen.findByRole('heading', { name: authoredStepHeading('showcase-rich-text') })
    await continueCompletedStep(user)
    await screen.findByRole('heading', { name: authoredStepHeading('showcase-image') })
    await continueCompletedStep(user)
    await screen.findByRole('heading', { name: authoredStepHeading('showcase-zoomable-image') })
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'Explore Sparse observations' }))
    await user.click(screen.getByRole('button', { name: 'Explore Dense observations' }))
    await continueCompletedStep(user)

    await screen.findByRole('heading', { name: authoredStepHeading('showcase-image-compare') })
    await continueCompletedStep(user)

    const video = await screen.findByLabelText('Reading a scientific signal')
    completeMedia(video as HTMLVideoElement)
    await continueCompletedStep(user)

    await screen.findByRole('heading', { name: 'Evidence interpretation reminder' })
    completeMedia(document.querySelector('audio')!)
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'Show slide 2: Precision' }))
    await user.click(screen.getByRole('button', { name: 'Show slide 3: Context' }))
    await continueCompletedStep(user)

    for (const primitiveId of [
      'showcase-data-table',
      'showcase-chart',
      'showcase-formula',
      'showcase-pdf-reference',
    ]) {
      await screen.findByRole('heading', { name: authoredStepHeading(primitiveId) })
      await continueCompletedStep(user)
    }

    const hotspot = await screen.findByRole('button', {
      name: /Image location selector/u,
    })
    vi.spyOn(hotspot, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    fireEvent.click(hotspot, { clientX: 72, clientY: 40 })
    await user.click(screen.getByRole('button', { name: 'Check location' }))
    await continueCompletedStep(user)

    await submitCorrectChoice(user, 'Confidence interval width')

    await user.click(await screen.findByRole('checkbox', { name: 'Effect magnitude' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(await screen.findByRole('heading', { name: 'Partially correct' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await user.click(await screen.findByRole('checkbox', { name: 'Effect magnitude' }))
    await user.click(screen.getByRole('checkbox', { name: 'Uncertainty' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    await submitCorrectChoice(user, 'True')

    await user.click(
      await screen.findByRole('button', { name: 'The estimated difference is 18%.' }),
    )
    await user.click(screen.getByRole('button', { name: 'Magnitude' }))
    await user.click(
      screen.getByRole('button', { name: 'The interval spans only 3 percentage points.' }),
    )
    await user.click(screen.getByRole('button', { name: 'Precision' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'EC50' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Match 1: Concentration at half-maximal response',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Plateau' }))
    await user.click(
      screen.getByRole('button', { name: 'Match 2: Region approaching maximum response' }),
    )
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    await screen.findByText('Order the interpretation workflow.')
    await moveOrderingItemTo(user, 'Inspect the study design', 0)
    await moveOrderingItemTo(user, 'Estimate the effect', 1)
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    await user.type(await screen.findByRole('textbox', { name: 'Blank 1' }), 'narrow')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Blank 2' }), 'precision')
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    await user.type(await screen.findByRole('textbox', { name: 'Numeric answer' }), '52')
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await continueCompletedStep(user)

    expect(await screen.findByText(/small experiment reports a large effect/u)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'The effect is promising but uncertain' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Increase precision with an adequately sized replication',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Complete scenario' }))
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'Trachea' }))
    await user.click(screen.getByRole('button', { name: 'Carina' }))
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'Right lower lobe' }))
    await user.click(screen.getByRole('button', { name: 'Next level' }))
    await user.click(await screen.findByRole('radio', { name: 'Lateral region' }))
    await user.click(screen.getByRole('button', { name: 'Next level' }))
    await user.click(await screen.findByRole('radio', { name: 'Distal airway' }))
    await user.click(screen.getByRole('button', { name: 'Check locations' }))
    await continueCompletedStep(user)

    await user.click(await screen.findByRole('button', { name: 'Skip activity' }))
    await continueCompletedStep(user)

    for (let index = 0; index < 3; index += 1) {
      await user.click(await screen.findByRole('button', { name: 'Skip activity' }))
      await user.click(await screen.findByRole('button', { name: 'Try again' }))
      await user.click(await screen.findByRole('button', { name: 'Skip activity' }))
      await continueCompletedStep(user)
    }

    expect(await screen.findByText('Activity complete')).toBeVisible()
    expect(screen.getByText('75%')).toBeVisible()
    expect(screen.getByText('10 of 14 correct on the first attempt')).toBeVisible()

    const lifecycleEvents = events.filter(({ event }) =>
      ['lesson_started', 'primitive_viewed', 'primitive_completed', 'lesson_completed'].includes(
        event,
      ),
    )
    expect(lifecycleEvents.map(({ event }) => event)).toEqual([
      'lesson_started',
      ...showcaseLesson.primitives.flatMap(() => ['primitive_viewed', 'primitive_completed']),
      'lesson_completed',
    ])
    expect(
      lifecycleEvents
        .filter((event) => event.event === 'primitive_completed')
        .map((event) => event.primitiveId),
    ).toEqual(showcaseLesson.primitives.map(({ id }) => id))
    expect(events.at(-1)).toMatchObject({
      event: 'lesson_completed',
      lessonId: 'primitive-showcase',
      score: 75,
      accuracy: 71,
    })
    expect(useActivitySessionStore.getState().session).toBeNull()
  }, 30_000)

  it('restores a revealed scenario decision after remounting', async () => {
    const user = userEvent.setup()
    renderOneStepPlayer('showcase-scenario')
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'The effect is promising but uncertain' }))
    cleanup()

    expect(
      useActivitySessionStore.getState().session?.progress['showcase-scenario']?.draft,
    ).toMatchObject({
      current: 'interpret-estimate',
      revealed: true,
      path: [{ nodeId: 'interpret-estimate', choiceId: 'promising-uncertain' }],
    })

    renderOneStepPlayer('showcase-scenario')
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(await screen.findByText(/separates observed magnitude/u)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'The effect is promising but uncertain' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('restores an ordering draft after remounting', async () => {
    const user = userEvent.setup()
    renderOneStepPlayer('showcase-ordering')
    await user.click(screen.getByRole('button', { name: 'Start' }))
    const firstItem = (await screen.findAllByRole('listitem'))[0]!
    await user.click(within(firstItem).getByRole('button', { name: 'Move down' }))
    cleanup()

    const draft = useActivitySessionStore.getState().session?.progress['showcase-ordering']?.draft
    const ordering = showcaseLesson.primitives.find(({ id }) => id === 'showcase-ordering')!
    const orderingItems = ordering.content.items as Array<{ id: string; label: string }>
    expect(draft).toEqual(expect.arrayContaining(orderingItems.map(({ id }) => id)))

    renderOneStepPlayer('showcase-ordering')
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    const restoredLabels = (await screen.findAllByRole('listitem')).map(
      (item) => item.querySelector('.font-medium')?.textContent,
    )
    const labelById = new Map(orderingItems.map((item) => [item.id, item.label]))
    expect(restoredLabels).toEqual((draft as string[]).map((id) => labelById.get(id)))
  })
})
