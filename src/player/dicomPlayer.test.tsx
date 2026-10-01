import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { buildActivityPlan, lessonActivity } from '@/engines/learning/plan'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { clearEventSubscribersForTests } from '@/events/bus'
import {
  initializeLearningProgressHandlers,
  stopLearningEventHandlersForTests,
} from '@/events/handlers'
import type { DicomViewerProps } from '@/imaging/viewer/DicomViewer'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

vi.mock('@/imaging/viewer/DicomViewer', () => ({
  DicomViewer: (props: DicomViewerProps) => (
    <div>
      {props.panel}
      <button
        type="button"
        onClick={() => props.onMeasurement?.({ slice: 81, value: 17.6, unit: 'mm' })}
      >
        Create calibrated measurement
      </button>
    </div>
  ),
}))

const registry = validateContentBundle(makeValidContentBundle())
const course = registry.courseById.get('scientific-imaging')!
const sourceLesson = registry.lessonById.get('dicom-lab')!
const measure = sourceLesson.primitives.find(({ type }) => type === 'dicom_measure')!
const lesson = { ...sourceLesson, id: 'dicom-measure-integration', primitives: [measure] }
const integrationRegistry = {
  ...registry,
  lessonById: new Map(registry.lessonById).set(lesson.id, lesson),
}
const plan = buildActivityPlan(lessonActivity(course.id, course.courseVersion, lesson), {
  environment: 'production',
  player: registry.appConfig.product.player,
})

describe('DICOM player pipeline integration', () => {
  beforeEach(async () => {
    stopLearningEventHandlersForTests()
    clearEventSubscribersForTests()
    useLearnerStore.getState().replaceWithSeed(registry.seed)
    useActivitySessionStore.getState().clear()
    await useActivitySessionStore.persist.clearStorage()
    initializeLearningProgressHandlers(integrationRegistry)
  })

  it('awards question XP, mastery and the primitive badge through learner events', async () => {
    const user = userEvent.setup()
    const initial = useLearnerStore.getState()
    const initialXp = initial.xp.total
    const initialMastery = initial.mastery['thoracic-imaging']?.score ?? 0
    const router = createMemoryRouter(
      [
        {
          path: '/play',
          element: (
            <ActivityPlayer
              plan={plan}
              previousAttempts={0}
              previousBestScore={null}
              continuePath="/done"
              exitPath="/exit"
            />
          ),
        },
      ],
      { initialEntries: ['/play'] },
    )
    render(
      <ContentContext.Provider value={integrationRegistry}>
        <RouterProvider router={router} />
      </ContentContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Create calibrated measurement' }))
    await user.click(screen.getByRole('button', { name: 'Check measurement' }))

    const result = useLearnerStore.getState()
    expect(result.xp.total).toBeGreaterThan(initialXp)
    expect(result.mastery['thoracic-imaging']?.score).toBeGreaterThan(initialMastery)
    expect(result.badges['first-dicom']?.unlockedAt).not.toBeNull()
  })
})
